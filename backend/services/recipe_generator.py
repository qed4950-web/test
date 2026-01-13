from typing import List
import yaml

def generate_recipe_spec(vector: List[float]) -> str:
    """
    Converts a flavor vector into a Recipe Spec YAML.
    
    Mapping Heuristic (MVP):
    - Index 0 (Top Aroma) -> Spray Counts
    - Index 1 (First Bite) -> Oil Grams
    - Index 2 (Saltiness) -> Seasoning Grams
    - Index 3 (Aftertaste) -> Cook Time adjustment
    """
    if not vector or len(vector) < 4:
        return "error: vector_too_short"

    # 1. Spray (Aroma)
    spray_counts = max(1, int(vector[0] / 40))
    
    # 2. Oil (Body/Fat)
    oil_grams = round(vector[1] / 10, 1)
    
    # 3. Seasoning (Salt)
    salt_grams = round(vector[2] / 20, 1)
    
    # 4. Cook Time
    base_time = 120
    cook_time = base_time + int(vector[3] / 2)

    spec = {
        "steps": [
            {
                "step": "PREP",
                "action": "Seasoning",
                "params": {
                    "salt_mix_g": salt_grams
                }
            },
            {
                "step": "COOK",
                "action": "Grill",
                "params": {
                    "temp_c": 180,
                    "time_s": cook_time
                }
            },
            {
                "step": "FINISH",
                "action": "Spray & Glaze",
                "params": {
                    "spray_counts": spray_counts,
                    "oil_g": oil_grams
                }
            }
        ],
        "meta": {
            "source_vector_checksum": sum(vector)
        }
    }
    
    return yaml.dump(spec, sort_keys=False)
