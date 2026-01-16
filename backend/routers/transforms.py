from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List
import uuid
from .. import models, schemas
from ..database import get_db
from ..services import strategy_engine

router = APIRouter(
    prefix="/v1/transforms",
    tags=["transforms"],
)

def process_transform(transform_id: str):
    """Process transform in background - creates new DB session"""
    from ..database import SessionLocal
    db = SessionLocal()
    transform = None
    
    try:
        # Core Processing Logic
        transform = db.query(models.Transform).filter(models.Transform.id == transform_id).first()
        if not transform:
            return
        
        transform.status = 'RUNNING'
        db.commit()

        # Fetch References
        ref1 = db.query(models.Reference).filter(models.Reference.id == transform.reference_1_id).first()
        ref2 = db.query(models.Reference).filter(models.Reference.id == transform.reference_2_id).first()
        
        if not ref1 or not ref2:
            transform.status = 'FAILED'
            db.commit()
            return

        # Extract Vectors (Assume latest fingerprint v1 exists for MVP)
        vec1 = ref1.fingerprints[0].vector if ref1.fingerprints else []
        vec2 = ref2.fingerprints[0].vector if ref2.fingerprints else []
        
        if not vec1 or not vec2:
            transform.status = 'FAILED'
            db.commit()
            return

        # 1. Calculate Target Vector
        from ..services.transform_service import calculate_target_vector
        target_vector = calculate_target_vector(
            source_vec=vec2,  # Current
            target_vec=vec1,  # Anchor
            mode=transform.mode,
            alpha=float(transform.alpha) if transform.alpha else 0.0,
            direction=transform.direction_key
        )

        # 2. Generate Recipe Spec
        from ..services.recipe_generator import generate_recipe_spec
        recipe_yaml = generate_recipe_spec(target_vector)

        # Create Result Recipe Container
        menu_cat = ref1.menu_category
        new_recipe = models.Recipe(
            org_id=transform.org_id,
            name=f"Generated {transform.mode} {transform.created_at.strftime('%m%d-%H%M')}",
            menu_category=menu_cat
        )
        db.add(new_recipe)
        db.commit()

        # Predict KPIs
        predicted_kpis = strategy_engine.predict_kpis(target_vector, transform.mode)

        # Create Result Version
        new_version = models.RecipeVersion(
            recipe_id=new_recipe.id,
            version_label="v1.0.1-auto",
            spec_yaml=recipe_yaml,
            fingerprint_vector=target_vector,
            predicted_kpi_json=predicted_kpis,
            created_from_transform_id=transform.id
        )
        db.add(new_version)
        db.commit()

        # Update Transform
        transform.status = 'SUCCEEDED'
        transform.result_recipe_version_id = new_version.id
        db.commit()
        
    except Exception as e:
        print(f"Transform processing error: {e}")
        if transform:
            transform.status = 'FAILED'
            db.commit()
    finally:
        db.close()

@router.post("/", response_model=schemas.Transform)
def create_transform(
    transform: schemas.TransformCreate, 
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    # Calculate risks upfront
    risk_factors = {}
    if transform.reference_1_id and transform.reference_2_id:
        risk_factors = strategy_engine.calculate_risks(
            transform.reference_1_id,
            transform.reference_2_id,
            transform.mode,
            db
        )

    db_transform = models.Transform(
        **transform.dict(exclude={'risk_factors_json'}), 
        status='QUEUED',
        risk_factors_json=risk_factors
    )
    db.add(db_transform)
    db.commit()
    db.refresh(db_transform)

    # Trigger async processing
    background_tasks.add_task(process_transform, db_transform.id)

    return db_transform

@router.get("/{transform_id}", response_model=schemas.Transform)
def read_transform(transform_id: str, db: Session = Depends(get_db)):
    transform = db.query(models.Transform).filter(models.Transform.id == transform_id).first()
    if transform is None:
        raise HTTPException(status_code=404, detail="Transform not found")
    return transform
