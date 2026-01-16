from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from datetime import datetime

from backend.database import Base
from backend import models, schemas
from backend.services.log_processor import process_execution_log

# Setup In-Memory DB
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base.metadata.create_all(bind=engine)

def test_log_ingestion_and_alert():
    db = TestingSessionLocal()
    
    # 0. Setup Store
    store = models.Store(id="store_gangnam", org_id="demo_org", name="Gangnam Branch")
    db.add(store)
    db.commit()
    
    # 1. Normal Log (No Deviation)
    log_normal = schemas.ExecutionLogCreate(
        store_id="store_gangnam",
        recipe_version_id="ver_1",
        event_type=schemas.ExecutionLogType.STEP,
        payload_json={
            "step_name": "Salting",
            "measured": 10.5,
            "target": 10.0,
            "unit": "g"
        }
    )
    # Deviation = (10.5 - 10) / 10 = 5% (Under 10% threshold)
    process_execution_log(log_normal, "demo_org", db)
    
    alerts = db.query(models.Alert).all()
    assert len(alerts) == 0
    
    # 2. Deviated Log (High Deviation)
    log_deviated = schemas.ExecutionLogCreate(
        store_id="store_gangnam",
        recipe_version_id="ver_1",
        event_type=schemas.ExecutionLogType.STEP,
        payload_json={
            "step_name": "Frying",
            "measured": 180.0,  # Took 180s
            "target": 120.0,    # Target 120s
            "unit": "s"
        }
    )
    # Deviation = (180 - 120) / 120 = 50% (Over 10% threshold)
    process_execution_log(log_deviated, "demo_org", db)
    
    # Verify Alert Created
    alerts = db.query(models.Alert).all()
    assert len(alerts) == 1
    assert alerts[0].alert_type == schemas.AlertType.DEVIATION_HIGH
    assert "Frying" in alerts[0].message
    assert "50.0%" in alerts[0].message
    
    # Verify Store Deviation Updated
    db.refresh(store)
    # The naive logic updates store.deviation to the latest high deviation
    assert store.deviation is not None
    float_deviation = float(store.deviation)
    assert float_deviation >= 50.0
    
    db.close()
