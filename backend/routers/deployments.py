from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from .. import models, schemas
from ..database import get_db

router = APIRouter(
    prefix="/v1/deployments",
    tags=["deployments"],
)

@router.post("/", response_model=schemas.Deployment)
def create_deployment(deployment: schemas.DeploymentCreate, db: Session = Depends(get_db)):
    # Verify recipe version exists
    version = db.query(models.RecipeVersion).filter(models.RecipeVersion.id == deployment.recipe_version_id).first()
    if not version:
        raise HTTPException(status_code=404, detail="Recipe Version not found")
        
    # Check if version is approved
    if version.approval_status != schemas.VersionApprovalStatus.APPROVED:
        raise HTTPException(status_code=400, detail="Only APPROVED versions can be deployed")

    db_deployment = models.Deployment(**deployment.dict())
    
    # If scheduled, status remains SCHEDULED (default), else if immediate we might set to DEPLOYED?
    # For now, let's assume everything starts as SCHEDULED or we add logic.
    # If scheduled_at is None, we could treat it as immediate deployment.
    
    if not deployment.scheduled_at:
        db_deployment.status = 'DEPLOYED'
        # Logic to actually push config to stores would go here or via separate worker
        
    db.add(db_deployment)
    db.commit()
    db.refresh(db_deployment)
    return db_deployment

@router.post("/check-rollback")
def trigger_rollback_check(db: Session = Depends(get_db)):
    """
    Manually trigger the auto-rollback worker.
    Scans active deployments and rolls them back if conditions are met.
    """
    from ..services.auto_rollback import AutoRollbackService
    service = AutoRollbackService(db)
    rolled_back_ids = service.check_and_rollback()
    return {"rolled_back_ids": rolled_back_ids}

@router.get("/", response_model=List[schemas.Deployment])
def read_deployments(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    deployments = db.query(models.Deployment).offset(skip).limit(limit).all()
    return deployments
