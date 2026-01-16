import hashlib
import statistics
from sqlalchemy.orm import Session
from backend import models, schemas

# Flavor axis names (Korean)
AXES = ["매운맛", "단맛", "감칠맛", "상큼함", "풍미"]

# Color map for dominant traits
COLOR_MAP = {
    "매운맛": "#FF4136",   # Red
    "단맛": "#FFDC00",     # Yellow
    "감칠맛": "#FF851B",   # Orange
    "상큼함": "#2ECC40",   # Green
    "풍미": "#B10DC9"      # Purple
}

def generate_dna_signature(reference_id: str, org_id: str, db: Session) -> models.DNASignature:
    """
    Generate a unique DNA signature for a brand reference.
    """
    # 1. Get reference and its fingerprint
    ref = db.query(models.Reference).filter(models.Reference.id == reference_id).first()
    if not ref:
        raise ValueError(f"Reference {reference_id} not found")
    
    if not ref.fingerprints:
        raise ValueError(f"Reference {reference_id} has no fingerprint vectors")
    
    fp = ref.fingerprints[0]  # Latest fingerprint
    vector = fp.vector
    
    if not vector or len(vector) < 5:
        # Use default vector if missing
        vector = [0.5, 0.5, 0.5, 0.5, 0.5]
    
    # 2. Calculate Dominant Traits (top 2 axes)
    sorted_indices = sorted(range(len(vector)), key=lambda i: vector[i], reverse=True)
    dominant = [AXES[sorted_indices[0]], AXES[sorted_indices[1]]]
    
    # 3. Determine Pattern Type based on vector variance
    variance = statistics.variance(vector) if len(vector) > 1 else 0
    max_val = max(vector)
    min_val = min(vector)
    
    if variance > 0.1:
        pattern = schemas.PatternType.SPIKE      # Extreme variance
    elif max_val > 0.8:
        pattern = schemas.PatternType.RADIAL     # Strong peak
    elif min_val > 0.4:
        pattern = schemas.PatternType.SMOOTH     # Balanced
    else:
        pattern = schemas.PatternType.WAVE       # Varied but moderate
    
    # 4. Generate Icon Seed (deterministic hash)
    vector_str = ",".join([f"{v:.4f}" for v in vector])
    icon_seed = hashlib.sha256(vector_str.encode()).hexdigest()[:16]
    
    # 5. Determine Color from dominant trait
    color = COLOR_MAP.get(dominant[0], "#AAAAAA")
    
    # 6. Create and save signature
    signature = models.DNASignature(
        id=models.generate_uuid(),
        brand_id=reference_id,
        org_id=org_id,
        vector_profile=vector,
        dominant_traits=dominant,
        icon_seed=icon_seed,
        pattern_type=pattern,
        color_hex=color
    )
    
    db.add(signature)
    db.commit()
    db.refresh(signature)
    
    return signature

def get_radar_animation_data(transform_id: str, db: Session) -> dict:
    """
    Generate radar animation data for a transform (before/after comparison).
    """
    transform = db.query(models.Transform).filter(models.Transform.id == transform_id).first()
    if not transform:
        raise ValueError(f"Transform {transform_id} not found")
    
    # Get before vector (from reference_1)
    ref1 = db.query(models.Reference).filter(models.Reference.id == transform.reference_1_id).first()
    before = ref1.fingerprints[0].vector if ref1 and ref1.fingerprints else [0.5] * 5
    
    # Get after vector (from result recipe version)
    recipe_ver = db.query(models.RecipeVersion).filter(
        models.RecipeVersion.id == transform.result_recipe_version_id
    ).first()
    after = recipe_ver.fingerprint_vector if recipe_ver and recipe_ver.fingerprint_vector else before
    
    # Ensure both are 5-dimensional
    before = (before + [0.5] * 5)[:5]
    after = (after + [0.5] * 5)[:5]
    
    # Calculate delta
    delta = [abs(a - b) for a, b in zip(before, after)]
    
    # Highlight top 2 changing axes
    highlight = sorted(range(5), key=lambda i: delta[i], reverse=True)[:2]
    
    # Generate animation keyframes (linear interpolation)
    keyframes = []
    for t in [0, 0.25, 0.5, 0.75, 1.0]:
        interpolated = [before[i] + (after[i] - before[i]) * t for i in range(5)]
        keyframes.append({"t": t, "values": interpolated})
    
    return {
        "before": before,
        "after": after,
        "delta": delta,
        "highlight_axes": highlight,
        "animation_keyframes": keyframes
    }
