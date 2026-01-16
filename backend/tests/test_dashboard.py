from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from datetime import datetime
import pytest

from backend.main import app
from backend.database import Base, get_db
from backend.models import Organization, Store, Alert

# Setup in-memory DB
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base.metadata.create_all(bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)

def setup_data():
    db = TestingSessionLocal()
    
    # Create Organization
    org = Organization(id="org_1", name="Test Org")
    db.add(org)
    
    # Create Stores
    s1 = Store(id="s1", org_id="org_1", name="S1", status="ACTIVE", deviation=5.0)
    s2 = Store(id="s2", org_id="org_1", name="S2", status="ACTIVE", deviation=10.0)
    s3 = Store(id="s3", org_id="org_1", name="S3", status="INACTIVE", deviation=0.0)
    db.add(s1)
    db.add(s2)
    db.add(s3)
    
    # Create Alerts
    a1 = Alert(id="a1", org_id="org_1", alert_type="DEVIATION_HIGH", severity="CRITICAL", message="High dev", is_resolved=0)
    a2 = Alert(id="a2", org_id="org_1", alert_type="SYSTEM_ERROR", severity="LOW", message="Log err", is_resolved=0)
    db.add(a1)
    db.add(a2)
    
    db.commit()
    db.close()

def test_dashboard_summary():
    setup_data()
    
    response = client.get("/v1/dashboard/summary?org_id=org_1")
    assert response.status_code == 200
    data = response.json()
    
    assert data["active_stores"] == 2
    assert data["critical_alerts"] == 1
    # Average deviation of active stores? 
    # Logic in service queries ALL stores for deviation?
    # service: db.query(func.avg(models.Store.deviation)).filter(models.Store.org_id == org_id)
    # (5+10+0)/3 = 5.0
    assert data["average_deviation"] == 5.0
    assert data["quality_score"] == 95.0
