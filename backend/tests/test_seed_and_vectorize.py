from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
import pytest

from backend.main import app
from backend.database import Base, get_db
from backend.models import Reference, ReferenceFingerprint, Organization

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

def test_seed_data():
    # Call Seed Endpoint
    response = client.post("/v1/references/demo/seed")
    assert response.status_code == 200
    
    # Verify Data
    db = TestingSessionLocal()
    refs = db.query(Reference).all()
    # Expect 2 references (Anchor + Brand)
    assert len(refs) == 2
    
    anchor = db.query(Reference).filter_by(id="anchor_demo").first()
    assert anchor is not None
    assert anchor.menu_category == "Burger"

def test_rule_based_vectorize():
    # 1. Create a reference without vector but with keywords
    db = TestingSessionLocal()
    ref = Reference(
        id="ref_keyword",
        org_id="test_org", 
        name="Spicy Burger",
        menu_category="Burger",
        metadata_json={"keywords": ["spicy", "hot"]}, # Should result in high spiciness (dim 0)
        reference_type="BRAND",
        source_kind="MARKET",
        process_status="QUEUED"
    )
    db.add(ref)
    db.commit()
    db.close()
    
    # 2. Call Vectorize Endpoint
    response = client.post("/v1/references/ref_keyword/vectorize")
    assert response.status_code == 200
    data = response.json()
    assert "vector" in data
    
    # "spicy" (0.3) + "hot" (0.4) = 0.7 added to base 0.5 => capped at 1.0 or similar logic
    # Base 0.5. dim 0 += 0.3 -> 0.8. dim 0 += 0.4 -> 1.2 -> 1.0
    vector = data["vector"]
    assert vector[0] >= 0.8 
    
    # Verify DB update
    db = TestingSessionLocal()
    fp = db.query(ReferenceFingerprint).filter_by(reference_id="ref_keyword").first()
    assert fp is not None
    assert fp.vector[0] == vector[0]
