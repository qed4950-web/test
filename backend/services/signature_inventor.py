import random
from sqlalchemy.orm import Session
from backend import models, schemas

AXES = ["매운맛", "단맛", "감칠맛", "상큼함", "풍미"]

# Name templates
NAME_PREFIXES = ["불꽃", "황금", "프리미엄", "시크릿", "마스터", "레전드", "크리미", "스모키"]
NAME_SUFFIXES = ["폭탄", "시그니처", "스페셜", "클래식", "익스트림", "하모니", "블렌드", "퓨전"]

# Story templates
STORY_TEMPLATES = [
    "{prefix}의 강렬함과 {suffix}의 깊은 맛이 어우러진 새로운 시그니처입니다.",
    "전통의 {prefix}에 현대적인 {suffix}를 더해 탄생한 혁신적인 맛입니다.",
    "{prefix}와 {suffix}의 완벽한 밸런스가 만들어낸 프리미엄 경험입니다."
]

# Keywords by dominant axis
KEYWORDS_MAP = {
    "매운맛": ["화끈한", "중독성", "스파이시"],
    "단맛": ["달콤한", "디저트급", "허니"],
    "감칠맛": ["깊은맛", "우마미", "풍부한"],
    "상큼함": ["상쾌한", "프레시", "청량감"],
    "풍미": ["진한향", "아로마", "깊은풍미"]
}

def invent_signature(
    base_reference_ids: list[str],
    direction: schemas.SignatureDirection,
    org_id: str,
    db: Session
) -> models.InventedSignature:
    """
    Create a new invented signature by combining base references.
    """
    # 1. Get base vectors
    base_vectors = []
    for ref_id in base_reference_ids:
        ref = db.query(models.Reference).filter(models.Reference.id == ref_id).first()
        if ref and ref.fingerprints:
            base_vectors.append(ref.fingerprints[0].vector[:5])
    
    if not base_vectors:
        raise ValueError("No valid base references found")
    
    # 2. Create new vector based on direction
    new_vector = _create_vector(base_vectors, direction)
    
    # 3. Generate name
    name = _generate_name(new_vector, direction)
    
    # 4. Generate story
    story = _generate_story(new_vector, direction)
    
    # 5. Generate keywords
    keywords = _generate_keywords(new_vector)
    
    # 6. Save
    signature = models.InventedSignature(
        id=models.generate_uuid(),
        org_id=org_id,
        vector=new_vector,
        generated_name=name,
        generated_story=story,
        concept_keywords=keywords,
        base_references=base_reference_ids,
        direction=direction.value.upper()
    )
    
    db.add(signature)
    db.commit()
    db.refresh(signature)
    
    return signature

def _create_vector(base_vectors: list, direction: schemas.SignatureDirection) -> list:
    """Create new vector based on bases and direction"""
    # Start with average
    avg = [0.0] * 5
    for v in base_vectors:
        for i in range(5):
            avg[i] += v[i] / len(base_vectors)
    
    if direction == schemas.SignatureDirection.BOLD:
        # Amplify extremes
        return [min(1.0, v * 1.3) for v in avg]
    elif direction == schemas.SignatureDirection.SUBTLE:
        # Moderate toward center
        return [0.5 + (v - 0.5) * 0.7 for v in avg]
    else:  # UNIQUE
        # Add randomness and emphasize one axis
        result = avg.copy()
        # Pick random axis to emphasize
        emphasis_idx = random.randint(0, 4)
        result[emphasis_idx] = min(1.0, result[emphasis_idx] + 0.2)
        # Add slight randomness
        for i in range(5):
            result[i] = max(0, min(1.0, result[i] + random.uniform(-0.1, 0.1)))
        return result

def _generate_name(vector: list, direction: schemas.SignatureDirection) -> str:
    """Generate creative name based on vector"""
    # Find dominant axis
    max_idx = vector.index(max(vector))
    
    prefix = random.choice(NAME_PREFIXES)
    suffix = random.choice(NAME_SUFFIXES)
    
    if direction == schemas.SignatureDirection.BOLD:
        return f"{prefix} {AXES[max_idx]} {suffix}"
    elif direction == schemas.SignatureDirection.SUBTLE:
        return f"섬세한 {AXES[max_idx]} {suffix}"
    else:
        return f"{prefix} {suffix}"

def _generate_story(vector: list, direction: schemas.SignatureDirection) -> str:
    """Generate story based on vector"""
    sorted_axes = sorted(range(5), key=lambda i: vector[i], reverse=True)
    top1, top2 = AXES[sorted_axes[0]], AXES[sorted_axes[1]]
    
    template = random.choice(STORY_TEMPLATES)
    return template.format(prefix=top1, suffix=top2)

def _generate_keywords(vector: list) -> list:
    """Generate concept keywords based on vector"""
    keywords = []
    sorted_axes = sorted(range(5), key=lambda i: vector[i], reverse=True)
    
    # Add keywords from top 2 axes
    for idx in sorted_axes[:2]:
        axis = AXES[idx]
        if axis in KEYWORDS_MAP:
            keywords.extend(random.sample(KEYWORDS_MAP[axis], min(2, len(KEYWORDS_MAP[axis]))))
    
    return keywords[:4]  # Max 4 keywords

def calculate_conflict_map(
    brand_id: str,
    competitor_ids: list[str],
    db: Session
) -> dict:
    """
    Calculate conflict/overlap between brand and competitors.
    """
    # Get brand vector
    brand = db.query(models.Reference).filter(models.Reference.id == brand_id).first()
    if not brand or not brand.fingerprints:
        raise ValueError("Brand not found or has no fingerprint")
    
    brand_vector = brand.fingerprints[0].vector[:5]
    
    # Get average competitor vector
    comp_vectors = []
    for cid in competitor_ids:
        comp = db.query(models.Reference).filter(models.Reference.id == cid).first()
        if comp and comp.fingerprints:
            comp_vectors.append(comp.fingerprints[0].vector[:5])
    
    if not comp_vectors:
        raise ValueError("No valid competitors found")
    
    avg_comp = [sum(v[i] for v in comp_vectors) / len(comp_vectors) for i in range(5)]
    
    # Calculate overlap per axis
    conflict_zones = []
    unique_zones = []
    
    for i in range(5):
        diff = abs(brand_vector[i] - avg_comp[i])
        overlap = 1.0 - diff
        
        zone = {
            "axis": f"axis_{i}",
            "axis_name": AXES[i],
            "overlap": round(overlap, 2),
            "recommendation": "차별화 필요" if overlap > 0.7 else "강화 가능"
        }
        
        if overlap > 0.6:
            conflict_zones.append(zone)
        else:
            unique_zones.append(zone)
    
    # Overall similarity
    total_overlap = sum([abs(brand_vector[i] - avg_comp[i]) for i in range(5)])
    overall_similarity = 1.0 - (total_overlap / 5)
    
    return {
        "conflict_zones": conflict_zones,
        "unique_zones": unique_zones,
        "overall_similarity": round(overall_similarity, 2)
    }
