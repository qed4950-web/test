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
