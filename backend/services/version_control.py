from sqlalchemy.orm import Session
from fastapi import HTTPException
from datetime import datetime
from .. import models, schemas
from typing import Dict, Any

def get_version_diff(
    v1_id: str, 
    v2_id: str, 
    db: Session
) -> Dict[str, Any]:
    v1 = db.query(models.RecipeVersion).filter(models.RecipeVersion.id == v1_id).first()
    v2 = db.query(models.RecipeVersion).filter(models.RecipeVersion.id == v2_id).first()
    
    if not v1 or not v2:
        raise HTTPException(status_code=404, detail="One or both versions not found")

    diff = {
        "v1_label": v1.version_label,
        "v2_label": v2.version_label,
        "vector_delta": {},
        "param_delta": {}
    }

    # Vector Diff (Assuming simple index-wise calc for now)
    if v1.fingerprint_vector and v2.fingerprint_vector:
        # Mock diff - in reality usage numpy or similar
        vec1 = v1.fingerprint_vector
        vec2 = v2.fingerprint_vector
        diff["vector_delta"] = [b - a for a, b in zip(vec1, vec2)] if len(vec1) == len(vec2) else "Vector dimension mismatch"

    # Params Diff (YAML or JSON)
    # Simple check for demo
    if v1.spec_yaml and v2.spec_yaml:
        diff["param_delta"] = "Diff logic to be implemented for YAML text"
        if v1.spec_yaml != v2.spec_yaml:
             diff["param_delta"] = "Specs are different"
    
    return diff

def approve_version(
    version_id: str, 
    user_id: str, 
    db: Session
) -> models.RecipeVersion:
    version = db.query(models.RecipeVersion).filter(models.RecipeVersion.id == version_id).first()
    if not version:
        raise HTTPException(status_code=404, detail="Version not found")
        
    # Check if user is ADMIN (Mock check)
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user or user.role != 'ADMIN':
        raise HTTPException(status_code=403, detail="Only ADMIN can approve versions")
    
    version.approval_status = schemas.VersionApprovalStatus.APPROVED
    version.approved_by = user_id
    version.approved_at = datetime.utcnow()
    
    # Also update parent recipe status if needed
    version.recipe.status = 'APPROVED'
    
    db.commit()
    db.refresh(version)
    return version
