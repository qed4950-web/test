from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from backend.database import Base
from backend import models
from backend.services.fun_features import (
    generate_menu_name_and_concept,
    mix_battle,
    analyze_risk_radar,
    optimize_portfolio,
    time_machine_restore
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

def test_naming_generator():
    """Test menu name and concept generation"""
    vector = [0.9, 0.3, 0.7, 0.2, 0.6]  # Spicy dominant
    
    result = generate_menu_name_and_concept(
        vector=vector,
        category="Chicken",
        style="premium"
    )
    
    assert result["generated_name"] is not None
    assert len(result["generated_name"]) > 0
    assert result["dominant_trait"] == "매운맛"
    assert result["concept_story"] is not None
    assert len(result["keywords"]) > 0

def test_mix_battle():
    """Test mix battle scoring"""
    db = TestingSessionLocal()
    
    # Create two references
    ref1 = models.Reference(
        id="battle_ref1",
        org_id="org1",
        name="Spicy Fighter",
        reference_type="BRAND",
        menu_category="Chicken",
        source_kind="MARKET"
    )
    db.add(ref1)
    
    fp1 = models.ReferenceFingerprint(
        id="fp_b1",
        reference_id="battle_ref1",
        vector=[0.9, 0.2, 0.6, 0.3, 0.5]
    )
    db.add(fp1)
    
    ref2 = models.Reference(
        id="battle_ref2",
        org_id="org1",
        name="Sweet Contender",
        reference_type="BRAND",
        menu_category="Chicken",
        source_kind="MARKET"
    )
    db.add(ref2)
    
    fp2 = models.ReferenceFingerprint(
        id="fp_b2",
        reference_id="battle_ref2",
        vector=[0.3, 0.9, 0.5, 0.4, 0.6]
    )
    db.add(fp2)
    db.commit()
    
    # Run battle
    result = mix_battle("battle_ref1", "battle_ref2", 0.5, db)
    
    assert result["ref1"]["name"] == "Spicy Fighter"
    assert result["ref2"]["name"] == "Sweet Contender"
    assert len(result["result_vector"]) == 5
    assert "total" in result["scores"]
    assert 0 <= result["scores"]["total"] <= 100
    
    db.close()

def test_risk_radar():
    """Test risk analysis"""
    # Extreme spicy vector
    extreme_vector = [0.95, 0.1, 0.5, 0.2, 0.4]
    result = analyze_risk_radar(extreme_vector, "Extreme Spicy")
    
    assert len(result["warnings"]) > 0
    assert result["risk_score"] > 0
    
    # Check for excess warning
    excess_warnings = [w for w in result["warnings"] if w["type"] == "EXCESS"]
    assert len(excess_warnings) > 0

def test_portfolio_optimization():
    """Test portfolio optimization"""
    db = TestingSessionLocal()
    
    # Create 3 products
    for i, name in enumerate(["Product A", "Product B", "Product C"]):
        ref = models.Reference(
            id=f"portfolio_{i}",
            org_id="org1",
            name=name,
            reference_type="BRAND",
            menu_category="Chicken",
            source_kind="INTERNAL"
        )
        db.add(ref)
        
        # Different vectors for coverage
        vectors = [
            [0.2, 0.8, 0.5, 0.3, 0.4],  # Sweet
            [0.8, 0.2, 0.7, 0.4, 0.6],  # Spicy
            [0.5, 0.5, 0.9, 0.5, 0.5],  # Umami
        ]
        fp = models.ReferenceFingerprint(
            id=f"fp_port_{i}",
            reference_id=f"portfolio_{i}",
            vector=vectors[i]
        )
        db.add(fp)
    
    db.commit()
    
    result = optimize_portfolio(
        reference_ids=["portfolio_0", "portfolio_1", "portfolio_2"],
        target_coverage=0.5,
        db=db
    )
    
    assert result["total_products"] == 3
    assert len(result["axis_coverage"]) == 5
    assert result["overall_coverage"] > 0
    
    db.close()

def test_time_machine():
    """Test era-based flavor transformation"""
    current = [0.7, 0.4, 0.6, 0.5, 0.6]  # Modern taste
    
    result = time_machine_restore(
        current_vector=current,
        target_era="1990s",
        category="Chicken"
    )
    
    assert result["target_era"] == "1990s"
    assert len(result["restored_vector"]) == 5
    assert result["era_story"] is not None
    
    # 1990s should have less spicy
    assert result["restored_vector"][0] < current[0]
