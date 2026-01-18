from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import List, Dict, Any
import random
import math

router = APIRouter(
    prefix="/v1/market",
    tags=["market"],
    responses={404: {"description": "Not found"}},
)

class Vector3D(BaseModel):
    x: float
    y: float
    z: float
    label: str
    color: str

class MarketGapResponse(BaseModel):
    competitors: List[Vector3D]
    blue_ocean: Vector3D
    reasoning: str

# Flavor dimensions mapping for 3D visualization
# X: Savory (짠맛 + 감칠맛)
# Y: Sweet (단맛 - 신맛)
# Z: Spicy (매운맛)

def generate_competitors(category: str) -> List[Dict[str, Any]]:
    # Mock data generation based on category
    base_points = []
    
    if category == "burger":
        # Burgers are generally Savory (High X), slightly Sweet (Mid Y), varied Spicy (Z)
        names = ["맥도날드", "버거킹", "쉐이크쉑", "맘스터치", "롯데리아", "파이브가이즈", "프랭크버거", "다운타우너"]
        for name in names:
            # Generate multiple menu items for each brand
            for i in range(3):
                base_points.append({
                    "name": f"{name} 메뉴-{i+1}",
                    "vector": [
                        random.uniform(60, 90), # Savory
                        random.uniform(30, 70), # Sweet
                        random.uniform(10, 80), # Spicy
                        random.uniform(20, 60), # Fresh (unused in 3D)
                        random.uniform(50, 90)  # Umami (merged into Savory)
                    ]
                })
    else:
        # Generic fallback
        for i in range(30):
             base_points.append({
                "name": f"Competitor-{i}",
                "vector": [random.uniform(0, 100) for _ in range(5)]
            })
            
    return base_points

def calculate_blue_ocean(competitors: List[Dict[str, Any]]) -> Dict[str, Any]:
    # Monte Carlo method to find the largest gap
    # 1. Generate random candidate points
    candidates = []
    for _ in range(200):
        candidates.append([
            random.uniform(20, 90), # Stay within realistic edible bounds
            random.uniform(20, 90),
            random.uniform(10, 90),
            random.uniform(10, 90),
            random.uniform(10, 90)
        ])
    
    best_candidate = None
    max_min_distance = -1
    
    # 2. Find candidate with maximum distance to nearest competitor (Maximin)
    for cand in candidates:
        min_dist = float('inf')
        for comp in competitors:
            # Euclidean distance in 5D
            dist = math.sqrt(sum((c - v) ** 2 for c, v in zip(cand, comp['vector'])))
            if dist < min_dist:
                min_dist = dist
        
        if min_dist > max_min_distance:
            max_min_distance = min_dist
            best_candidate = cand
            
    return {
        "vector": best_candidate,
        "score": max_min_distance
    }

@router.get("/gap", response_model=MarketGapResponse)
async def get_market_gap(category: str = "burger"):
    raw_competitors = generate_competitors(category)
    blue_ocean_raw = calculate_blue_ocean(raw_competitors)
    
    # Convert to 3D visualization format
    # X: Savory (Avg of vector[0] and vector[4])
    # Y: Sweet (Avg of vector[1] and vector[3] inverted) - Simplified for viz
    # Z: Spicy (vector[2])
    
    viz_competitors = []
    for comp in raw_competitors:
        v = comp['vector']
        viz_competitors.append(Vector3D(
            x=(v[0] + v[4]) / 2, # Savory + Umami
            y=(v[1] + (100-v[3])) / 2, # Sweet + Low Freshness (Heavy)
            z=v[2], # Spicy
            label=comp['name'],
            color="#9ca3af" # Gray
        ))
        
    bo_v = blue_ocean_raw['vector']
    bo_viz = Vector3D(
        x=(bo_v[0] + bo_v[4]) / 2,
        y=(bo_v[1] + (100-bo_v[3])) / 2,
        z=bo_v[2],
        label="Blue Ocean Strategy",
        color="#3b82f6" # Blue
    )
    
    # Generate reasoning text
    reasoning = f"경쟁사들은 주로 '감칠맛(X)'과 '단맛(Y)' 영역에 집중되어 있습니다. \n" \
                f"발견된 블루오션은 매운맛(Z) {int(bo_v[2])}, 감칠맛 {int(bo_v[0])} 지점으로, \n" \
                f"기존 버거 시장에 없는 '강렬한 스파이시 + 고감칠맛' 세그먼트입니다."

    return MarketGapResponse(
        competitors=viz_competitors,
        blue_ocean=bo_viz,
        reasoning=reasoning
    )
