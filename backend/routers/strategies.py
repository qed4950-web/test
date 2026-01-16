from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List

from backend import models, schemas
from backend.database import get_db
from backend.database import get_db
from backend.services.strategy_analyzer import analyze_strategy, analyze_strategy_generator

router = APIRouter(
    prefix="/v1/strategies",
    tags=["strategies"],
)

@router.post("/analyze", response_model=schemas.StrategyReport)
def analyze_strategy_endpoint(
    request: schemas.StrategyAnalyzeRequest,
    org_id: str = "demo_org",
    db: Session = Depends(get_db)
):
    """
    Analyze competitors and recommend optimal strategy.
    
    Returns:
    - Recommended mode (COPY/DISTANCE/REDIRECT)
    - Optimal alpha (intensity)
    - KPI predictions (sales_lift, cost_delta)
    - Risk scores (brand_conflict, price_mismatch)
    - Reasoning (human-readable explanation)
    """
    try:
        report = analyze_strategy(
            anchor_id=request.anchor_id,
            competitor_ids=request.competitor_ids,
            goal=request.goal,
            org_id=org_id,
            db=db
        )
        
        # Transform to response format
        return schemas.StrategyReport(
            id=report.id,
            org_id=report.org_id,
            anchor_id=report.anchor_id,
            recommended_strategy=schemas.RecommendedStrategy(
                mode=report.recommended_mode,
                alpha=float(report.recommended_alpha),
                target_id=report.recommended_target_id
            ),
            kpi_predictions=schemas.KPIPrediction(**report.kpi_predictions),
            risk_scores=schemas.RiskScores(**report.risk_scores),
            reasoning=report.reasoning,
            confidence=float(report.confidence),
            created_at=report.created_at
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/analyze/stream")
def analyze_strategy_stream_endpoint(
    request: schemas.StrategyAnalyzeRequest,
    org_id: str = "demo_org",
    db: Session = Depends(get_db)
):
    """
    Stream analysis progress and reasoning.
    Events:
    - type: progress (message)
    - type: token (text)
    - type: complete (result: StrategyReport)
    """
    return StreamingResponse(
        analyze_strategy_generator(
            anchor_id=request.anchor_id,
            competitor_ids=request.competitor_ids,
            goal=request.goal,
            org_id=org_id,
            db=db
        ),
        media_type="text/event-stream"
    )

@router.get("/reports", response_model=List[schemas.StrategyReport])
def get_strategy_reports(
    org_id: str = "demo_org",
    limit: int = 10,
    db: Session = Depends(get_db)
):
    """Get recent strategy reports"""
    reports = db.query(models.StrategyReport).filter(
        models.StrategyReport.org_id == org_id
    ).order_by(models.StrategyReport.created_at.desc()).limit(limit).all()
    
    return [
        schemas.StrategyReport(
            id=r.id,
            org_id=r.org_id,
            anchor_id=r.anchor_id,
            recommended_strategy=schemas.RecommendedStrategy(
                mode=r.recommended_mode,
                alpha=float(r.recommended_alpha) if r.recommended_alpha else 0,
                target_id=r.recommended_target_id
            ),
            kpi_predictions=schemas.KPIPrediction(**(r.kpi_predictions or {})),
            risk_scores=schemas.RiskScores(**(r.risk_scores or {})),
            reasoning=r.reasoning or "",
            confidence=float(r.confidence) if r.confidence else 0,
            created_at=r.created_at
        ) for r in reports
    ]
