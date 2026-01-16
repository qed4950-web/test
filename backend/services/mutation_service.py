
from typing import Dict, Any, List
from backend.services.local_llm import generate_json

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
    
    system_prompt = (
        "You are a master molecular chef and recipe strategist. "
        "Your goal is to modify a recipe based on a specific strategic direction "
        "while ensuring the result is kulinary valid and delicious. "
        "Return the result IN JSON FORMAT ONLY."
    )
    
    user_prompt = (
        f"Original Recipe: {original_recipe.get('name', 'Unknown')}\n"
        f"Ingredients: {original_recipe.get('ingredients', [])}\n"
        f"Flavor Profile: {original_recipe.get('flavor_profile', {})}\n\n"
        f"Mutation Goal: {mutation_strategy}\n"
        f"Intensity (0-100): {intensity}\n\n"
        "Please generate a mutated version of this recipe.\n"
        "Return a JSON object with:\n"
        "- name: New creative name indicating the change\n"
        "- ingredients: List of modified ingredients (quantity + name)\n"
        "- steps: List of adjusted cooking steps\n"
        "- flavor_profile_change: Text description of how the flavor vector shifted\n"
        "- mutation_notes: Explanation of why these specific changes were made to satisfy the goal"
    )
    
    try:
        result = generate_json([
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ])
        
        if result and isinstance(result, dict) and "name" in result:
            return result
            
    except Exception as e:
        print(f"Recipe Mutation failed: {e}")
        
    # Fallback if LLM fails
    return {
        "name": f"Mutated {original_recipe.get('name', 'Recipe')}",
        "ingredients": original_recipe.get('ingredients', []),
        "steps": original_recipe.get('steps', []),
        "flavor_profile_change": "Mutation processing failed, reverting to original.",
        "mutation_notes": "AI service unavailable."
    }
