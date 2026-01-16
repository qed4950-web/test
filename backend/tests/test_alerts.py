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
    # S1: Low deviation (Safe)
    s1 = Store(id="s1", org_id="org_1", name="S1", status="ACTIVE", deviation=5.0)
    # S2: High deviation (Critical)
    s2 = Store(id="s2", org_id="org_1", name="S2", status="ACTIVE", deviation=30.0)
    # S3: Medium-High deviation (High)
    s3 = Store(id="s3", org_id="org_1", name="S3", status="ACTIVE", deviation=22.0)
    
    db.add(s1)
    db.add(s2)
    db.add(s3)
    db.commit()
    db.close()

def test_check_deviations():
    setup_data()
    
    response = client.post("/v1/alerts/check-deviations")
    assert response.status_code == 200
    data = response.json()
    assert data["message"].startswith("2 new alerts") # S2 and S3 should trigger
    
    # Verify DB content
    db = TestingSessionLocal()
    alerts = db.query(Alert).all()
    assert len(alerts) == 2
    
    # Check Severity logic (>= 25 -> CRITICAL, >= 20 -> HIGH)
    a_s2 = next(a for a in alerts if a.store_id == "s2")
    assert a_s2.severity == "CRITICAL"
    # Verify Root Cause Analysis (Mocked LLM returns "Mock text response")
    assert a_s2.root_cause_analysis == "Mock text response"
    
    a_s3 = next(a for a in alerts if a.store_id == "s3")
    assert a_s3.severity == "HIGH"
    # High severity (not Critical) skips analysis in our simple logic?
    # Logic: if severity == 'CRITICAL' -> analyze.
    assert a_s3.root_cause_analysis is None
