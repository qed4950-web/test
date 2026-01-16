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

class ReferenceProcessStatus(str, Enum):
    QUEUED = 'QUEUED'
    RUNNING = 'RUNNING'
    COMPLETED = 'COMPLETED'
    FAILED = 'FAILED'

class TransformMode(str, Enum):
    COPY = 'COPY'
    DISTANCE = 'DISTANCE'
    REDIRECT = 'REDIRECT'

class TransformStatus(str, Enum):
    QUEUED = 'QUEUED'
    RUNNING = 'RUNNING'
    SUCCEEDED = 'SUCCEEDED'
    FAILED = 'FAILED'

class VersionApprovalStatus(str, Enum):
    PENDING = 'PENDING'
    APPROVED = 'APPROVED'
    REJECTED = 'REJECTED'

class ExperimentStatus(str, Enum):
    DRAFT = 'DRAFT'
    RUNNING = 'RUNNING'
    COMPLETED = 'COMPLETED'
    STOPPED = 'STOPPED'

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
    process_status: ReferenceProcessStatus = ReferenceProcessStatus.QUEUED
    metadata_json: Optional[Dict[str, Any]] = None

class ReferenceCreate(ReferenceBase):
    org_id: str

class Reference(ReferenceBase):
    id: str
    org_id: str
    created_at: datetime
    process_status: ReferenceProcessStatus
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
    approval_status: VersionApprovalStatus
    approved_by: Optional[str] = None
    approved_at: Optional[datetime] = None
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
    risk_factors_json: Optional[Dict[str, float]] = None

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
    experiment_group: Optional[str] = None

    class Config:
        orm_mode = True

# --- Deployment Schemas ---
class DeploymentBase(BaseModel):
    recipe_version_id: str
    scope: str = 'ALL_STORES'
    target_group_json: Optional[Dict[str, Any]] = None
    scheduled_at: Optional[datetime] = None
    rollback_condition_json: Optional[Dict[str, Any]] = None
    rollback_policy_json: Optional[Dict[str, Any]] = None

class DeploymentCreate(DeploymentBase):
    pass

class Deployment(DeploymentBase):
    id: str
    status: str
    created_at: datetime

    class Config:
        orm_mode = True

# --- Experiment Schemas ---
class ExperimentBase(BaseModel):
    name: str
    control_version_id: str
    test_version_id: str
    target_criteria_json: Optional[Dict[str, Any]] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None

class ExperimentCreate(ExperimentBase):
    org_id: str

class Experiment(ExperimentBase):
    id: str
    org_id: str
    status: ExperimentStatus
    created_at: datetime
    
    class Config:
        orm_mode = True

# --- Execution Log Schemas ---
class ExecutionLogType(str, Enum):
    START = 'START'
    STEP = 'STEP'
    END = 'END'
    ERROR = 'ERROR'

class ExecutionLogBase(BaseModel):
    store_id: str
    recipe_version_id: str
    event_type: ExecutionLogType
    payload_json: Optional[Dict[str, Any]] = None

class ExecutionLogCreate(ExecutionLogBase):
    pass

class ExecutionLog(ExecutionLogBase):
    id: str
    org_id: str
    ts: datetime
    
    class Config:
        orm_mode = True

# --- Alert Schemas ---
class AlertType(str, Enum):
    DEVIATION_HIGH = 'DEVIATION_HIGH'
    RECIPE_EXPIRED = 'RECIPE_EXPIRED'
    SYSTEM_ERROR = 'SYSTEM_ERROR'

class AlertSeverity(str, Enum):
    LOW = 'LOW'
    MEDIUM = 'MEDIUM'
    HIGH = 'HIGH'
    CRITICAL = 'CRITICAL'

class AlertBase(BaseModel):
    store_id: Optional[str] = None
    alert_type: AlertType
    severity: AlertSeverity = AlertSeverity.MEDIUM
    message: str
    root_cause_analysis: Optional[str] = None
    is_resolved: int = 0

