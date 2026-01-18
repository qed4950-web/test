
from typing import Dict, Any, List, Optional
import json
import re
import logging

logger = logging.getLogger(__name__)

def mutate_recipe(original_recipe: Dict[str, Any], mutation_strategy: str, intensity: int = 50) -> Dict[str, Any]:
    """
    Mutate a given recipe based on a specific strategy and intensity.
    
    Args:
        original_recipe: The base recipe dict (must contain name, ingredients, steps, flavor_profile).
        mutation_strategy: Strategy instruction (e.g., "More Spicy", "Healthier", "Cost Reduction").
        intensity: 0-100 scale of how aggressive the mutation should be.
        
    Returns:
        A new recipe dictionary with the mutations applied.
    """
    
    # Try LLM-based mutation first
    llm_result = _mutate_with_llm(original_recipe, mutation_strategy, intensity)
    if llm_result:
        return llm_result
        
    # Fallback if LLM fails
    return _fallback_mutation(original_recipe, mutation_strategy)


def _mutate_with_llm(original_recipe: Dict[str, Any], strategy: str, intensity: int) -> Optional[Dict[str, Any]]:
    """Use LLM to generate creative recipe mutation"""
    try:
        from backend.services.local_llm import generate_chat
        
        system_prompt = """당신은 분자요리 전문 셰프이자 레시피 전략가입니다.
주어진 레시피를 전략적 방향에 맞게 수정하되, 요리학적으로 타당하고 맛있는 결과물을 만들어야 합니다.
반드시 JSON 형식으로만 응답하세요."""

        user_prompt = f"""다음 레시피를 수정해주세요:

**원본 레시피**: {original_recipe.get('name', '이름 없음')}
**재료**: {', '.join(original_recipe.get('ingredients', []))}
**맛 프로필**: {original_recipe.get('flavor_profile', {})}

**변이 목표**: {strategy}
**강도**: {intensity}/100

다음 JSON 형식으로 응답하세요:
{{
  "name": "새로운 레시피 이름",
  "ingredients": ["재료1", "재료2", ...],
  "steps": ["단계1", "단계2", ...],
  "flavor_profile_change": "맛 변화 설명",
  "mutation_notes": "왜 이렇게 변경했는지 설명"
}}"""

        response = generate_chat([
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ])
        
        if not response:
            return None
            
        # Extract JSON from response
        json_match = re.search(r'\{[^{}]*\}', response, re.DOTALL)
        if json_match:
            result = json.loads(json_match.group(0))
            if "name" in result:
                return result
                
    except Exception as e:
        logger.warning(f"Recipe Mutation LLM failed: {e}")
        
    return None


def _fallback_mutation(original_recipe: Dict[str, Any], strategy: str) -> Dict[str, Any]:
    """Rule-based fallback mutation"""
    return {
        "name": f"변형 {original_recipe.get('name', '레시피')}",
        "ingredients": original_recipe.get('ingredients', []),
        "steps": original_recipe.get('steps', []),
        "flavor_profile_change": f"'{strategy}' 방향으로 수정됨",
        "mutation_notes": "AI 서비스를 사용할 수 없어 기본 변형이 적용되었습니다."
    }
