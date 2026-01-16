from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from backend.database import Base
from backend import models, schemas
from backend.services.dna_generator import generate_dna_signature, get_radar_animation_data

# Setup In-Memory DB
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base.metadata.create_all(bind=engine)

def test_generate_dna_signature():
    db = TestingSessionLocal()
    
    # 1. Create a Reference with Fingerprint
    ref = models.Reference(
        id="ref_spicy_chicken",
        org_id="org1",
        name="Spicy Chicken",
        reference_type="BRAND",
        menu_category="Chicken",
        source_kind="MARKET",
        status="ACTIVE"
    )
    db.add(ref)
    
    # Vector: High spicy (0.9), low sweet (0.2), high umami (0.85)
    fp = models.ReferenceFingerprint(
        id="fp1",
        reference_id="ref_spicy_chicken",
        version=1,
        vector=[0.9, 0.2, 0.85, 0.3, 0.6]  # [spicy, sweet, umami, fresh, rich]
    )
    db.add(fp)
    db.commit()
    
    # 2. Generate DNA Signature
    sig = generate_dna_signature("ref_spicy_chicken", "org1", db)
    
    # 3. Verify
    assert sig.id is not None
    assert sig.brand_id == "ref_spicy_chicken"
    assert sig.vector_profile == [0.9, 0.2, 0.85, 0.3, 0.6]
    
    # Dominant traits should be top 2 (spicy=0.9, umami=0.85)
    assert "매운맛" in sig.dominant_traits
    assert "감칠맛" in sig.dominant_traits
    
    # Color should be red (spicy is dominant)
    assert sig.color_hex == "#FF4136"
    
    # Pattern should be SPIKE (high variance) or RADIAL (max > 0.8)
    assert sig.pattern_type in [schemas.PatternType.SPIKE, schemas.PatternType.RADIAL]
    
    # Icon seed should be deterministic
    assert len(sig.icon_seed) == 16
    
    db.close()

def test_radar_animation_data():
    db = TestingSessionLocal()
    
    # Setup: Reference + Transform + Result
    ref = models.Reference(
        id="ref_original",
        org_id="org1",
        name="Original",
        reference_type="ANCHOR",
        menu_category="Chicken",
        source_kind="MARKET"
    )
    db.add(ref)
    
    fp = models.ReferenceFingerprint(
        id="fp_orig",
        reference_id="ref_original",
        version=1,
        vector=[0.5, 0.5, 0.5, 0.5, 0.5]
    )
    db.add(fp)
    
    # Recipe Version (result of transform)
    recipe = models.Recipe(id="r1", org_id="org1", name="Test Recipe", menu_category="Chicken")
    db.add(recipe)
    
    recipe_ver = models.RecipeVersion(
        id="ver_result",
        recipe_id="r1",
        version_label="v1",
        fingerprint_vector=[0.9, 0.3, 0.8, 0.2, 0.7]  # Changed vector
    )
    db.add(recipe_ver)
    
    # Transform
    transform = models.Transform(
        id="transform_1",
        org_id="org1",
        mode="DISTANCE",
        reference_1_id="ref_original",
        result_recipe_version_id="ver_result"
    )
    db.add(transform)
    db.commit()
    
    # Get animation data
    data = get_radar_animation_data("transform_1", db)
    
    # Verify
    assert data["before"] == [0.5, 0.5, 0.5, 0.5, 0.5]
    assert data["after"] == [0.9, 0.3, 0.8, 0.2, 0.7]
    
    # Delta should show changes
    assert data["delta"][0] == 0.4  # spicy changed by 0.4
    
    # Highlight should include axis 0 (biggest change)
    assert 0 in data["highlight_axes"]
    
    # Animation keyframes
    assert len(data["animation_keyframes"]) == 5
    assert data["animation_keyframes"][0]["t"] == 0
    assert data["animation_keyframes"][-1]["t"] == 1.0
    
    db.close()
