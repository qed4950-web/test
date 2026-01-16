from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

from backend import models
from backend.database import get_db
from backend.services.trend_analyzer import (
    predict_trends, auto_search_strategy, 
    record_dna_evolution, get_dna_evolution_timeline
)

router = APIRouter(
    prefix="/v1",
    tags=["trends"],
)

# --- Schemas ---
class TrendPredictRequest(BaseModel):
    category: str
    lookback_months: int = 6

class TrendPrediction(BaseModel):
    axis: str
    direction: str
    magnitude: float
    confidence: float

class TrendPredictResponse(BaseModel):
    id: str
    period: str
    predictions: List[TrendPrediction]
    reasoning: str
    confidence: float
    data_points_count: int

class AutoSearchRequest(BaseModel):
    base_reference_id: str
    target_kpi: dict = {"sales_lift": 0.1}
    constraints: dict = {"risk_tolerance": "medium"}

class AutoSearchResponse(BaseModel):
    optimal_strategy: dict
    predicted_kpi: dict
    confidence: float
    search_iterations: int
    alternatives: List[dict]

class DNAEvolutionEntry(BaseModel):
    date: str
    vector: List[float]
    event: str
    notes: Optional[str]
    delta: Optional[List[float]]

class DNAEvolutionResponse(BaseModel):
    timeline: List[dict]
    total_drift: float
    significant_shifts: List[dict]

# --- Endpoints ---
@router.post("/trends/predict", response_model=TrendPredictResponse)
def predict_flavor_trends(
    request: TrendPredictRequest,
    org_id: str = "demo_org",
    db: Session = Depends(get_db)
):
    """
    Predict flavor trends for a category.
    Analyzes historical data to identify rising/falling axes.
    """
    try:
        report = predict_trends(
            category=request.category,
            lookback_months=request.lookback_months,
            org_id=org_id,
            db=db
        )
        
        return TrendPredictResponse(
            id=report.id,
            period=report.period,
            predictions=[TrendPrediction(**p) for p in report.predictions_json],
            reasoning=report.reasoning,
            confidence=float(report.confidence),
            data_points_count=report.data_points_count
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/strategies/auto-search", response_model=AutoSearchResponse)
def auto_search_strategy_endpoint(
    request: AutoSearchRequest,
    org_id: str = "demo_org",
    db: Session = Depends(get_db)
):
    """
    Automatically search for optimal strategy to meet KPI targets.
    Tries multiple goals and returns best match.
    """
    try:
        result = auto_search_strategy(
            base_reference_id=request.base_reference_id,
            target_kpi=request.target_kpi,
            constraints=request.constraints,
            org_id=org_id,
            db=db
        )
        return AutoSearchResponse(**result)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/brands/{brand_id}/evolution")
def record_evolution(
    brand_id: str,
    event_type: str = "MANUAL",
    notes: str = "",
    db: Session = Depends(get_db)
):
    """Record a new DNA evolution snapshot for a brand"""
    try:
        evo = record_dna_evolution(brand_id, event_type, notes, db)
        return {
            "id": evo.id,
            "brand_id": evo.brand_id,
            "vector_snapshot": evo.vector_snapshot,
            "event_type": evo.event_type,
            "created_at": evo.created_at
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.get("/brands/{brand_id}/evolution", response_model=DNAEvolutionResponse)
def get_evolution_timeline(
    brand_id: str,
    db: Session = Depends(get_db)
):
    """Get DNA evolution timeline for a brand"""
    result = get_dna_evolution_timeline(brand_id, db)
    return DNAEvolutionResponse(**result)
