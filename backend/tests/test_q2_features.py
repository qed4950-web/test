from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from backend.database import Base
from backend import models, schemas
from backend.services.signature_inventor import invent_signature, calculate_conflict_map

# Setup In-Memory DB
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base.metadata.create_all(bind=engine)

def test_invent_signature():
    db = TestingSessionLocal()
    
    # Setup: Two references to combine
    ref1 = models.Reference(
        id="ref_spicy",
        org_id="org1",
        name="Spicy Chicken",
        reference_type="BRAND",
        menu_category="Chicken",
        source_kind="MARKET"
    )
    db.add(ref1)
    
    fp1 = models.ReferenceFingerprint(
        id="fp_spicy",
        reference_id="ref_spicy",
        vector=[0.9, 0.2, 0.6, 0.2, 0.5]  # Spicy dominant
    )
    db.add(fp1)
    
    ref2 = models.Reference(
        id="ref_sweet",
        org_id="org1",
        name="Sweet Chicken",
        reference_type="BRAND",
        menu_category="Chicken",
        source_kind="MARKET"
    )
    db.add(ref2)
    
    fp2 = models.ReferenceFingerprint(
        id="fp_sweet",
        reference_id="ref_sweet",
        vector=[0.2, 0.9, 0.5, 0.3, 0.6]  # Sweet dominant
    )
    db.add(fp2)
    db.commit()
    
    # Invent signature with UNIQUE direction
    sig = invent_signature(
        base_reference_ids=["ref_spicy", "ref_sweet"],
        direction=schemas.SignatureDirection.UNIQUE,
        org_id="org1",
        db=db
    )
    
    # Verify
    assert sig.id is not None
    assert sig.generated_name is not None
    assert len(sig.generated_name) > 0
    assert sig.generated_story is not None
    assert len(sig.concept_keywords) > 0
    assert len(sig.vector) == 5
    
    # Vector should be different from simple average
    assert sig.vector != [0.55, 0.55, 0.55, 0.25, 0.55]
    
    db.close()

def test_conflict_map():
    db = TestingSessionLocal()
    
    # Setup: Brand and competitors (reuse previous data)
    brand = models.Reference(
        id="brand_1",
        org_id="org1",
        name="My Brand",
        reference_type="ANCHOR",
        menu_category="Chicken",
        source_kind="INTERNAL"
    )
    db.add(brand)
    
    brand_fp = models.ReferenceFingerprint(
        id="fp_brand",
        reference_id="brand_1",
        vector=[0.6, 0.5, 0.7, 0.4, 0.5]  # Balanced with umami focus
    )
    db.add(brand_fp)
    
    comp = models.Reference(
        id="comp_similar",
        org_id="org1",
        name="Similar Competitor",
        reference_type="BRAND",
        menu_category="Chicken",
        source_kind="MARKET"
    )
    db.add(comp)
    
    comp_fp = models.ReferenceFingerprint(
        id="fp_comp_sim",
        reference_id="comp_similar",
        vector=[0.5, 0.6, 0.7, 0.3, 0.5]  # Very similar to brand
    )
    db.add(comp_fp)
    db.commit()
    
    # Calculate conflict map
    result = calculate_conflict_map(
        brand_id="brand_1",
        competitor_ids=["comp_similar"],
        db=db
    )
    
    # Verify
    assert "conflict_zones" in result
    assert "unique_zones" in result
    assert "overall_similarity" in result
    
    # High overlap expected (similar vectors)
    assert result["overall_similarity"] > 0.7
    
    # Should have some conflict zones
    total_zones = len(result["conflict_zones"]) + len(result["unique_zones"])
    assert total_zones == 5  # All 5 axes should be analyzed
    
    db.close()
