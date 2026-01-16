import random
import hashlib
from datetime import datetime
from sqlalchemy.orm import Session
from backend import models

AXES = ["매운맛", "단맛", "감칠맛", "상큼함", "풍미"]

# Pad vectors to expected axis length for safer downstream math.
def _normalize_vector(vector: list, size: int = 5, fill: float = 0.5) -> list:
    if not vector:
        return [fill] * size
    trimmed = list(vector)[:size]
    if len(trimmed) < size:
        trimmed.extend([fill] * (size - len(trimmed)))
    return trimmed

# === Q1: 맛 이름/컨셉 생성기 ===

NAME_STYLES = {
    "premium": ["프리미엄", "시그니처", "마스터", "로얄", "그랑"],
    "fun": ["폭탄", "익스트림", "페스티벌", "파이어", "스플래시"],
    "elegant": ["클래식", "헤리티지", "에센스", "부티크", "아티장"]
}

STORY_TEMPLATES = [
    "{style} {dominant}의 깊은 맛과 {secondary}의 은은한 여운이 어우러진 새로운 경험을 선사합니다.",
    "전통의 {dominant}에 현대적인 {secondary}를 더해 탄생한 혁신적인 맛입니다.",
    "{dominant}와 {secondary}가 만나 완벽한 조화를 이루는 프리미엄 메뉴입니다.",
    "한 입에 {dominant}의 강렬함과 {secondary}의 부드러움을 동시에 느끼세요."
]

def generate_menu_name_and_concept(
    vector: list,
    category: str,
    style: str = "premium",
    db: Session = None
) -> dict:
    """
    Generate creative menu name and concept story from flavor vector.
    """
    # Find dominant and secondary axes
    indexed = [(AXES[i], vector[i]) for i in range(min(5, len(vector)))]
    sorted_axes = sorted(indexed, key=lambda x: x[1], reverse=True)
    dominant = sorted_axes[0][0]
    secondary = sorted_axes[1][0]
    
    # Generate name
    style_words = NAME_STYLES.get(style, NAME_STYLES["premium"])
    prefix = random.choice(style_words)
    
    # Add category flavor
    category_suffix = {
        "Chicken": "치킨",
        "Pizza": "피자",
        "Burger": "버거",
        "Korean": "한식"
    }.get(category, "스페셜")
    
    name = f"{prefix} {dominant} {category_suffix}"
    
    # Generate story
    story_template = random.choice(STORY_TEMPLATES)
    story = story_template.format(
        style=prefix,
        dominant=dominant,
        secondary=secondary
    )
    
    # Generate keywords
    keywords = [dominant, secondary, prefix]
    if vector[0] > 0.7:
        keywords.append("매콤한")
    if vector[1] > 0.7:
        keywords.append("달콤한")
    
    return {
        "generated_name": name,
        "concept_story": story,
        "keywords": keywords[:4],
        "dominant_trait": dominant,
        "secondary_trait": secondary,
        "style": style
    }

# === Q1: 벡터 스냅샷 공유 ===

def create_vector_snapshot(
    reference_id: str,
    title: str,
    org_id: str,
    db: Session
) -> dict:
    """
    Create shareable snapshot card of a flavor vector.
    """
    ref = db.query(models.Reference).filter(models.Reference.id == reference_id).first()
    if not ref:
        raise ValueError("Reference not found")
    
    vector = [0.5] * 5
    if ref.fingerprints:
        vector = ref.fingerprints[0].vector[:5]
    
    # Generate unique share code
    share_code = hashlib.sha256(
        f"{reference_id}:{datetime.utcnow().isoformat()}".encode()
    ).hexdigest()[:12].upper()
    
    # Create card data
    card = {
        "share_code": share_code,
        "title": title or ref.name,
        "category": ref.menu_category,
        "vector": vector,
        "radar_data": [{"axis": AXES[i], "value": vector[i]} for i in range(5)],
        "created_at": datetime.utcnow().isoformat(),
        "share_url": f"/share/{share_code}"
    }
    
    return card

# === Q2: 맛 믹스 배틀 ===

