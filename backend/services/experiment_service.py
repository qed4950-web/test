from sqlalchemy.orm import Session
from sqlalchemy import func
import random
from .. import models, schemas
from datetime import datetime

class ExperimentService:
    def create_experiment(self, db: Session, exp_create: schemas.ExperimentCreate, test_version_id: str, control_version_id: str):
        # Create Experiment Record
        experiment = models.Experiment(
            org_id=exp_create.org_id,
            name=exp_create.name,
            control_version_id=control_version_id,
            test_version_id=test_version_id,
            target_criteria_json=exp_create.target_criteria_json,
            start_date=exp_create.start_date,
            end_date=exp_create.end_date,
            status=schemas.ExperimentStatus.DRAFT
        )
        db.add(experiment)
        db.commit()
        db.refresh(experiment)
        return experiment

    def assign_stores(self, db: Session, experiment_id: str):
        """Randomly assign eligible stores to Control/Test groups"""
        experiment = db.query(models.Experiment).filter(models.Experiment.id == experiment_id).first()
        if not experiment:
            raise ValueError("Experiment not found")
            
        # 1. Find eligible stores (Simple mock: All active stores in org)
        # In real world: Filter by target_criteria_json (Region, Sales, etc.)
        stores = db.query(models.Store).filter(
            models.Store.org_id == experiment.org_id,
            models.Store.status == 'ACTIVE'
        ).all()
        
        assigned_count = 0
        for store in stores:
            # Random assignment 50/50
            group = 'TEST' if random.random() > 0.5 else 'CONTROL'
            store.experiment_group = group
            
            # Set active version based on group
            if group == 'TEST':
                store.active_recipe_version_id = experiment.test_version_id
            else:
                store.active_recipe_version_id = experiment.control_version_id
            
            assigned_count += 1
            
        experiment.status = schemas.ExperimentStatus.RUNNING
        db.commit()
        return {"assigned_stores": assigned_count}

experiment_service = ExperimentService()
