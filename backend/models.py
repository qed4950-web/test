from sqlalchemy import Column, String, DateTime, Enum, ForeignKey, Integer, JSON, DECIMAL, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
from .database import Base

def generate_uuid():
    return str(uuid.uuid4())

class Organization(Base):
    __tablename__ = "organizations"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    users = relationship("User", back_populates="organization")

class User(Base):
    __tablename__ = "users"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    org_id = Column(String(36), ForeignKey("organizations.id"))
    email = Column(String(255), nullable=False, unique=True)
    role = Column(Enum('ADMIN', 'RND', 'OPS', 'VIEWER'), default='VIEWER')
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    organization = relationship("Organization", back_populates="users")

class Reference(Base):
    __tablename__ = "references"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    org_id = Column(String(36), ForeignKey("organizations.id"))
    name = Column(String(255), nullable=False)
    reference_type = Column(Enum('ANCHOR', 'BRAND', 'INTERNAL_BEST'), nullable=False)
    menu_category = Column(String(50), nullable=False)
    source_kind = Column(Enum('MARKET', 'INTERNAL', 'FIELD_AGGREGATE'), nullable=False)
    status = Column(Enum('ACTIVE', 'ARCHIVED'), default='ACTIVE')
    process_status = Column(Enum('QUEUED', 'RUNNING', 'COMPLETED', 'FAILED'), default='QUEUED')
    metadata_json = Column(JSON, nullable=True) # Raw fields from CSV (price, etc.)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    fingerprints = relationship("ReferenceFingerprint", back_populates="reference")

class ReferenceFingerprint(Base):
    __tablename__ = "reference_fingerprints"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    reference_id = Column(String(36), ForeignKey("references.id"))
    version = Column(Integer, default=1)
    vector = Column(JSON, nullable=True) # Stored as list of floats
    metrics_json = Column(JSON, nullable=True) # Human readable metrics
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    reference = relationship("Reference", back_populates="fingerprints")

class Recipe(Base):
    __tablename__ = "recipes"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    org_id = Column(String(36), ForeignKey("organizations.id"))
    name = Column(String(255), nullable=False)
    menu_category = Column(String(50), nullable=False)
    status = Column(Enum('DRAFT', 'APPROVED', 'DEPRECATED'), default='DRAFT')
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    versions = relationship("RecipeVersion", back_populates="recipe")

class RecipeVersion(Base):
    __tablename__ = "recipe_versions"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    recipe_id = Column(String(36), ForeignKey("recipes.id"))
    version_label = Column(String(50), nullable=False)
    spec_yaml = Column(Text, nullable=True)
    spec_json = Column(JSON, nullable=True)
    fingerprint_vector = Column(JSON, nullable=True)
    predicted_kpi_json = Column(JSON, nullable=True)
    constraints_json = Column(JSON, nullable=True)
    created_from_transform_id = Column(String(36), ForeignKey("transforms.id"), nullable=True)
    approval_status = Column(Enum('PENDING', 'APPROVED', 'REJECTED'), default='PENDING')
    approved_by = Column(String(36), nullable=True) # User ID
    approved_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    recipe = relationship("Recipe", back_populates="versions")

