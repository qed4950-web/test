from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from backend.database import Base
from backend import models
from backend.services.reverse_engineer import reverse_engineer_reference, _rule_based_analysis

# Setup In-Memory DB
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base.metadata.create_all(bind=engine)

def test_rule_based_analysis():
    """Test the fallback rule-based analysis"""
    # High spicy, medium umami, low others
    vector = [0.9, 0.2, 0.7, 0.3, 0.5]
    
    result = _rule_based_analysis(vector, "Spicy Chicken")
    
    # Structure summary should exist
    assert result["structure_summary"] is not None
    assert "%" in result["structure_summary"]
    
    # Primary factors should have 3 items
    assert len(result["primary_factors"]) == 3
    
    # Top factor should be spicy (매운맛)
    top_factor = result["primary_factors"][0]
    assert top_factor["name"] == "매운맛"
    
    # Cooking params should exist
    assert "fire_intensity" in result["cooking_params"]
    assert result["cooking_params"]["fire_intensity"] > 0.5  # High fire for spicy
    
    # Confidence should be 0.7 for rule-based
    assert result["confidence"] == 0.7

def test_reverse_engineer_full():
    """Test full reverse engineering flow (will use fallback)"""
    db = TestingSessionLocal()
    
    # Create reference with fingerprint
    ref = models.Reference(
        id="ref_for_reverse",
        org_id="org1",
        name="Sweet Garlic Chicken",
        reference_type="BRAND",
        menu_category="Chicken",
        source_kind="MARKET",
        metadata_json={"keywords": ["달콤한", "마늘", "바삭"]}
    )
    db.add(ref)
    
    fp = models.ReferenceFingerprint(
        id="fp_reverse",
        reference_id="ref_for_reverse",
        version=1,
        vector=[0.3, 0.8, 0.6, 0.4, 0.7]  # Sweet dominant
    )
    db.add(fp)
    db.commit()
    
    # Run reverse engineering
    analysis = reverse_engineer_reference("ref_for_reverse", db)
    
    # Verify result
    assert analysis.id is not None
    assert analysis.reference_id == "ref_for_reverse"
    assert analysis.structure_summary is not None
    assert "%" in analysis.structure_summary
    
    # Sweet should be dominant
    assert "단맛" in analysis.structure_summary
    
    # Confidence should exist
    assert analysis.confidence is not None
    
    db.close()