def mix_battle(
    ref1_id: str,
    ref2_id: str,
    mix_ratio: float,
    db: Session
) -> dict:
    """
    Mix two references and score the result.
    """
    ref1 = db.query(models.Reference).filter(models.Reference.id == ref1_id).first()
    ref2 = db.query(models.Reference).filter(models.Reference.id == ref2_id).first()
    
    if not ref1 or not ref2:
        raise ValueError("Reference not found")
    
    vec1 = _normalize_vector(ref1.fingerprints[0].vector if ref1.fingerprints else [])
    vec2 = _normalize_vector(ref2.fingerprints[0].vector if ref2.fingerprints else [])
    
    # Mix vectors
    mixed = [vec1[i] * (1 - mix_ratio) + vec2[i] * mix_ratio for i in range(5)]
    
    # Score the mix
    balance_score = 1 - (max(mixed) - min(mixed))  # More balanced = higher
    intensity_score = sum(mixed) / 5  # Average intensity
    uniqueness_score = sum([abs(mixed[i] - 0.5) for i in range(5)]) / 5  # Deviation from center
    
    total_score = (balance_score * 0.3 + intensity_score * 0.3 + uniqueness_score * 0.4) * 100
    
    # Determine winner traits
    winner_traits = []
    for i in range(5):
        if vec1[i] > vec2[i]:
            winner_traits.append({"axis": AXES[i], "winner": ref1.name})
        else:
            winner_traits.append({"axis": AXES[i], "winner": ref2.name})
    
    return {
        "ref1": {"id": ref1.id, "name": ref1.name, "vector": vec1},
        "ref2": {"id": ref2.id, "name": ref2.name, "vector": vec2},
        "mix_ratio": mix_ratio,
        "result_vector": mixed,
        "scores": {
            "balance": round(balance_score * 100, 1),
            "intensity": round(intensity_score * 100, 1),
            "uniqueness": round(uniqueness_score * 100, 1),
            "total": round(total_score, 1)
        },
        "winner_traits": winner_traits
    }

# === Q2: 리스크 경고 레이더 ===

def analyze_risk_radar(
    vector: list,
    reference_name: str = ""
) -> dict:
    """
    Analyze flavor vector for potential risks.
    """
    warnings = []
    
    # Check for extreme values
    for i, val in enumerate(vector[:5]):
        if val > 0.9:
            warnings.append({
                "axis": AXES[i],
                "type": "EXCESS",
                "severity": "HIGH",
                "message": f"{AXES[i]} 과잉 - 소비자 수용성 저하 우려"
            })
        elif val < 0.1:
            warnings.append({
                "axis": AXES[i],
                "type": "DEFICIT",
                "severity": "MEDIUM",
                "message": f"{AXES[i]} 부족 - 맛 밸런스 불균형"
            })
    
    # Check for imbalance
    max_val = max(vector[:5])
    min_val = min(vector[:5])
    if max_val - min_val > 0.7:
        warnings.append({
            "type": "IMBALANCE",
            "severity": "MEDIUM",
            "message": "축간 편차가 큼 - 특화 전략 필요"
        })
    
    # Check for bland profile
    if all(0.4 < v < 0.6 for v in vector[:5]):
        warnings.append({
            "type": "BLAND",
            "severity": "LOW",
            "message": "평범한 프로필 - 차별화 포인트 부족"
        })
    
    # Overall risk score
    risk_score = len([w for w in warnings if w["severity"] == "HIGH"]) * 0.4 + \
                 len([w for w in warnings if w["severity"] == "MEDIUM"]) * 0.2 + \
                 len([w for w in warnings if w["severity"] == "LOW"]) * 0.1
    
    return {
        "reference_name": reference_name,
        "vector": vector,
        "warnings": warnings,
        "warning_count": len(warnings),
        "risk_score": min(1.0, round(risk_score, 2)),
        "recommendation": "개선 필요" if risk_score > 0.5 else "양호"
    }

# === Q3: 메뉴 포트폴리오 최적화 ===

