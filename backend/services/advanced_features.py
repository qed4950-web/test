import random
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from backend import models

AXES = ["매운맛", "단맛", "감칠맛", "상큼함", "풍미"]

# === Q2: 레시피 변환 룰 개선 ===

TRANSFORM_RULES = {
    "spicy_boost": {
        "name": "매운맛 강화",
        "description": "매운맛 축을 높이고 단맛을 낮춤",
        "delta": [0.2, -0.1, 0.05, 0, 0.1],
        "constraints": {"매운맛": {"min": 0, "max": 1.0}}
    },
    "umami_focus": {
        "name": "감칠맛 집중",
        "description": "감칠맛과 풍미를 강화",
        "delta": [0, 0, 0.25, 0, 0.15],
        "constraints": {"감칠맛": {"min": 0, "max": 1.0}}
    },
    "refreshing_turn": {
        "name": "상큼 전환",
        "description": "상큼함과 단맛 강화, 매운맛 감소",
        "delta": [-0.15, 0.1, 0, 0.25, 0],
        "constraints": {}
    },
    "premium_upgrade": {
        "name": "프리미엄 업그레이드",
        "description": "전체 풍미 축 강화",
        "delta": [0.05, 0.05, 0.1, 0.05, 0.2],
        "constraints": {}
    },
    "balanced_smooth": {
        "name": "균형 조정",
        "description": "극단값을 중간으로 조정",
        "delta": "balance",  # Special rule
        "constraints": {}
    }
}

def get_transform_rules() -> List[Dict[str, Any]]:
    """Get all available transform rules"""
    return [
        {"key": k, **v} for k, v in TRANSFORM_RULES.items()
    ]

def apply_transform_rule(
    vector: List[float],
    rule_key: str,
    intensity: float = 1.0
) -> Dict[str, Any]:
    """Apply a predefined transform rule to a vector"""
    if rule_key not in TRANSFORM_RULES:
        raise ValueError(f"Unknown rule: {rule_key}")
    
    rule = TRANSFORM_RULES[rule_key]
    
    if rule["delta"] == "balance":
        # Special balancing rule
        avg = sum(vector[:5]) / 5
        result = [v + (avg - v) * 0.5 * intensity for v in vector[:5]]
    else:
        delta = rule["delta"]
        result = [vector[i] + delta[i] * intensity for i in range(5)]
    
    # Clamp values
    result = [max(0, min(1, v)) for v in result]
    
    # Check constraints
    violations = []
    for axis, limits in rule["constraints"].items():
        idx = AXES.index(axis)
        if result[idx] < limits.get("min", 0) or result[idx] > limits.get("max", 1):
            violations.append(f"{axis} 범위 초과")
    
    return {
        "original_vector": vector[:5],
        "result_vector": result,
        "rule_applied": rule_key,
        "rule_name": rule["name"],
        "intensity": intensity,
        "delta_applied": [result[i] - vector[i] for i in range(5)],
        "violations": violations
    }

# === Q3: 충돌/시너지 맵 ===

def calculate_synergy_map(
    reference_ids: List[str],
    db: Session
) -> Dict[str, Any]:
    """
    Calculate synergy and conflict between multiple references.
    """
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
        raise ValueError("Need at least 2 references")
    
    synergies = []
    conflicts = []
    
    # Pairwise analysis
    for i in range(len(refs)):
        for j in range(i + 1, len(refs)):
            r1, r2 = refs[i], refs[j]
            
            # Calculate per-axis relationship
            for k in range(5):
                diff = abs(r1["vector"][k] - r2["vector"][k])
                combined = (r1["vector"][k] + r2["vector"][k]) / 2
                
                if diff < 0.2 and combined > 0.6:
                    # Similar and both strong = synergy
                    synergies.append({
                        "pair": [r1["name"], r2["name"]],
                        "axis": AXES[k],
                        "strength": round(combined, 2),
                        "type": "AMPLIFY",
                        "recommendation": f"두 제품 함께 {AXES[k]} 마케팅 가능"
                    })
                elif diff > 0.5:
                    # Very different = conflict
                    conflicts.append({
                        "pair": [r1["name"], r2["name"]],
                        "axis": AXES[k],
                        "gap": round(diff, 2),
                        "type": "CONFLICT",
                        "recommendation": f"{AXES[k]} 축 차별화 포인트로 활용"
                    })
    
    # Calculate overall metrics
    total_synergy = len(synergies)
    total_conflict = len(conflicts)
    balance_score = total_synergy / max(1, total_synergy + total_conflict)
    
    return {
        "analyzed_products": len(refs),
        "synergies": synergies[:10],  # Top 10
        "conflicts": conflicts[:10],  # Top 10
        "synergy_count": total_synergy,
        "conflict_count": total_conflict,
        "balance_score": round(balance_score, 2),
        "portfolio_health": "EXCELLENT" if balance_score > 0.6 else "GOOD" if balance_score > 0.4 else "NEEDS_WORK"
    }

