from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from datetime import datetime, timedelta

from backend.database import Base
from backend import models
from backend.services.trend_analyzer import (
    predict_trends, record_dna_evolution, get_dna_evolution_timeline
)

# Setup In-Memory DB
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base.metadata.create_all(bind=engine)

def test_predict_trends():
    db = TestingSessionLocal()
    
    # Create some test references in Chicken category
    for i in range(5):
        ref = models.Reference(
            id=f"ref_trend_{i}",
            org_id="org1",
            name=f"Chicken Product {i}",
            reference_type="BRAND",
            menu_category="Chicken",
            source_kind="MARKET"
        )
        db.add(ref)
        
        # Varying vectors - trending toward spicy
        spicy_val = 0.4 + (i * 0.1)  # Increasing spicy trend
        fp = models.ReferenceFingerprint(
            id=f"fp_trend_{i}",
            reference_id=f"ref_trend_{i}",
            vector=[spicy_val, 0.5, 0.6, 0.3, 0.5]
        )
        db.add(fp)
    
    db.commit()
    
    # Predict trends
    report = predict_trends(
        category="Chicken",
        lookback_months=12,
        org_id="org1",
        db=db
    )
    
    # Verify
    assert report.id is not None
    assert report.category == "Chicken"
    assert report.period is not None
    assert len(report.predictions_json) > 0
    assert report.reasoning is not None
    assert report.confidence > 0
    assert report.data_points_count == 5
    
    db.close()

def test_dna_evolution():
    db = TestingSessionLocal()
    
    # Create a brand
    brand = models.Reference(
        id="brand_evolve",
        org_id="org1",
        name="Evolving Brand",
        reference_type="ANCHOR",
        menu_category="Chicken",
        source_kind="INTERNAL"
    )
    db.add(brand)
    
    fp = models.ReferenceFingerprint(
        id="fp_evolve",
        reference_id="brand_evolve",
        vector=[0.5, 0.5, 0.5, 0.5, 0.5]
    )
    db.add(fp)
    db.commit()
    
    # Record initial evolution
    evo1 = record_dna_evolution("brand_evolve", "INITIAL", "Initial DNA snapshot", db)
    assert evo1.id is not None
    assert evo1.event_type == "INITIAL"
    
    # Change the fingerprint
    fp.vector = [0.8, 0.3, 0.7, 0.2, 0.6]
    db.commit()
    
    # Record recipe change
    evo2 = record_dna_evolution("brand_evolve", "RECIPE_CHANGE", "Major spicy boost", db)
    assert evo2.event_type == "RECIPE_CHANGE"
    
    # Get timeline
    timeline = get_dna_evolution_timeline("brand_evolve", db)
    
    assert len(timeline["timeline"]) == 2
    assert timeline["total_drift"] > 0
    
    db.close()

def test_trend_low_data():
    """Test trend prediction with insufficient data"""
    db = TestingSessionLocal()
    
    # Only 1 reference - not enough data
    ref = models.Reference(
        id="ref_solo",
        org_id="org1",
        name="Solo Product",
        reference_type="BRAND",
        menu_category="Pizza",
        source_kind="MARKET"
    )
    db.add(ref)
    db.commit()
    
    # Should still work with lower confidence
    report = predict_trends("Pizza", 6, "org1", db)
    
    assert report.confidence <= 0.5  # Low confidence due to insufficient data
    assert "부족" in report.reasoning  # Should mention insufficient data
    
    db.close()
