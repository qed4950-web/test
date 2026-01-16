from datetime import datetime
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from backend.database import Base
from backend.services.rollback_worker import rollback_worker
from backend.models import Store, Deployment, Alert, RecipeVersion

def get_test_db():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(bind=engine)
    return Session()

def test_auto_rollback_trigger():
    db = get_test_db()
    
    # Setup Data
    v1 = RecipeVersion(id="v1", recipe_id="r1", version_label="v1", approval_status="APPROVED")
    db.add(v1)
    
    dep = Deployment(
        id="d1", 
        org_id="o1",
        recipe_version_id="v1", 
        scope="ALL_STORES",
        status="DEPLOYED",
        rollback_policy_json={"deviation_threshold": 10.0}
    )
    db.add(dep)
    
    # Store with HIGH deviation (15 > 10)
    s1 = Store(id="s1", org_id="o1", name="S1", status="ACTIVE", deviation=15.0, active_recipe_version_id="v1")
    db.add(s1)
    db.commit()
    
    # Run Worker
    rollback_worker.check_and_rollback_deployments(db)
    
    # Verify Rollback
    updated_dep = db.query(Deployment).filter(Deployment.id == "d1").first()
    assert updated_dep.status == "ROLLED_BACK"
    
    # Verify Store Revert (set to None in our simplified logic)
    updated_s1 = db.query(Store).filter(Store.id == "s1").first()
    assert updated_s1.active_recipe_version_id is None
    
    # Verify Alert
    alert = db.query(Alert).filter(Alert.store_id == "s1").first()
    assert alert is not None
    assert "Auto-rollback" in alert.message

def test_auto_rollback_no_trigger():
    db = get_test_db()
    
    # Setup Data (Safe deviation)
    v1 = RecipeVersion(id="v1", recipe_id="r1", version_label="v1", approval_status="APPROVED")
    db.add(v1)
    dep = Deployment(
        id="d1", 
        org_id="o1",
        recipe_version_id="v1", 
        scope="ALL_STORES", 
        status="DEPLOYED", 
        rollback_policy_json={"deviation_threshold": 20.0}
    )
    db.add(dep)
    s1 = Store(id="s1", org_id="o1", name="S1", status="ACTIVE", deviation=15.0, active_recipe_version_id="v1")
    db.add(s1)
    db.commit()
    
    # Run Worker
    rollback_worker.check_and_rollback_deployments(db)
    
    # Verify NO Rollback
    updated_dep = db.query(Deployment).first()
    assert updated_dep.status == "DEPLOYED"