class Transform(Base):
    __tablename__ = "transforms"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    org_id = Column(String(36), ForeignKey("organizations.id"))
    mode = Column(Enum('COPY', 'DISTANCE', 'REDIRECT'), nullable=False)
    reference_1_id = Column(String(36), ForeignKey("references.id"), nullable=True)
    reference_2_id = Column(String(36), ForeignKey("references.id"), nullable=True)
    alpha = Column(DECIMAL(3, 2), nullable=True)
    direction_key = Column(String(50), nullable=True)
    layer_mask = Column(JSON, nullable=True)
    constraints_json = Column(JSON, nullable=True)
    risk_factors_json = Column(JSON, nullable=True) # e.g. {"brand_conflict": 0.12}
    status = Column(Enum('QUEUED', 'RUNNING', 'SUCCEEDED', 'FAILED'), default='QUEUED')
    result_recipe_version_id = Column(String(36), ForeignKey("recipe_versions.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Store(Base):
    __tablename__ = "stores"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    org_id = Column(String(36), ForeignKey("organizations.id"))
    name = Column(String(100), nullable=False)
    region = Column(String(50), nullable=True)
    status = Column(Enum('ACTIVE', 'INACTIVE', 'WARNING'), default='ACTIVE')
    active_recipe_version_id = Column(String(36), ForeignKey("recipe_versions.id"), nullable=True)
    deviation = Column(DECIMAL(5, 2), default=0.0)
    experiment_group = Column(Enum('CONTROL', 'TEST'), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Deployment(Base):
    __tablename__ = "deployments"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    org_id = Column(String(36), ForeignKey("organizations.id"))
    recipe_version_id = Column(String(36), ForeignKey("recipe_versions.id"))
    scope = Column(Enum('ALL_STORES', 'SELECTED_STORES'), nullable=False)
    target_group_json = Column(JSON, nullable=True) # Filter criteria (Region, Sales Tier)
    status = Column(Enum('SCHEDULED', 'DEPLOYED', 'ROLLED_BACK'), default='SCHEDULED')
    scheduled_at = Column(DateTime(timezone=True), nullable=True)
    rollback_condition_json = Column(JSON, nullable=True) # e.g. {"deviation_threshold": 10.0}
    rollback_policy_json = Column(JSON, nullable=True) # detailed policy
    last_health_check_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class ExecutionLog(Base):
    __tablename__ = "execution_logs"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    org_id = Column(String(36), ForeignKey("organizations.id"))
    store_id = Column(String(36), ForeignKey("stores.id"))
    recipe_version_id = Column(String(36), ForeignKey("recipe_versions.id"))
    ts = Column(DateTime(timezone=True), server_default=func.now())
    event_type = Column(Enum('START', 'STEP', 'END', 'ERROR'), nullable=False)
    payload_json = Column(JSON, nullable=True)

class Alert(Base):
    __tablename__ = "alerts"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    org_id = Column(String(36), ForeignKey("organizations.id"))
    store_id = Column(String(36), ForeignKey("stores.id"), nullable=True)
    alert_type = Column(Enum('DEVIATION_HIGH', 'RECIPE_EXPIRED', 'SYSTEM_ERROR'), nullable=False)
    severity = Column(Enum('LOW', 'MEDIUM', 'HIGH', 'CRITICAL'), default='MEDIUM')
    message = Column(String(500), nullable=False)
    root_cause_analysis = Column(Text, nullable=True) # AI analysis result
    is_resolved = Column(Integer, default=0)  # 0=false, 1=true
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class StoreDailyMetric(Base):
    __tablename__ = "store_daily_metrics"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    store_id = Column(String(36), ForeignKey("stores.id"))
    date = Column(DateTime(timezone=True), nullable=False) # Store-local date
    avg_deviation = Column(DECIMAL(5, 2))
    total_sales = Column(DECIMAL(10, 2))
    complaint_count = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class LLMCache(Base):
    __tablename__ = "llm_cache"
    cache_key = Column(String(255), primary_key=True) # Hash of prompt+params
    response_json = Column(JSON, nullable=False)
    model_config_id = Column(String(50), nullable=True)
    hit_count = Column(Integer, default=0)              # Cache hit counter
    last_hit_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True), nullable=False)

class Experiment(Base):
    __tablename__ = "experiments"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False)
    org_id = Column(String(36), ForeignKey("organizations.id"))
    control_version_id = Column(String(36), ForeignKey("recipe_versions.id"))
    test_version_id = Column(String(36), ForeignKey("recipe_versions.id"))
    target_criteria_json = Column(JSON, nullable=True)
    start_date = Column(DateTime(timezone=True), nullable=True)
    end_date = Column(DateTime(timezone=True), nullable=True)
    status = Column(Enum('DRAFT', 'RUNNING', 'COMPLETED', 'STOPPED'), default='DRAFT')
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class ExperimentRun(Base):
    """Batch experiment run for multiple strategy combinations"""
    __tablename__ = "experiment_runs"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    org_id = Column(String(36), ForeignKey("organizations.id"))
    config_json = Column(JSON)              # {"modes": ["COPY","DISTANCE"], "alphas": [0.3,0.5]}
    status = Column(Enum('QUEUED', 'RUNNING', 'COMPLETED', 'FAILED'), default='QUEUED')
    results_json = Column(JSON)             # [{config: {...}, result_id: "..."}]
    total_combinations = Column(Integer)
    completed_count = Column(Integer, default=0)
    duration_ms = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class DNASignature(Base):
    __tablename__ = "dna_signatures"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    brand_id = Column(String(36), ForeignKey("references.id"))
    org_id = Column(String(36), ForeignKey("organizations.id"))
    vector_profile = Column(JSON)           # [0.8, 0.2, 0.9, 0.3, 0.7]
    dominant_traits = Column(JSON)          # ["불향", "감칠맛"]
    icon_seed = Column(String(64))          # Deterministic hash for visualization
    pattern_type = Column(Enum('RADIAL', 'WAVE', 'SPIKE', 'SMOOTH'))
    color_hex = Column(String(7))           # "#FF4136"
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class ReverseAnalysis(Base):
    __tablename__ = "reverse_analysis"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    reference_id = Column(String(36), ForeignKey("references.id"))
    structure_summary = Column(Text)        # "불향 40% + 감칠맛 35%"
    cooking_factors = Column(JSON)          # {"fire": 0.8, "oil_temp": 180}
    texture_contributions = Column(JSON)
    aroma_contributions = Column(JSON)
    confidence = Column(DECIMAL(3, 2))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class StrategyReport(Base):
    __tablename__ = "strategy_reports"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    org_id = Column(String(36), ForeignKey("organizations.id"))
    anchor_id = Column(String(36), ForeignKey("references.id"))
    recommended_mode = Column(Enum('COPY', 'DISTANCE', 'REDIRECT'))
    recommended_alpha = Column(DECIMAL(3, 2))
    recommended_target_id = Column(String(36), ForeignKey("references.id"), nullable=True)
    kpi_predictions = Column(JSON)          # {"sales_lift": 0.12, "cost_delta": -0.05}
    risk_scores = Column(JSON)              # {"brand_conflict": 0.3, "price_mismatch": 0.1}
    reasoning = Column(Text)                # "경쟁사 대비 매운맛 강화가..."
    confidence = Column(DECIMAL(3, 2))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class InventedSignature(Base):
    __tablename__ = "invented_signatures"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    org_id = Column(String(36), ForeignKey("organizations.id"))
    vector = Column(JSON)
    generated_name = Column(String(100))
    generated_story = Column(Text)
    concept_keywords = Column(JSON)
    base_references = Column(JSON)
    direction = Column(Enum('BOLD', 'SUBTLE', 'UNIQUE'))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class TrendReport(Base):
    """Flavor trend predictions"""
    __tablename__ = "trend_reports"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    org_id = Column(String(36), ForeignKey("organizations.id"))
    category = Column(String(100))
    period = Column(String(20))             # "2026-Q2"
    predictions_json = Column(JSON)         # [{"axis": "spicy", "direction": "up"}]
    reasoning = Column(Text)
    confidence = Column(DECIMAL(3, 2))
    data_points_count = Column(Integer)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class DNAEvolution(Base):
    """Brand DNA evolution tracking"""
    __tablename__ = "dna_evolution"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    brand_id = Column(String(36), ForeignKey("references.id"))
    vector_snapshot = Column(JSON)
    event_type = Column(Enum('INITIAL', 'RECIPE_CHANGE', 'TREND_SHIFT', 'MANUAL'))
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
