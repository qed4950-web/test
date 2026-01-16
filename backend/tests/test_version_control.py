from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from datetime import datetime
import pytest

from backend.main import app
from backend.database import Base, get_db
from backend.models import User, Recipe, RecipeVersion
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
    
    # Create Admin User
    admin = User(id="admin_user_id", email="admin@test.com", role='ADMIN')
    db.add(admin)
    
    # Create Recipe
    recipe = Recipe(id="recipe_1", name="Test Recipe", menu_category="Test", org_id="org_1")
    db.add(recipe)
    
    # Create Versions
    v1 = RecipeVersion(
        id="v1", 
        recipe_id="recipe_1", 
        version_label="v1", 
        fingerprint_vector=[1.0, 2.0, 3.0],
        spec_yaml="salt: 10g",
        approval_status=VersionApprovalStatus.PENDING
    )
    v2 = RecipeVersion(
        id="v2", 
        recipe_id="recipe_1", 
        version_label="v2", 
        fingerprint_vector=[1.1, 2.1, 3.1],
        spec_yaml="salt: 12g",
        approval_status=VersionApprovalStatus.PENDING
    )
    db.add(v1)
    db.add(v2)
    db.commit()
    db.close()

def test_diff_versions():
    setup_data()
    
    response = client.get("/v1/recipes/diff_versions?v1_id=v1&v2_id=v2")
    assert response.status_code == 200
    data = response.json()
    
    assert data["v1_label"] == "v1"
    assert data["v2_label"] == "v2"
    
    # Check vector delta (floating point precision safe check roughly)
    delta = data["vector_delta"]
    assert len(delta) == 3
    assert abs(delta[0] - 0.1) < 0.0001
    assert abs(delta[1] - 0.1) < 0.0001
    
    assert data["param_delta"] == "Specs are different"

def test_approve_version():
    # Only admin can approve, but our mock defaults `user_id` to "admin_user_id" in the router
    # effectively simulating an admin call.
    
    response = client.post("/v1/recipes/versions/v1/approve?user_id=admin_user_id")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "APPROVED"
    
    # Verify DB
    db = TestingSessionLocal()
    v1 = db.query(RecipeVersion).filter(RecipeVersion.id == "v1").first()
    assert v1.approval_status == VersionApprovalStatus.APPROVED
    assert v1.approved_by == "admin_user_id"
    assert v1.approved_at is not None
    db.close()