# === Q4: 탐색 모드 ===

def explore_vector_search(
    target_kpi: Dict[str, float],
    constraints: Dict[str, Any],
    iterations: int = 100
) -> Dict[str, Any]:
    """
    Explore vector space to find optimal profile for target KPI.
    """
    best_vector = None
    best_score = -1
    search_history = []
    
    # Define target ranges based on KPI
    target_profile = _kpi_to_target_profile(target_kpi)
    
    for i in range(iterations):
        # Generate candidate vector
        if best_vector is None:
            # Start from target profile with noise
            candidate = [max(0, min(1, target_profile[j] + random.uniform(-0.3, 0.3))) for j in range(5)]
        else:
            # Mutate best vector
            candidate = [max(0, min(1, best_vector[j] + random.uniform(-0.1, 0.1))) for j in range(5)]
        
        # Apply constraints
        candidate = _apply_constraints(candidate, constraints)
        
        # Score candidate
        score = _score_vector(candidate, target_kpi)
        
        if score > best_score:
            best_score = score
            best_vector = candidate
            search_history.append({
                "iteration": i,
                "vector": [round(v, 2) for v in candidate],
                "score": round(score, 3)
            })
    
    # Predict KPI from best vector
    predicted_kpi = _vector_to_kpi(best_vector)
    
    return {
        "optimal_vector": [round(v, 2) for v in best_vector],
        "optimization_score": round(best_score, 3),
        "predicted_kpi": predicted_kpi,
        "target_kpi": target_kpi,
        "iterations_run": iterations,
        "improvements_found": len(search_history),
        "search_path": search_history[-5:],  # Last 5 improvements
        "dominant_traits": [AXES[i] for i in sorted(range(5), key=lambda x: best_vector[x], reverse=True)[:2]]
    }

def _kpi_to_target_profile(target_kpi: Dict[str, float]) -> List[float]:
    """Convert KPI targets to approximate vector profile"""
    base = [0.5] * 5
    
    if target_kpi.get("sales_lift", 0) > 0.1:
        base[0] += 0.1  # Higher spicy trending
        base[2] += 0.1  # More umami
    
    if target_kpi.get("cost_reduction", 0) > 0.1:
        base[4] -= 0.1  # Less complex flavor
    
    if target_kpi.get("differentiation", 0) > 0.5:
        # Polarize profile
        idx = random.randint(0, 4)
        base[idx] = 0.9
    
    return base

def _apply_constraints(vector: List[float], constraints: Dict[str, Any]) -> List[float]:
    """Apply constraints to vector"""
    result = vector.copy()
    
    if "max_spicy" in constraints:
        result[0] = min(result[0], constraints["max_spicy"])
    if "min_umami" in constraints:
        result[2] = max(result[2], constraints["min_umami"])
    
    return result

def _score_vector(vector: List[float], target_kpi: Dict[str, float]) -> float:
    """Score how well a vector matches KPI targets"""
    score = 0.5
    
    # Higher spicy/umami = higher sales potential
    sales_potential = (vector[0] * 0.3 + vector[2] * 0.4 + vector[4] * 0.3)
    if "sales_lift" in target_kpi:
        if sales_potential > target_kpi["sales_lift"]:
            score += 0.2
    
    # More balanced = lower cost
    balance = 1 - (max(vector) - min(vector))
    if "cost_reduction" in target_kpi:
        if balance > 0.5:
            score += 0.15
    
    # Uniqueness
    uniqueness = sum([abs(v - 0.5) for v in vector]) / 5
    if "differentiation" in target_kpi:
        if uniqueness > target_kpi["differentiation"]:
            score += 0.15
    
    return min(1.0, score)

def _vector_to_kpi(vector: List[float]) -> Dict[str, float]:
    """Predict KPI from vector"""
    return {
        "predicted_sales_lift": round((vector[0] * 0.3 + vector[2] * 0.4) * 0.3, 3),
        "predicted_cost_delta": round(-0.05 - (vector[4] * 0.1), 3),
        "predicted_uniqueness": round(sum([abs(v - 0.5) for v in vector]) / 5, 3)
    }
