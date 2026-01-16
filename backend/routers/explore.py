from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from pydantic import BaseModel

from backend import models
from backend.database import get_db
from backend.services.advanced_features import (
    get_transform_rules,
    apply_transform_rule,
    calculate_synergy_map,
    explore_vector_search
)

router = APIRouter(
    prefix="/v1",
    tags=["explore"],
)

# --- Schemas ---
class TransformRuleApplyRequest(BaseModel):
    vector: List[float]
    rule_key: str
    intensity: float = 1.0

class SynergyMapRequest(BaseModel):
    reference_ids: List[str]

class VectorSearchRequest(BaseModel):
    target_kpi: Dict[str, float] = {"sales_lift": 0.1}
    constraints: Dict[str, Any] = {}
    iterations: int = 100

# --- Endpoints ---

@router.get("/transforms/rules")
def list_transform_rules():
    """
    Get all available predefined transform rules.
    Rules can be applied to vectors for quick transformations.
    """
    return get_transform_rules()

@router.post("/transforms/apply-rule")
def apply_rule_to_vector(request: TransformRuleApplyRequest):
    """
    Apply a predefined transform rule to a vector.
    Intensity controls how strongly the rule is applied (0-1).
    """
    try:
        return apply_transform_rule(
            vector=request.vector,
            rule_key=request.rule_key,
            intensity=request.intensity
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/analysis/synergy-map")
def get_synergy_map(
    request: SynergyMapRequest,
    db: Session = Depends(get_db)
):
    """
    Calculate synergy and conflict relationships between products.
    Identifies amplification opportunities and differentiation points.
    """
    try:
        return calculate_synergy_map(
            reference_ids=request.reference_ids,
            db=db
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/explore/vector-search")
def run_vector_exploration(request: VectorSearchRequest):
    """
    Explore vector space to find optimal profile for target KPI.
    Uses iterative optimization to find best-scoring vectors.
    
    Example target_kpi:
    - {"sales_lift": 0.1, "differentiation": 0.5}
    
    Example constraints:
    - {"max_spicy": 0.7, "min_umami": 0.4}
    """
    try:
        return explore_vector_search(
            target_kpi=request.target_kpi,
            constraints=request.constraints,
            iterations=request.iterations
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
