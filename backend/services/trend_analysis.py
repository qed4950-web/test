from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime
from .. import models
from typing import List, Dict, Any

class TrendAnalysisService:
    def record_daily_metric(self, db: Session, store_id: str, deviation: float, sales: float, date: datetime):
        """Record a daily snapshot of store metrics"""
        metric = models.StoreDailyMetric(
            store_id=store_id,
            date=date,
            avg_deviation=deviation,
            total_sales=sales
        )
        db.add(metric)
        db.commit()

    def analyze_trend(self, db: Session, store_id: str) -> Dict[str, Any]:
        """
        Analyze recent metrics to find trends.
        Returns: { "has_drift": bool, "trend_slope": float, "message": str }
        """
        # Fetch last 7 days metrics
        metrics = db.query(models.StoreDailyMetric).filter(
            models.StoreDailyMetric.store_id == store_id
        ).order_by(models.StoreDailyMetric.date.desc()).limit(7).all()
        
        if len(metrics) < 3:
            return {"has_drift": False, "message": "Insufficient data"}

        # Reverse to chronological order [Day 1, Day 2, Day 3 ...]
        metrics = metrics[::-1]
        deviations = [float(m.avg_deviation) for m in metrics]
        
        # 1. Simple Drift Detection: Is deviation increasing consecutively for last 3 days?
        is_increasing = all(x < y for x, y in zip(deviations[-3:], deviations[-2:]))
        
        # 2. Slope Calculation (Simple Rise/Run)
        slope = 0.0
        if len(deviations) >= 2:
            slope = deviations[-1] - deviations[0]

        if is_increasing and slope > 1.0:
             return {
                 "has_drift": True, 
                 "trend_slope": slope, 
                 "message": f"Deviation increasing consistently ({slope:.2f}% rise)"
             }

        return {"has_drift": False, "trend_slope": slope, "message": "Stable"}

trend_service = TrendAnalysisService()
