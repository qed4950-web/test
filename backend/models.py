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
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Deployment(Base):
    __tablename__ = "deployments"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    org_id = Column(String(36), ForeignKey("organizations.id"))
    recipe_version_id = Column(String(36), ForeignKey("recipe_versions.id"))
    scope = Column(Enum('ALL_STORES', 'SELECTED_STORES'), nullable=False)
    status = Column(Enum('SCHEDULED', 'DEPLOYED', 'ROLLED_BACK'), default='SCHEDULED')
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
    is_resolved = Column(Integer, default=0)  # 0=false, 1=true
    created_at = Column(DateTime(timezone=True), server_default=func.now())
