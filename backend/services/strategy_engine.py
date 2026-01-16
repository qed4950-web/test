import random
from typing import Dict, Any, List

def calculate_risks(
    ref1_id: str, 
    ref2_id: str, 
    strategy_mode: str, 
    db_session
) -> Dict[str, float]:
    """
    Calculate risk factors for a given strategy application.
    This is a mock implementation that would be replaced by complex vector analysis.
    """
    # Mock logic based on strategy mode
    risks = {
        "brand_conflict": 0.05,
        "price_position_conflict": 0.05,
        "operational_complexity": 0.1
    }
    
    if strategy_mode == 'COPY':
        # Copying another brand is high risk for brand conflict
        risks["brand_conflict"] = 0.85
        risks["price_position_conflict"] = 0.4
    
    elif strategy_mode == 'DISTANCE':
        # Reducing distance is safer
        risks["brand_conflict"] = 0.2
        risks["operational_complexity"] = 0.3
        
    elif strategy_mode == 'REDIRECT':
        # Changing direction is risky operationally
        risks["operational_complexity"] = 0.7
        risks["brand_conflict"] = 0.1

    return risks

def predict_kpis(
    target_vector: List[float],
    strategy_mode: str
) -> Dict[str, float]:
    """
    Predict KPIs for the resulting recipe.
    """
    # Mock prediction logic
    # In reality, this would use a regression model on the vector
    
    kpis = {
        "repurchase_rate": 0.5,
        "margin_rate": 0.25,
        "review_score_prediction": 4.2
    }
    
    # Simple heuristics
    if strategy_mode == 'COPY':
        kpis["repurchase_rate"] = 0.7 # Copying successful recipe
    elif strategy_mode == 'REDIRECT':
        kpis["margin_rate"] = 0.3
        
    # Add some randomness for simulation
    kpis["repurchase_rate"] += random.uniform(-0.05, 0.05)
    kpis["review_score_prediction"] += random.uniform(-0.2, 0.2)
    
    return kpis

def recommend_best_strategy(
    ref1_id: str,
    ref2_id: str
) -> str:
    """
    Recommend the best strategy mode based on low risk and high potential.
    """
    # Simply return DISTANCE for now as safer bet
    return 'DISTANCE'
