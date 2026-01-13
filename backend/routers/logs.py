from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from .. import models
from ..database import get_db
from pydantic import BaseModel
from datetime import datetime

router = APIRouter(
    prefix="/v1/logs",
    tags=["logs"],
)

class LogResponse(BaseModel):
    id: str
    store_id: str | None
    recipe_version_id: str | None
    event_type: str
    ts: datetime
    payload_json: dict | None = None

    class Config:
        from_attributes = True

@router.get("/", response_model=List[LogResponse])
def read_logs(skip: int = 0, limit: int = 50, db: Session = Depends(get_db)):
    logs = db.query(models.ExecutionLog).order_by(models.ExecutionLog.ts.desc()).offset(skip).limit(limit).all()
    return logs
