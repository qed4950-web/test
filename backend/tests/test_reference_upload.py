import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
import pandas as pd
import io

from backend.main import app
from backend.database import Base, get_db
from backend.models import Reference
from backend.schemas import ReferenceProcessStatus

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

# Patch SessionLocal used in background tasks to use our in-memory DB
from backend.routers import references
references.SessionLocal = TestingSessionLocal

client = TestClient(app)

def test_upload_reference_csv():
    # Create a dummy CSV
    data = {
        "name": ["Test Burger", "Spicy Chicken"],
        "menu_category": ["Burger", "Chicken"],
        "price": [12000, 18000],
        "description": ["Delicious beef burger", "Very hot chicken"]
    }
    df = pd.DataFrame(data)
    csv_buffer = io.BytesIO()
    df.to_csv(csv_buffer, index=False)
    csv_buffer.seek(0)
    
    response = client.post(
        "/v1/references/upload?org_id=test_org",
        files={"file": ("test.csv", csv_buffer, "text/csv")}
    )
    
    assert response.status_code == 200
    json_resp = response.json()
    assert len(json_resp) == 2
    
    # Verify DB
    db = TestingSessionLocal()
    refs = db.query(Reference).all()
    assert len(refs) == 2
    
    ref1 = next(r for r in refs if r.name == "Test Burger")
    assert ref1.menu_category == "Burger"
    assert ref1.process_status in [ReferenceProcessStatus.QUEUED, ReferenceProcessStatus.RUNNING, ReferenceProcessStatus.COMPLETED]
    # Check metadata
    assert ref1.metadata_json['price'] == 12000
    assert "description" in ref1.metadata_json
    
    ref2 = next(r for r in refs if r.name == "Spicy Chicken")
    
    # Check if background task likely triggered (mock logic puts it to COMPLETED or FAILED quickly)
    # Since TestClient runs background tasks via Starlette's BackgroundTask, they might run synchronously or accessible.
    # Note: TestClient in recent FastAPI/Starlette executes background tasks immediately after response.
    
    db.refresh(ref2)
    # Our mocked logic in references service might have run.
    # Let's see. If the background task ran, metrics should be populated.
    # Depending on how the task was added.
    
    db.close()
