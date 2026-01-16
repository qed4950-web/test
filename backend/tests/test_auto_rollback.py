from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from datetime import datetime

from backend.database import Base
from backend import models, schemas
from backend.services.auto_rollback import AutoRollbackService

# Setup In-Memory DB
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base.metadata.create_all(bind=engine)

def test_auto_rollback_logic():
    db = TestingSessionLocal()
    
    # 0. Setup: Recipe Version
    version = models.RecipeVersion(id="ver_rollback_test", recipe_id="r1", version_label="v1")
    db.add(version)
    
    # 1. Setup: Bad Deployment (Active, Threshold=10%)
    bad_deployment = models.Deployment(
        id="dep_bad",
        org_id="org1",
        recipe_version_id="ver_rollback_test",
        scope="ALL_STORES",
        status="DEPLOYED",
        rollback_condition_json={"deviation_threshold": 10.0}
    )
    db.add(bad_deployment)
    
    # 2. Setup: Stores for Bad Deployment (High Deviation)
    store_bad = models.Store(
        id="store_bad", org_id="org1", name="Bad Store",
        active_recipe_version_id="ver_rollback_test",
        deviation=15.0 # Exceeds 10%
    )
    db.add(store_bad)
    
    # 3. Setup: Good Deployment (Active, Threshold=20%)
    good_deployment = models.Deployment(
        id="dep_good",
        org_id="org1",
        recipe_version_id="ver_rollback_test", # Same version but different deployment config/time in reality, reusing for simplicity
        scope="ALL_STORES",
        status="DEPLOYED",
        rollback_condition_json={"deviation_threshold": 20.0}
    )
    db.add(good_deployment)
    
    # Store deviation (15.0) is LESS than Good Deployment threshold (20.0), so it should NOT rollback
    
    db.commit()
    
    # 4. Run Check
    service = AutoRollbackService(db)
    rolled_back = service.check_and_rollback()
    
    # 5. Verify
    assert "dep_bad" in rolled_back
    assert "dep_good" not in rolled_back
    
    db.refresh(bad_deployment)
    db.refresh(good_deployment)
    
    assert bad_deployment.status == "ROLLED_BACK"
    assert good_deployment.status == "DEPLOYED"
    
    # Verify Alert
    alert = db.query(models.Alert).filter(models.Alert.message.contains("dep_bad")).first()
    assert alert is not None
    assert alert.severity == schemas.AlertSeverity.CRITICAL
    
    db.close()
