from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import models, schemas
from ..database import get_db
from ..services.experiment_service import experiment_service

router = APIRouter(
    prefix="/v1/experiments",
    tags=["experiments"],
)

@router.post("/", response_model=schemas.Experiment)
def create_experiment(exp: schemas.ExperimentCreate, db: Session = Depends(get_db)):
    # Verify versions exist
    # Simplified: assume input IDs are valid or service handles it
    try:
        return experiment_service.create_experiment(
            db, 
            exp, 
            test_version_id=exp.test_version_id, 
            control_version_id=exp.control_version_id
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/{experiment_id}/assign")
def assign_experiment(experiment_id: str, db: Session = Depends(get_db)):
    try:
        result = experiment_service.assign_stores(db, experiment_id)
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
