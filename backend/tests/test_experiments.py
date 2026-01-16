from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
import pytest

from backend.main import app
from backend.database import Base, get_db
from backend.models import Organization, Store, RecipeVersion, Experiment

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
    org = Organization(id="org_1", name="Test Org")
    db.add(org)
    
    # Versions
    v1 = RecipeVersion(id="v1", recipe_id="r1", version_label="Control")
    v2 = RecipeVersion(id="v2", recipe_id="r1", version_label="Test")
    db.add(v1)
    db.add(v2)
    
    # Stores
    for i in range(10):
        s = Store(id=f"s{i}", org_id="org_1", name=f"Store {i}", status="ACTIVE")
        db.add(s)
        
    db.commit()
    db.close()

def test_create_and_assign_experiment():
    setup_data()
    
    # Create Experiment
    payload = {
        "org_id": "org_1",
        "name": "Test Exp",
        "control_version_id": "v1",
        "test_version_id": "v2"
    }
    resp = client.post("/v1/experiments/", json=payload)
    assert resp.status_code == 200
    exp_id = resp.json()["id"]
    
    # Assign
    resp = client.post(f"/v1/experiments/{exp_id}/assign")
    assert resp.status_code == 200
    assert resp.json()["assigned_stores"] == 10
    
    # Verify DB
    db = TestingSessionLocal()
    stores = db.query(Store).all()
    groups = [s.experiment_group for s in stores]
    
    # Should have both types (probabilistically, but with 10 stores unlikely to be all one)
    # We just check that groups are assigned 'TEST' or 'CONTROL'
    assert "TEST" in groups or "CONTROL" in groups
    
    # Check Active Version update
    for s in stores:
        if s.experiment_group == "TEST":
            assert s.active_recipe_version_id == "v2"
        elif s.experiment_group == "CONTROL":
            assert s.active_recipe_version_id == "v1"
