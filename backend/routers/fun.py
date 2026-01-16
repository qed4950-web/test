from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel

from backend import models
from backend.database import get_db
from backend.services.fun_features import (
    generate_menu_name_and_concept,
    create_vector_snapshot,
    mix_battle,
    analyze_risk_radar,
    optimize_portfolio,
    time_machine_restore
)

router = APIRouter(
    prefix="/v1",
    tags=["fun"],
)

# --- Schemas ---
class NamingRequest(BaseModel):
    vector: List[float]
    category: str = "Chicken"
    style: str = "premium"

class NamingResponse(BaseModel):
    generated_name: str
    concept_story: str
    keywords: List[str]
    dominant_trait: str
    secondary_trait: str
    style: str

class SnapshotRequest(BaseModel):
    reference_id: str
    title: Optional[str] = None

class MixBattleRequest(BaseModel):
    ref1_id: str
    ref2_id: str
    mix_ratio: float = 0.5

class RiskRadarRequest(BaseModel):
    vector: List[float]
    reference_name: str = ""

class PortfolioRequest(BaseModel):
    reference_ids: List[str]
    target_coverage: float = 0.5

class TimeMachineRequest(BaseModel):
    current_vector: List[float]
    target_era: str = "2010s"
    category: str = "General"

# --- Endpoints ---

@router.post("/naming/generate", response_model=NamingResponse)
def generate_naming(request: NamingRequest):
    """
    Generate creative menu name and concept story.
    Styles: premium, fun, elegant
    """
    result = generate_menu_name_and_concept(
        vector=request.vector,
        category=request.category,
        style=request.style
    )
    return NamingResponse(**result)

@router.post("/snapshots/create")
def create_snapshot(
    request: SnapshotRequest,
    org_id: str = "demo_org",
    db: Session = Depends(get_db)
):
    """
    Create shareable snapshot card of a flavor profile.
    """
    try:
        return create_vector_snapshot(
            reference_id=request.reference_id,
            title=request.title,
            org_id=org_id,
            db=db
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.post("/battles/mix")
def run_mix_battle(
    request: MixBattleRequest,
    db: Session = Depends(get_db)
):
    """
    Mix two references and score the result.
    Great for comparing and combining flavors.
    """
    try:
        return mix_battle(
            ref1_id=request.ref1_id,
            ref2_id=request.ref2_id,
            mix_ratio=request.mix_ratio,
            db=db
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.post("/analysis/risk-radar")
def get_risk_radar(request: RiskRadarRequest):
    """
    Analyze flavor vector for potential risks.
    Detects excess, deficit, imbalance, and bland profiles.
    """
    return analyze_risk_radar(
        vector=request.vector,
        reference_name=request.reference_name
    )

@router.post("/portfolio/optimize")
def optimize_menu_portfolio(
    request: PortfolioRequest,
    db: Session = Depends(get_db)
):
    """
    Optimize menu portfolio for coverage and differentiation.
    Identifies gaps and overlaps in your menu.
    """
    try:
        return optimize_portfolio(
            reference_ids=request.reference_ids,
            target_coverage=request.target_coverage,
            db=db
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/timemachine/restore")
def restore_era_flavor(request: TimeMachineRequest):
    """
    Transform flavor to match a specific era's taste profile.
    Available eras: 1990s, 2000s, 2010s, 2020s
    """
    try:
        return time_machine_restore(
            current_vector=request.current_vector,
            target_era=request.target_era,
            category=request.category
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
