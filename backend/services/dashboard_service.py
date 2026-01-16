from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from .. import models
from typing import Dict, Any

def get_dashboard_summary(db: Session, org_id: str) -> Dict[str, Any]:
    # Aggregated metrics for dashboard
    
    # 1. Total References (R&D corpus size)
    total_references = db.query(models.Reference).filter(
        models.Reference.org_id == org_id
    ).count()

    # 2. Average Strategy Confidence (model output quality)
    avg_confidence = db.query(func.avg(models.StrategyReport.confidence)).filter(
        models.StrategyReport.org_id == org_id
    ).scalar() or 0.0

    # 3. Pipeline Alerts (failed transforms in last 24h)
    since = datetime.utcnow() - timedelta(days=1)
    pipeline_alerts = db.query(models.Transform).filter(
        models.Transform.org_id == org_id,
        models.Transform.status == 'FAILED',
        models.Transform.created_at >= since
    ).count()

    # 4. Queued Experiments (batch experiment runs)
    queued_experiments = db.query(models.ExperimentRun).filter(
        models.ExperimentRun.org_id == org_id,
        models.ExperimentRun.status.in_(["QUEUED", "RUNNING"])
    ).count()

    return {
        "active_references": total_references,
        "quality_score": float(round(float(avg_confidence) * 100, 1)),
        "pipeline_alerts": pipeline_alerts,
        "queued_experiments": queued_experiments
    }

def get_dashboard_trends(db: Session, org_id: str) -> Dict[str, Any]:
    """
    Return last 7 days of experiment counts and success rate derived from transforms.
    """
    today = datetime.utcnow().date()
    start_date = today - timedelta(days=6)

    transforms = db.query(models.Transform).filter(
        models.Transform.org_id == org_id,
        models.Transform.created_at >= datetime.combine(start_date, datetime.min.time())
    ).all()

    buckets: Dict[str, Dict[str, int]] = {}
    for i in range(7):
        day = start_date + timedelta(days=i)
        buckets[day.isoformat()] = {"total": 0, "success": 0, "failed": 0}

    for tx in transforms:
        day_key = tx.created_at.date().isoformat()
        if day_key not in buckets:
            continue
        buckets[day_key]["total"] += 1
        if tx.status == "SUCCEEDED":
            buckets[day_key]["success"] += 1
        elif tx.status == "FAILED":
            buckets[day_key]["failed"] += 1

    trend = []
    for i in range(7):
        day = start_date + timedelta(days=i)
        bucket = buckets[day.isoformat()]
        attempts = bucket["success"] + bucket["failed"]
        success_rate = round((bucket["success"] / attempts) * 100, 1) if attempts > 0 else 0.0
        trend.append({
            "day": day.strftime("%a"),
            "experiments": bucket["total"],
            "success_rate": success_rate,
        })

    return {"trend": trend}
