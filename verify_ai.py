
import requests
import json
import time

BASE_URL = "http://localhost:8000"

def test_vibe_analysis():
    print("\n--- Testing Vibe Analysis (Level 1) ---")
    payload = {"mode": "Energetic", "era": "1980s"}
    try:
        start = time.time()
        resp = requests.post(f"{BASE_URL}/v1/vibe/analyze", json=payload)
        resp.raise_for_status()
        data = resp.json()
        duration = time.time() - start
        
        print(f"Status: {resp.status_code} (took {duration:.2f}s)")
        print(f"DNA: {data.get('dna')}")
        print(f"Music: {data.get('music')}")
        
        if "colors" in data and len(data["colors"]) > 0:
            print("✅ Vibe Analysis Logic operational")
        else:
            print("❌ Vibe Analysis returned incomplete data")
            
    except Exception as e:
        print(f"❌ Test Failed: {e}")

def test_recipe_mutation():
    print("\n--- Testing Recipe Mutation (Level 5) ---")
    
    mock_recipe = {
        "name": "Classic Kimchi Stew",
        "ingredients": ["Kimchi", "Pork", "Tofu", "Onion"],
        "steps": ["Fry pork", "Add kimchi", "Boil with water", "Add tofu"],
        "flavor_profile": {"spicy": 70, "salty": 60, "umami": 80}
    }
    
    payload = {
        "recipe": mock_recipe,
        "strategy": "Vegan & Healthy",
        "intensity": 80
    }
    
    try:
        start = time.time()
        resp = requests.post(f"{BASE_URL}/v1/ai/mutate", json=payload)
        resp.raise_for_status()
        data = resp.json()
        duration = time.time() - start
        
        mutated = data.get("mutated_recipe", {})
        print(f"Status: {resp.status_code} (took {duration:.2f}s)")
        print(f"Original: {mock_recipe['name']}")
        print(f"Mutated Name: {mutated.get('name')}")
        print(f"Ingredients: {mutated.get('ingredients')}")
        print(f"Notes: {mutated.get('mutation_notes')}")
        
        if mutated.get("name") != mock_recipe["name"]:
            print("✅ Recipe Mutation operational")
        else:
            print("⚠️ Mutation might have failed or returned identical name")

    except Exception as e:
        print(f"❌ Test Failed: {e}")

def test_strategy_recommendation():
    print("\n--- Testing Strategy Recommendation (Level 3) ---")
    
    # First, get references to use
    try:
        refs_resp = requests.get(f"{BASE_URL}/v1/references/")
        refs = refs_resp.json()
        
        anchors = [r for r in refs if r.get("reference_type") == "ANCHOR"]
        brands = [r for r in refs if r.get("reference_type") == "BRAND"]
        
        if not anchors or not brands:
            print("⚠️ No references found. Seeding demo data...")
            requests.post(f"{BASE_URL}/v1/references/demo/seed")
            refs_resp = requests.get(f"{BASE_URL}/v1/references/")
            refs = refs_resp.json()
            anchors = [r for r in refs if r.get("reference_type") == "ANCHOR"]
            brands = [r for r in refs if r.get("reference_type") == "BRAND"]
        
        if not anchors or not brands:
            print("❌ Still no references after seeding")
            return
        
        anchor_id = anchors[0]["id"]
        competitor_ids = brands[0]["id"]
        
        start = time.time()
        resp = requests.post(
            f"{BASE_URL}/v1/strategies/recommend",
            params={
                "anchor_id": anchor_id,
                "competitor_ids": competitor_ids,
                "goal": "differentiate",
                "brand_tone": "premium",
                "price_tier": "mid"
            }
        )
        resp.raise_for_status()
        data = resp.json()
        duration = time.time() - start
        
        print(f"Status: {resp.status_code} (took {duration:.2f}s)")
        print(f"Recommended Mode: {data.get('recommendation', {}).get('mode')}")
        print(f"Alpha: {data.get('recommendation', {}).get('alpha')}")
        print(f"Confidence: {data.get('confidence')}")
        
        reasoning = data.get("reasoning", "")
        print(f"Reasoning (first 100 chars): {reasoning[:100]}...")
        
        if data.get("recommendation", {}).get("mode"):
            print("✅ Strategy Recommendation operational")
        else:
            print("❌ Strategy Recommendation returned incomplete data")
            
    except Exception as e:
        print(f"❌ Test Failed: {e}")

if __name__ == "__main__":
    print("Running AI Feature Verification...")
    test_vibe_analysis()
    test_recipe_mutation()
    test_strategy_recommendation()
