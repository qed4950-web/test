from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from backend.database import Base
from backend import models, schemas
from backend.services.strategy_analyzer import analyze_strategy

# Setup In-Memory DB
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base.metadata.create_all(bind=engine)

def test_analyze_strategy_differentiate():
    db = TestingSessionLocal()
    
    # Setup: Anchor (our brand)
    anchor = models.Reference(
        id="anchor_1",
        org_id="org1",
        name="Our Fried Chicken",
        reference_type="ANCHOR",
        menu_category="Chicken",
        source_kind="INTERNAL"
    )
    db.add(anchor)
    
    anchor_fp = models.ReferenceFingerprint(
        id="fp_anchor",
        reference_id="anchor_1",
        vector=[0.5, 0.4, 0.6, 0.3, 0.5]  # Balanced
    )
    db.add(anchor_fp)
    
    # Setup: Competitors
    comp1 = models.Reference(
        id="comp_1",
        org_id="org1",
        name="Spicy Competitor A",
        reference_type="BRAND",
        menu_category="Chicken",
        source_kind="MARKET"
    )
    db.add(comp1)
    
    comp1_fp = models.ReferenceFingerprint(
        id="fp_comp1",
        reference_id="comp_1",
        vector=[0.9, 0.2, 0.7, 0.1, 0.6]  # Very spicy
    )
    db.add(comp1_fp)
    
    comp2 = models.Reference(
        id="comp_2",
        org_id="org1",
        name="Sweet Competitor B",
        reference_type="BRAND",
        menu_category="Chicken",
        source_kind="MARKET"
    )
    db.add(comp2)
    
    comp2_fp = models.ReferenceFingerprint(
        id="fp_comp2",
        reference_id="comp_2",
        vector=[0.3, 0.8, 0.5, 0.4, 0.7]  # Sweet
    )
    db.add(comp2_fp)
    
    db.commit()
    
    # Analyze with DIFFERENTIATE goal
    report = analyze_strategy(
        anchor_id="anchor_1",
        competitor_ids=["comp_1", "comp_2"],
        goal=schemas.StrategyGoal.DIFFERENTIATE,
        org_id="org1",
        db=db
    )
    
    # Verify
    assert report.id is not None
    assert report.anchor_id == "anchor_1"
    
    # Should recommend REDIRECT for differentiation
    assert report.recommended_mode == "REDIRECT"
    
    # Alpha should be reasonable
    assert 0.3 <= float(report.recommended_alpha) <= 1.0
    
    # KPI predictions should exist
    assert report.kpi_predictions is not None
    assert "sales_lift" in report.kpi_predictions
    
    # Risk scores should exist
    assert report.risk_scores is not None
    assert "brand_conflict" in report.risk_scores
    
    # Reasoning should contain meaningful text
    assert "분석 대상" in report.reasoning
    assert "추천 전략" in report.reasoning
    
    # Confidence should be reasonable
    assert 0 < float(report.confidence) <= 1.0
    
    db.close()

def test_analyze_strategy_increase_sales():
    db = TestingSessionLocal()
    
    # Reuse setup (StaticPool maintains data)
    report = analyze_strategy(
        anchor_id="anchor_1",
        competitor_ids=["comp_1"],
        goal=schemas.StrategyGoal.INCREASE_SALES,
        org_id="org1",
        db=db
    )
    
    # Should recommend DISTANCE for sales increase (move toward competitor)
    assert report.recommended_mode == "DISTANCE"
    
    # Sales lift should be positive
    assert report.kpi_predictions["sales_lift"] > 0
    
    db.close()