class AlertCreate(AlertBase):
    pass

class Alert(AlertBase):
    id: str
    org_id: str
    created_at: datetime
    
    class Config:
        orm_mode = True

# --- DNA Signature Schemas ---
class PatternType(str, Enum):
    RADIAL = 'RADIAL'
    WAVE = 'WAVE'
    SPIKE = 'SPIKE'
    SMOOTH = 'SMOOTH'

class DNASignatureBase(BaseModel):
    brand_id: str
    vector_profile: Optional[List[float]] = None
    dominant_traits: Optional[List[str]] = None
    icon_seed: Optional[str] = None
    pattern_type: Optional[PatternType] = None
    color_hex: Optional[str] = None

class DNASignatureCreate(BaseModel):
    reference_id: str

class DNASignature(DNASignatureBase):
    id: str
    org_id: str
    created_at: datetime

    class Config:
        orm_mode = True

# --- Reverse Analysis Schemas ---
class ReverseAnalysisBase(BaseModel):
    reference_id: str
    structure_summary: Optional[str] = None
    cooking_factors: Optional[Dict[str, Any]] = None
    texture_contributions: Optional[Dict[str, Any]] = None
    aroma_contributions: Optional[Dict[str, Any]] = None
    confidence: Optional[float] = None

class ReverseAnalysis(ReverseAnalysisBase):
    id: str
    created_at: datetime

    class Config:
        orm_mode = True

# --- Radar Animation Schema ---
class RadarAnimationKeyframe(BaseModel):
    t: float
    values: List[float]

class RadarAnimationResponse(BaseModel):
    before: List[float]
    after: List[float]
    delta: List[float]
    highlight_axes: List[int]
    animation_keyframes: List[RadarAnimationKeyframe]

# --- Strategy Report Schemas ---
class StrategyGoal(str, Enum):
    INCREASE_SALES = 'increase_sales'
    REDUCE_COST = 'reduce_cost'
    DIFFERENTIATE = 'differentiate'

class StrategyAnalyzeRequest(BaseModel):
    anchor_id: str
    competitor_ids: List[str]
    goal: StrategyGoal = StrategyGoal.DIFFERENTIATE

class KPIPrediction(BaseModel):
    sales_lift: Optional[float] = None
    cost_delta: Optional[float] = None
    uniqueness_score: Optional[float] = None

class RiskScores(BaseModel):
    brand_conflict: Optional[float] = None
    price_mismatch: Optional[float] = None
    execution_difficulty: Optional[float] = None

class RecommendedStrategy(BaseModel):
    mode: str
    alpha: float
    target_id: Optional[str] = None

class StrategyReport(BaseModel):
    id: str
    org_id: str
    anchor_id: str
    recommended_strategy: RecommendedStrategy
    kpi_predictions: KPIPrediction
    risk_scores: RiskScores
    reasoning: str
    confidence: float
    created_at: datetime

    class Config:
        orm_mode = True

# --- Invented Signature Schemas ---
class SignatureDirection(str, Enum):
    BOLD = 'bold'
    SUBTLE = 'subtle'
    UNIQUE = 'unique'

class InventedSignatureCreate(BaseModel):
    base_reference_ids: List[str]
    direction: SignatureDirection = SignatureDirection.UNIQUE

class InventedSignature(BaseModel):
    id: str
    org_id: str
    vector: List[float]
    generated_name: str
    generated_story: str
    concept_keywords: List[str]
    base_references: List[str]
    direction: str
    created_at: datetime

    class Config:
        orm_mode = True

# --- Conflict Map Schemas ---
class ConflictZone(BaseModel):
    axis: str
    axis_name: str
    overlap: float
    recommendation: str

class ConflictMapRequest(BaseModel):
    brand_id: str
    competitor_ids: List[str]

class ConflictMapResponse(BaseModel):
    conflict_zones: List[ConflictZone]
    unique_zones: List[ConflictZone]
    overall_similarity: float
