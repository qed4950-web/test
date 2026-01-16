from datetime import datetime, timedelta
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from backend.database import Base
from backend.services.trend_analysis import trend_service
from backend.models import Store, StoreDailyMetric

# Setup in-memory DB for Unit Test
def get_test_db():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(bind=engine)
    return Session()

def test_record_metric():
    db = get_test_db()
    
    trend_service.record_daily_metric(db, "s1", 5.0, 1000.0, datetime.utcnow())
    
    metric = db.query(StoreDailyMetric).first()
    assert metric.store_id == "s1"
    assert float(metric.avg_deviation) == 5.0

def test_detect_drift_positive():
    db = get_test_db()
    
    # Day 1: 5.0
    trend_service.record_daily_metric(db, "s1", 5.0, 1000.0, datetime.utcnow() - timedelta(days=3))
    # Day 2: 7.0
    trend_service.record_daily_metric(db, "s1", 7.0, 1000.0, datetime.utcnow() - timedelta(days=2))
    # Day 3: 10.0
    trend_service.record_daily_metric(db, "s1", 10.0, 1000.0, datetime.utcnow() - timedelta(days=1))
    
    result = trend_service.analyze_trend(db, "s1")
    assert result["has_drift"] == True
    assert "increasing" in result["message"]

def test_detect_drift_negative():
    db = get_test_db()
    
    # Random fluctuation
    trend_service.record_daily_metric(db, "s1", 5.0, 1000.0, datetime.utcnow() - timedelta(days=3))
    trend_service.record_daily_metric(db, "s1", 4.0, 1000.0, datetime.utcnow() - timedelta(days=2))
    trend_service.record_daily_metric(db, "s1", 6.0, 1000.0, datetime.utcnow() - timedelta(days=1))
    
    result = trend_service.analyze_trend(db, "s1")
    assert result["has_drift"] == False
