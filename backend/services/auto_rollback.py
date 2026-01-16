from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime
from backend import models, schemas

class AutoRollbackService:
    def __init__(self, db: Session):
        self.db = db

    def check_and_rollback(self):
        """
        Scans all DEPLOYED deployments and checks if they violate rollback conditions.
        Returns a list of rolled-back deployment IDs.
        """
        # 1. Find Active Deployments
        active_deployments = self.db.query(models.Deployment).filter(
            models.Deployment.status == "DEPLOYED"
        ).all()
        
        rolled_back_ids = []
        
        for dep in active_deployments:
            if self._should_rollback(dep):
                self._execute_rollback(dep)
                rolled_back_ids.append(dep.id)
                
        return rolled_back_ids

    def _should_rollback(self, deployment: models.Deployment) -> bool:
        """
        Evaluates rollback conditions.
        Currently supports: "deviation_threshold" (percentage)
        """
        if not deployment.rollback_condition_json:
            return False
            
        conditions = deployment.rollback_condition_json
        threshold = conditions.get("deviation_threshold")
        
        if threshold is None:
            return False
            
        # 2. Calculate average deviation for target stores
        # For simplicity, we assume ALL stores for now if target_group is empty
        # In a real scenario, filtering by region/group would happen here.
        
        # Query Stores linked to this version (or just all active stores for this Org logic)
        # Assuming stores running this version are those with active_recipe_version_id
        
        # Note: If deployment scope is ALL_STORES, we check all stores with this version.
        try:
            avg_deviation = self.db.query(func.avg(models.Store.deviation)).filter(
                models.Store.active_recipe_version_id == deployment.recipe_version_id,
                models.Store.deviation.isnot(None)
            ).scalar()
            
            if avg_deviation is None:
                return False
                
            deployment_deviation = float(avg_deviation)
            
            if deployment_deviation > float(threshold):
                return True
                
        except Exception as e:
            print(f"Error checking rollback for {deployment.id}: {e}")
            return False
            
        return False

    def _execute_rollback(self, deployment: models.Deployment):
        """
        Performs the rollback action:
        1. Update Deployment Status -> ROLLED_BACK
        2. Create Critical Alert
        """
        # 1. Update Status
        deployment.status = "ROLLED_BACK"
        # In a real system, we would also revert Store.active_recipe_version_id here
        
        # 2. Create Alert
        alert = models.Alert(
            id=models.generate_uuid(),
            org_id=deployment.org_id,
            alert_type=schemas.AlertType.SYSTEM_ERROR, # Or specific ROLLBACK type
            severity=schemas.AlertSeverity.CRITICAL,
            message=f"Auto-rollback triggered for Deployment {deployment.id}. Deviation exceeded threshold."
        )
        self.db.add(alert)
        self.db.commit()
