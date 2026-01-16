from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from backend.database import Base
from backend import models
from backend.services.advanced_features import (
    get_transform_rules,
    apply_transform_rule,
    calculate_synergy_map,
    explore_vector_search
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

def test_get_transform_rules():
    """Test getting available transform rules"""
    rules = get_transform_rules()
    
    assert len(rules) >= 5
    assert any(r["key"] == "spicy_boost" for r in rules)
    assert any(r["key"] == "balanced_smooth" for r in rules)

def test_apply_transform_rule():
    """Test applying transform rule to vector"""
    vector = [0.5, 0.5, 0.5, 0.5, 0.5]
    
    result = apply_transform_rule(vector, "spicy_boost", intensity=1.0)
    
    assert result["rule_applied"] == "spicy_boost"
    assert result["result_vector"][0] > vector[0]  # Spicy increased
    assert result["result_vector"][1] < vector[1]  # Sweet decreased

def test_apply_balance_rule():
    """Test balance rule on uneven vector"""
    uneven = [0.9, 0.1, 0.5, 0.3, 0.7]
    
    result = apply_transform_rule(uneven, "balanced_smooth", intensity=1.0)
    
    # Should be more balanced
    result_range = max(result["result_vector"]) - min(result["result_vector"])
    original_range = max(uneven) - min(uneven)
    assert result_range < original_range

def test_synergy_map():
    """Test synergy/conflict calculation"""
    db = TestingSessionLocal()
    
    # Create products with similar profiles
    ref1 = models.Reference(
        id="syn_ref1",
        org_id="org1",
        name="Spicy A",
        reference_type="BRAND",
        menu_category="Chicken",
        source_kind="MARKET"
    )
    db.add(ref1)
    fp1 = models.ReferenceFingerprint(
        id="fp_syn1",
        reference_id="syn_ref1",
        vector=[0.9, 0.2, 0.7, 0.3, 0.6]
    )
    db.add(fp1)
    
    ref2 = models.Reference(
        id="syn_ref2",
        org_id="org1",
        name="Spicy B",
        reference_type="BRAND",
        menu_category="Chicken",
        source_kind="MARKET"
    )
    db.add(ref2)
    fp2 = models.ReferenceFingerprint(
        id="fp_syn2",
        reference_id="syn_ref2",
        vector=[0.85, 0.25, 0.75, 0.2, 0.55]  # Similar to Spicy A
    )
    db.add(fp2)
    db.commit()
    
    result = calculate_synergy_map(["syn_ref1", "syn_ref2"], db)
    
    assert result["analyzed_products"] == 2
    assert result["synergy_count"] >= 0
    assert result["balance_score"] >= 0
    assert result["portfolio_health"] in ["EXCELLENT", "GOOD", "NEEDS_WORK"]
    
    db.close()

def test_vector_exploration():
    """Test vector space exploration"""
    target_kpi = {"sales_lift": 0.15, "differentiation": 0.4}
    constraints = {"max_spicy": 0.8}
    
    result = explore_vector_search(
        target_kpi=target_kpi,
        constraints=constraints,
        iterations=50
    )
    
    assert len(result["optimal_vector"]) == 5
    assert result["optimization_score"] > 0
    assert result["iterations_run"] == 50
    assert len(result["dominant_traits"]) == 2
    
    # Check constraint was applied
    assert result["optimal_vector"][0] <= 0.8  # max_spicy