def optimize_portfolio(
    reference_ids: list,
    target_coverage: float,
    db: Session
) -> dict:
    """
    Optimize menu portfolio for maximum coverage and differentiation.
    """
    # Get all reference vectors
    refs = []
    for ref_id in reference_ids:
        ref = db.query(models.Reference).filter(models.Reference.id == ref_id).first()
        if ref and ref.fingerprints:
            refs.append({
                "id": ref.id,
                "name": ref.name,
                "vector": ref.fingerprints[0].vector[:5]
            })
    
    if len(refs) < 2:
        raise ValueError("Need at least 2 references for portfolio analysis")
    
    # Calculate coverage per axis
    axis_coverage = []
    for i in range(5):
        values = [r["vector"][i] for r in refs]
        coverage = max(values) - min(values)
        axis_coverage.append({
            "axis": AXES[i],
            "min": round(min(values), 2),
            "max": round(max(values), 2),
            "coverage": round(coverage, 2),
            "gap": "OK" if coverage >= target_coverage else "GAP"
        })
    
    # Find overlapping products
    overlaps = []
    for i, r1 in enumerate(refs):
        for j, r2 in enumerate(refs):
            if i < j:
                similarity = 1 - sum([abs(r1["vector"][k] - r2["vector"][k]) for k in range(5)]) / 5
                if similarity > 0.8:
                    overlaps.append({
                        "product1": r1["name"],
                        "product2": r2["name"],
                        "similarity": round(similarity, 2)
                    })
    
    # Generate recommendations
    recommendations = []
    for ac in axis_coverage:
        if ac["gap"] == "GAP":
            recommendations.append(f"{ac['axis']} 축 커버리지 확대 필요 (현재: {ac['coverage']:.0%})")
    
    if overlaps:
        recommendations.append(f"중복 메뉴 {len(overlaps)}쌍 정리 검토")
    
    return {
        "total_products": len(refs),
        "axis_coverage": axis_coverage,
        "overlaps": overlaps,
        "overall_coverage": round(sum([ac["coverage"] for ac in axis_coverage]) / 5, 2),
        "recommendations": recommendations
    }

# === Q4: 맛 타임머신 ===

ERA_PROFILES = {
    "1990s": {"매운맛": 0.4, "단맛": 0.6, "감칠맛": 0.5, "상큼함": 0.3, "풍미": 0.4},
    "2000s": {"매운맛": 0.5, "단맛": 0.5, "감칠맛": 0.6, "상큼함": 0.4, "풍미": 0.5},
    "2010s": {"매운맛": 0.7, "단맛": 0.4, "감칠맛": 0.7, "상큼함": 0.5, "풍미": 0.6},
    "2020s": {"매운맛": 0.8, "단맛": 0.3, "감칠맛": 0.8, "상큼함": 0.6, "풍미": 0.7}
}

def time_machine_restore(
    current_vector: list,
    target_era: str,
    category: str = "General"
) -> dict:
    """
    Transform current flavor to match a specific era's taste profile.
    """
    era_profile = ERA_PROFILES.get(target_era)
    if not era_profile:
        raise ValueError(f"Unknown era: {target_era}. Available: {list(ERA_PROFILES.keys())}")
    
    era_vector = [era_profile[ax] for ax in AXES]
    
    # Calculate transformation
    delta = [era_vector[i] - current_vector[i] for i in range(5)]
    restored_vector = era_vector.copy()
    
    # Add some category-specific adjustment
    if category == "Chicken" and target_era in ["1990s", "2000s"]:
        restored_vector[0] -= 0.1  # Less spicy in earlier eras
    
    # Clamp values
    restored_vector = [max(0, min(1, v)) for v in restored_vector]
    
    # Generate era story
    era_stories = {
        "1990s": "IMF 이전 풍요로운 시절, 달콤하고 부드러운 맛이 주류였습니다.",
        "2000s": "감칠맛 열풍의 시작, MSG 논쟁과 함께 풍미가 강조되기 시작했습니다.",
        "2010s": "매운맛 챌린지 시대, 불닭볶음면이 등장하고 매운 음식이 대세가 되었습니다.",
        "2020s": "건강과 자극의 양면, 극강의 맵기와 함께 상큼한 맛의 균형을 추구합니다."
    }
    
    return {
        "original_vector": current_vector,
        "target_era": target_era,
        "era_profile": era_vector,
        "restored_vector": restored_vector,
        "transformation_delta": delta,
        "era_story": era_stories.get(target_era, ""),
        "key_changes": [
            {"axis": AXES[i], "change": round(delta[i], 2)}
            for i in range(5) if abs(delta[i]) > 0.1
        ]
    }
