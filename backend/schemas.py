from typing import List, Optional, Any, Dict
from pydantic import BaseModel
from datetime import datetime
from enum import Enum

# Enums (mirroring properties of SQLAlchemy models for validation)
class ReferenceType(str, Enum):
    ANCHOR = 'ANCHOR'
    BRAND = 'BRAND'
    INTERNAL_BEST = 'INTERNAL_BEST'

class SourceKind(str, Enum):
    MARKET = 'MARKET'
    INTERNAL = 'INTERNAL'
    FIELD_AGGREGATE = 'FIELD_AGGREGATE'

class ReferenceStatus(str, Enum):
    ACTIVE = 'ACTIVE'
    ARCHIVED = 'ARCHIVED'

class TransformMode(str, Enum):
    COPY = 'COPY'
    DISTANCE = 'DISTANCE'
    REDIRECT = 'REDIRECT'

class TransformStatus(str, Enum):
    QUEUED = 'QUEUED'
    RUNNING = 'RUNNING'
    SUCCEEDED = 'SUCCEEDED'
    FAILED = 'FAILED'

# --- Fingerprint Schemas ---
class ReferenceFingerprintBase(BaseModel):
    version: int = 1
    vector: Optional[List[float]] = None
    metrics_json: Optional[Dict[str, Any]] = None
    notes: Optional[str] = None

class ReferenceFingerprintCreate(ReferenceFingerprintBase):
    pass

class ReferenceFingerprint(ReferenceFingerprintBase):
    id: str
    reference_id: str
    created_at: datetime

    class Config:
        orm_mode = True

# --- Reference Schemas ---
class ReferenceBase(BaseModel):
    name: str
    menu_category: str
    reference_type: ReferenceType
    source_kind: SourceKind
    status: ReferenceStatus = ReferenceStatus.ACTIVE

class ReferenceCreate(ReferenceBase):
    org_id: str

class Reference(ReferenceBase):
    id: str
    org_id: str
    created_at: datetime
    fingerprints: List[ReferenceFingerprint] = []

    class Config:
        orm_mode = True

# --- Recipe Version Schemas ---
class RecipeVersionBase(BaseModel):
    version_label: str
    spec_yaml: Optional[str] = None
    spec_json: Optional[Dict[str, Any]] = None
    fingerprint_vector: Optional[List[float]] = None
    predicted_kpi_json: Optional[Dict[str, Any]] = None
    constraints_json: Optional[Dict[str, Any]] = None

class RecipeVersionCreate(RecipeVersionBase):
    pass

class RecipeVersion(RecipeVersionBase):
    id: str
    recipe_id: str
    created_from_transform_id: Optional[str] = None
    created_at: datetime
    
    class Config:
        orm_mode = True

# --- Recipe Schemas ---
class RecipeBase(BaseModel):
    name: str
    menu_category: str

class RecipeCreate(RecipeBase):
    org_id: str

class Recipe(RecipeBase):
    id: str
    org_id: str
    status: str
    created_at: datetime
    versions: List[RecipeVersion] = []

    class Config:
        orm_mode = True

# --- Transform Schemas ---
class TransformBase(BaseModel):
    mode: TransformMode
    reference_1_id: Optional[str] = None
    reference_2_id: Optional[str] = None
    alpha: Optional[float] = None
    direction_key: Optional[str] = None
    layer_mask: Optional[Dict[str, bool]] = None
    constraints_json: Optional[Dict[str, Any]] = None

class TransformCreate(TransformBase):
    org_id: str

class Transform(TransformBase):
    id: str
    org_id: str
    status: TransformStatus
    result_recipe_version_id: Optional[str] = None
    created_at: datetime

    class Config:
        orm_mode = True

# --- Store Schemas ---
class StoreBase(BaseModel):
    name: str
    org_id: str
    region: Optional[str] = None

class StoreCreate(StoreBase):
    pass

class Store(StoreBase):
    id: str
    status: str
    created_at: datetime
    active_recipe_version_id: Optional[str] = None
    deviation: Optional[float] = None

    class Config:
        orm_mode = True

# --- Deployment Schemas ---
class DeploymentBase(BaseModel):
    recipe_version_id: str
    scope: str = 'ALL_STORES'

class DeploymentCreate(DeploymentBase):
    pass

class Deployment(DeploymentBase):
    id: str
    status: str
    created_at: datetime

    class Config:
        orm_mode = True
