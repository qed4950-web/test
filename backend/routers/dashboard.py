from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from ..services import dashboard_service
from typing import Dict, Any

router = APIRouter(
    prefix="/v1/dashboard",
    tags=["dashboard"],
)

@router.get("/summary", response_model=Dict[str, Any])
def get_dashboard_summary(org_id: str = "demo_org", db: Session = Depends(get_db)):
    return dashboard_service.get_dashboard_summary(db, org_id)

@router.get("/trends", response_model=Dict[str, Any])
def get_dashboard_trends(org_id: str = "demo_org", db: Session = Depends(get_db)):
    return dashboard_service.get_dashboard_trends(db, org_id)

@router.get("/cfo-radar", response_model=Dict[str, Any])
def get_cfo_radar(org_id: str = "demo_org"):
    # Simulated CFO Radar Data
    return {
        "metrics": [
            {"subject": "재무 안정성 (Stability)", "A": 85, "fullMark": 100},
            {"subject": "성장성 (Growth)", "A": 92, "fullMark": 100},
            {"subject": "수익성 (Profit)", "A": 78, "fullMark": 100},
            {"subject": "세무 효율 (Tax)", "A": 65, "fullMark": 100},  # Low efficiency, needs improvement
            {"subject": "유동성 (Cash)", "A": 88, "fullMark": 100},
        ],
        "insight": "현재 '세무 효율'이 업계 평균 대비 낮습니다. 고용 증대 세액 공제 등을 놓치고 있을 가능성이 높습니다."
    }
