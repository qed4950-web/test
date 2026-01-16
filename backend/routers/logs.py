from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional

from backend import models, schemas
from backend.database import get_db
from backend.services.log_processor import process_execution_log

router = APIRouter(
    prefix="/v1/logs",
    tags=["logs"],
)

@router.get("/", response_model=List[schemas.ExecutionLog])
def get_execution_logs(
    org_id: str = "demo_org",
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Get execution logs list"""
    return db.query(models.ExecutionLog).filter(
        models.ExecutionLog.org_id == org_id
    ).order_by(models.ExecutionLog.ts.desc()).limit(limit).all()

@router.post("/execution", response_model=schemas.ExecutionLog)
def create_execution_log(
    log_data: schemas.ExecutionLogCreate,
    org_id: str = "demo_org", # Auth placeholder
    db: Session = Depends(get_db)
):
    """
    Ingest execution log from store.
    Triggers deviation check synchronously (for demo purposes).
    """
    try:
        log_db = process_execution_log(log_data, org_id, db)
        return log_db
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/alerts", response_model=List[schemas.Alert])
def get_alerts(org_id: str = "demo_org", db: Session = Depends(get_db)):
    """Get active alerts"""
    return db.query(models.Alert).filter(
        models.Alert.org_id == org_id,
        models.Alert.is_resolved == 0
    ).order_by(models.Alert.created_at.desc()).all()
