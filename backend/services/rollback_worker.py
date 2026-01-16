from sqlalchemy.orm import Session
from datetime import datetime
from .. import models
from typing import List

class RollbackWorker:
    def check_and_rollback_deployments(self, db: Session):
        """
        Check all active deployments for rollback conditions.
        If condition met (e.g. deviation > threshold), triggering rollback.
        """
        # Find deployments that are DEPLOYED and have a policy
        deployments = db.query(models.Deployment).filter(
            models.Deployment.status == 'DEPLOYED',
            models.Deployment.rollback_policy_json.isnot(None)
        ).all()
        
        for dep in deployments:
            policy = dep.rollback_policy_json
            threshold = policy.get("deviation_threshold", 20.0)
            
            # Find stores using this deployment (via recipe version)
            # In a real app, we might track which stores belong to which deployment explicitly
            # Here we assume stores using the recipe_version of the deployment
            stores = db.query(models.Store).filter(
                models.Store.active_recipe_version_id == dep.recipe_version_id
            ).all()
            
            bad_stores_count = 0
            for store in stores:
                if float(store.deviation or 0) > threshold:
                    bad_stores_count += 1
            
            # If significant failure (e.g. > 1 store failing, or logic based on policy)
            # Simplified: If any store fails > threshold
            if bad_stores_count > 0:
                self._execute_rollback(db, dep, f"Deviation exceeded {threshold}% in {bad_stores_count} stores")

    def _execute_rollback(self, db: Session, deployment: models.Deployment, reason: str):
        print(f"ROLLBACK TRIGGERED: Deployment {deployment.id} - {reason}")
        
        # 1. Update Deployment Status
        deployment.status = 'ROLLED_BACK'
        
        # 2. Revert Stores (Simplified: Set active_recipe to None or previous)
        # In real world: find previous version for each store.
        # Here: Set to None (fallback to default) and create Alert
        stores = db.query(models.Store).filter(
            models.Store.active_recipe_version_id == deployment.recipe_version_id
        ).all()
        
        for store in stores:
            store.active_recipe_version_id = None # Logic to find previous version omitted for brevity
            
            # Create Alert
            alert = models.Alert(
                org_id=store.org_id,
                store_id=store.id,
                alert_type='SYSTEM_ERROR',
                severity='CRITICAL',
                message=f"Auto-rollback: {reason}",
                is_resolved=0
            )
            db.add(alert)
        
        db.commit()

rollback_worker = RollbackWorker()
