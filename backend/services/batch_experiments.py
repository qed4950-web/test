import time
import asyncio
from typing import List
from sqlalchemy.orm import Session
from backend import models, schemas
from backend.services.strategy_analyzer import analyze_strategy

def run_batch_experiment(
    base_reference_id: str,
    target_reference_ids: List[str],
    modes: List[str],
    alphas: List[float],
    org_id: str,
    db: Session
) -> models.ExperimentRun:
    """
    Run batch experiment with multiple strategy combinations.
    Returns ExperimentRun with aggregated results.
    """
    start_time = time.time()
    
    # Calculate total combinations
    total = len(target_reference_ids) * len(modes) * len(alphas)
    
    # Create experiment run record
    run = models.ExperimentRun(
        id=models.generate_uuid(),
        org_id=org_id,
        config_json={
            "base_reference_id": base_reference_id,
            "target_reference_ids": target_reference_ids,
            "modes": modes,
            "alphas": alphas
        },
        status="RUNNING",
        total_combinations=total,
        completed_count=0,
        results_json=[]
    )
    db.add(run)
    db.commit()
    
    results = []
    completed = 0
    
    try:
        # Run each combination
        for target_id in target_reference_ids:
            for mode in modes:
                for alpha in alphas:
                    try:
                        # Simulate strategy analysis for this combination
                        result = _run_single_combination(
                            base_reference_id, target_id, mode, alpha, org_id, db
                        )
                        results.append({
                            "config": {
                                "target_id": target_id,
                                "mode": mode,
                                "alpha": alpha
                            },
                            "result": result
                        })
                    except Exception as e:
                        results.append({
                            "config": {
                                "target_id": target_id,
                                "mode": mode,
                                "alpha": alpha
                            },
                            "error": str(e)
                        })
                    
                    completed += 1
                    run.completed_count = completed
                    db.commit()
        
        # Complete
        run.status = "COMPLETED"
        run.results_json = results
        run.duration_ms = int((time.time() - start_time) * 1000)
        db.commit()
        
    except Exception as e:
        run.status = "FAILED"
        run.results_json = {"error": str(e), "partial_results": results}
        db.commit()
    
    db.refresh(run)
    return run

def _run_single_combination(base_id: str, target_id: str, mode: str, alpha: float, org_id: str, db: Session) -> dict:
    """
    Run a single strategy combination and return simplified result.
    """
    # Get vectors
    base_ref = db.query(models.Reference).filter(models.Reference.id == base_id).first()
    target_ref = db.query(models.Reference).filter(models.Reference.id == target_id).first()
    
    if not base_ref or not target_ref:
        raise ValueError("Reference not found")
    
    base_vec = base_ref.fingerprints[0].vector if base_ref.fingerprints else [0.5] * 5
    target_vec = target_ref.fingerprints[0].vector if target_ref.fingerprints else [0.5] * 5
    
    # Simulate result vector based on mode
    if mode == "COPY":
        result_vec = base_vec.copy()
    elif mode == "DISTANCE":
        result_vec = [base_vec[i] + alpha * (target_vec[i] - base_vec[i]) for i in range(5)]
    else:  # REDIRECT
        result_vec = [base_vec[i] - alpha * (target_vec[i] - base_vec[i]) for i in range(5)]
    
    # Clamp values
    result_vec = [max(0, min(1, v)) for v in result_vec]
    
    # Calculate predicted metrics
    distance = sum([(result_vec[i] - target_vec[i])**2 for i in range(5)]) ** 0.5
    
    return {
        "result_vector": result_vec,
        "distance_from_target": round(distance, 3),
        "predicted_sales_lift": round(0.05 + alpha * 0.1, 3),
        "execution_risk": round(alpha * 0.5, 2)
    }

def get_experiment_run_status(run_id: str, db: Session) -> dict:
    """Get experiment run status and progress"""
    run = db.query(models.ExperimentRun).filter(models.ExperimentRun.id == run_id).first()
    if not run:
        raise ValueError(f"Experiment run {run_id} not found")
    
    return {
        "id": run.id,
        "status": run.status,
        "completed": run.completed_count,
        "total": run.total_combinations,
        "progress_pct": round((run.completed_count / max(1, run.total_combinations)) * 100, 1),
        "duration_ms": run.duration_ms,
        "results": run.results_json if run.status == "COMPLETED" else None
    }
