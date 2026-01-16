from sqlalchemy.orm import Session
from datetime import datetime
from backend import models, schemas
import json

def process_execution_log(log_data: schemas.ExecutionLogCreate, org_id: str, db: Session):
    # 1. Save Log
    log_db = models.ExecutionLog(
        id=models.generate_uuid(),
        org_id=org_id,
        store_id=log_data.store_id,
        recipe_version_id=log_data.recipe_version_id,
        event_type=log_data.event_type,
        payload_json=log_data.payload_json
    )
    db.add(log_db)
    
    # 2. Check Deviation if event is 'STEP'
    if log_data.event_type == schemas.ExecutionLogType.STEP and log_data.payload_json:
        _check_step_deviation(log_data, org_id, db)

    db.commit()
    return log_db

def _check_step_deviation(log: schemas.ExecutionLogCreate, org_id: str, db: Session):
    """
    Simple rule-based deviation check.
    In real world, we would fetch RecipeVersion.spec_json and compare.
    Here we assume payload has 'measured' and 'target' keys for simplicity.
    """
    payload = log.payload_json
    
    step_name = payload.get('step_name', 'Unknown')
    
    # Example Payload: {"step_name": "Salting", "measured": 12.0, "target": 10.0, "unit": "g"}
    if 'measured' in payload and 'target' in payload:
        try:
            measured = float(payload['measured'])
            target = float(payload['target'])
            
            if target == 0:
                return # Avoid division by zero
                
            deviation_pct = abs((measured - target) / target) * 100.0
            
            # Threshold: 10%
            if deviation_pct > 10.0:
                _create_alert(
                    org_id, 
                    log.store_id, 
                    schemas.AlertType.DEVIATION_HIGH,
                    schemas.AlertSeverity.MEDIUM,
                    f"Deviation {deviation_pct:.1f}% in step '{step_name}'. Measured: {measured}, Target: {target}",
                    db
                )
                
                # Update Store Deviation Score (Mock accumulation)
                # In reality, this would be a rolling average
                store = db.query(models.Store).filter(models.Store.id == log.store_id).first()
                if store:
                    # Naively update deviation to the latest high deviation
                    store.deviation = deviation_pct
                    
        except ValueError:
            pass

def _create_alert(org_id: str, store_id: str, type: schemas.AlertType, severity: schemas.AlertSeverity, msg: str, db: Session):
    alert = models.Alert(
        id=models.generate_uuid(),
        org_id=org_id,
        store_id=store_id,
        alert_type=type,
        severity=severity,
        message=msg
    )
    db.add(alert)
