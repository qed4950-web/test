from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

from backend import models
from backend.database import get_db
from backend.services.llm_cache import llm_cache
from backend.services.batch_experiments import run_batch_experiment, get_experiment_run_status

router = APIRouter(
    prefix="/v1",
    tags=["benchmarks"],
)

# --- Schemas ---
class BatchExperimentRequest(BaseModel):
    base_reference_id: str
    target_reference_ids: List[str]
    modes: List[str] = ["COPY", "DISTANCE", "REDIRECT"]
    alphas: List[float] = [0.3, 0.5, 0.7]

class BatchExperimentResponse(BaseModel):
    experiment_id: str
    total_combinations: int
    status: str

class BenchmarkStats(BaseModel):
    cache_stats: dict
    total_transforms_24h: int
    avg_transform_time_ms: Optional[int]
    total_references: int
    total_recipes: int

# --- Endpoints ---
@router.post("/experiments/run", response_model=BatchExperimentResponse)
def run_experiment(
    request: BatchExperimentRequest,
    org_id: str = "demo_org",
    db: Session = Depends(get_db)
):
    """
    Run batch experiment with multiple strategy combinations.
    Processes all mode x alpha x target combinations.
    """
    try:
        run = run_batch_experiment(
            base_reference_id=request.base_reference_id,
            target_reference_ids=request.target_reference_ids,
            modes=request.modes,
            alphas=request.alphas,
            org_id=org_id,
            db=db
        )
        
        return BatchExperimentResponse(
            experiment_id=run.id,
            total_combinations=run.total_combinations,
            status=run.status
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/experiments/{run_id}/status")
def get_experiment_status(run_id: str, db: Session = Depends(get_db)):
    """Get experiment run status and results"""
    try:
        return get_experiment_run_status(run_id, db)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.get("/benchmarks", response_model=BenchmarkStats)
def get_benchmarks(db: Session = Depends(get_db)):
    """
    Get system performance benchmarks.
    Includes cache stats, processing metrics, and entity counts.
    """
    # Cache statistics
    cache_stats = llm_cache.get_cache_stats(db)
    
    # Entity counts
    total_references = db.query(models.Reference).count()
    total_recipes = db.query(models.Recipe).count()
    
    # Transform metrics (last 24h)
    from datetime import timedelta
    yesterday = datetime.utcnow() - timedelta(days=1)
    recent_transforms = db.query(models.Transform).filter(
        models.Transform.created_at >= yesterday
    ).count()
    
    # Average experiment run time
    completed_runs = db.query(models.ExperimentRun).filter(
        models.ExperimentRun.status == "COMPLETED",
        models.ExperimentRun.duration_ms.isnot(None)
    ).all()
    
    avg_time = None
    if completed_runs:
        avg_time = int(sum(r.duration_ms for r in completed_runs) / len(completed_runs))
    
    return BenchmarkStats(
        cache_stats=cache_stats,
        total_transforms_24h=recent_transforms,
        avg_transform_time_ms=avg_time,
        total_references=total_references,
        total_recipes=total_recipes
    )

@router.post("/cache/cleanup")
def cleanup_cache(db: Session = Depends(get_db)):
    """Remove expired cache entries"""
    deleted = llm_cache.cleanup_expired(db)
    return {"message": f"Cleaned up {deleted} expired cache entries"}
