from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from datetime import datetime, timedelta
import pytest

from backend.main import app
from backend.database import Base, get_db
from backend.models import User, Recipe, RecipeVersion, Deployment
from backend.schemas import VersionApprovalStatus

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
    from backend.models import Organization
    org = Organization(id="org_1", name="Test Org")
    db.add(org)
    
    # Create Recipe
    recipe = Recipe(id="recipe_1", name="Test Recipe", menu_category="Test", org_id="org_1")
    db.add(recipe)
    
    # Create Approved Version
    v1 = RecipeVersion(
        id="v1", 
        recipe_id="recipe_1", 
        version_label="v1",
        approval_status=VersionApprovalStatus.APPROVED
    )
    # Create Pending Version
    v2 = RecipeVersion(
        id="v2", 
        recipe_id="recipe_1", 
        version_label="v2",
        approval_status=VersionApprovalStatus.PENDING
    )
    db.add(v1)
    db.add(v2)
    db.commit()
    db.close()

def test_create_deployment_success():
    setup_data()
    
    # Deploy approved version
    payload = {
        "recipe_version_id": "v1",
        "scope": "SELECTED_STORES",
        "target_group_json": {"region": "SEOUL"},
        "scheduled_at": (datetime.utcnow() + timedelta(days=1)).isoformat()
    }
    
    response = client.post("/v1/deployments/", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "SCHEDULED"
    assert data["target_group_json"]["region"] == "SEOUL"

def test_create_deployment_fail_pending():
    # Try to deploy pending version
    payload = {
        "recipe_version_id": "v2",
        "scope": "ALL_STORES"
    }
    
    response = client.post("/v1/deployments/", json=payload)
    assert response.status_code == 400
    assert "Only APPROVED versions" in response.json()["detail"]
