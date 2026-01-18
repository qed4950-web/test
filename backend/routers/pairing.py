from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Dict, Any
import random

router = APIRouter(
    prefix="/v1/pairing",
    tags=["pairing"],
    responses={404: {"description": "Not found"}},
)

# Mock Chemical Compound Database
# Key: Ingredient, Value: List of dominant aroma compounds
INGREDIENT_DB = {
    "strawberry": ["furanneol", "ethyl butyrate", "methyl cinnamate", "gamma-decalactone"],
    "tomato": ["furanneol", "hexanal", "beta-ionone", "3-methylbutanal"],
    "chocolate": ["pyrazine", "vanillin", "linalool", "phenylacetaldehyde"],
    "parmesan": ["butyric acid", "furanneol", "glutamate", "ethyl butyrate"],
    "coffee": ["pyrazine", "furfurylthiol", "guaiacol"],
    "beef": ["pyrazine", "methional", "2-methyl-3-furanthiol"],
    "basil": ["linalool", "eugenol", "estragole"],
    "mint": ["menthol", "carvone", "limonene"],
    "lime": ["limonene", "citral", "terpineol"],
    "kimchi": ["lactic acid", "capsaicin", "sulfur compounds", "glutamate"],
    "soy_sauce": ["furanone", "methional", "glutamate"],
    "vanilla": ["vanillin", "piperonal", "p-hydroxybenzaldehyde"]
}

class IngredientNode(BaseModel):
    id: str
    group: int # 1: Core, 2: High Affinity, 3: Unexpected
    radius: int

class Link(BaseModel):
    source: str
    target: str
    value: float # Shared compound count or affinity score

class NetworkResponse(BaseModel):
    nodes: List[IngredientNode]
    links: List[Link]
    analysis: str

@router.get("/network", response_model=NetworkResponse)
async def get_pairing_network(ingredient: str = "strawberry"):
    # Find pairings based on shared compounds
    target_compounds = INGREDIENT_DB.get(ingredient.lower(), [])
    
    nodes = [{"id": ingredient, "group": 1, "radius": 20}]
    links = []
    
    similarities = []
    
    for other_ing, compounds in INGREDIENT_DB.items():
        if other_ing == ingredient.lower():
            continue
            
        # Calculate shared compounds (Intersection)
        shared = set(target_compounds).intersection(set(compounds))
        score = len(shared)
        
        if score > 0:
            similarities.append((other_ing, score, list(shared)))

    # Sort by score
    similarities.sort(key=lambda x: x[1], reverse=True)
    
    # Top 3 'Science Matches'
    top_matches = similarities[:3]
    
    # Add nodes and links
    for ing, score, shared in top_matches:
        nodes.append({"id": ing, "group": 2, "radius": 15})
        links.append({"source": ingredient, "target": ing, "value": score})
        
    # Generate analysis text
    shared_chem = top_matches[0][2][0] if top_matches and top_matches[0][2] else "unknown"
    best_match = top_matches[0][0] if top_matches else "none"
    
    analysis = f"과학적 분석 결과, '{ingredient}'는 '{best_match}'와(과) 분자 구조상 최고의 궁합입니다. \n" \
               f"공통 화합물 '{shared_chem}'이(가) 두 재료의 풍미를 연결해줍니다."

    return NetworkResponse(nodes=nodes, links=links, analysis=analysis)
