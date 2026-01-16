import time
import json
from typing import Dict, Any, Optional, Type
from pydantic import BaseModel, ValidationError
from sqlalchemy.orm import Session
from .llm_cache import llm_cache

class LLMService:
    def __init__(self):
        self.primary_model = "gpt-4-turbo"
        self.fallback_model = "gpt-3.5-turbo"
    
    def mock_call(self, model: str, prompt: str, schema: Type[BaseModel] = None) -> Dict[str, Any]:
        """Mock LLM response for demonstration"""
        # Simulate occasional failure
        if "fail_please" in prompt and model == self.primary_model:
            raise Exception("Primary model overload")
            
        if schema:
            # Return dummy data matching schema
            if "Recipe" in str(schema):
                return {"name": "Mock Recipe", "ingredients": ["salt", "pepper"]}
            if "Metric" in str(schema):
                return {"taste_score": 8.5, "texture": "crispy"}
        
        return {"content": "Mock text response"}

    def safe_generate(
        self, 
        prompt: str, 
        db: Session = None,
        schema: Type[BaseModel] = None, 
        max_retries: int = 3
    ) -> Dict[str, Any]:
        """
        Reliable generation with Caching:
        1. Check Cache (if db provided)
        2. JSON Schema enforcement
        3. Retries & Fallback
        """
        model_config = self.primary_model
        
        # 1. Check Cache
        if db:
            cached = llm_cache.get_cached_response(db, prompt, model_config)
            if cached:
                print("Returning cached LLM response")
                return cached
        
        # Try Primary Model
        for attempt in range(max_retries):
            try:
                response = self.mock_call(self.primary_model, prompt, schema)
                # Validation (Mocked here, but in real life we parse the JSON)
                if schema:
                    # Validate against pydantic
                    pass
                
                # Cache Success
                if db:
                    llm_cache.cache_response(db, prompt, model_config, response)
                    
                return response
                
            except Exception as e:
                print(f"Primary model attempt {attempt+1} failed: {e}")
                time.sleep(0.5)
        
        # Fallback
        print("Switching to Fallback Model...")
        try:
            return self.mock_call(self.fallback_model, prompt, schema)
        except Exception as e:
            raise Exception(f"All models failed: {e}")

llm_service = LLMService()
