from typing import List, Dict

class RuleBasedVectorizer:
    """
    Simple rule-based vectorizer mapping keywords to flavor dimensions.
    Dimensions (Mock): [Spiciness, Sweetness, Saltiness, Richness, Texture]
    Base Vector: [0.5, 0.5, 0.5, 0.5, 0.5]
    """
    
    KEYWORD_RULES = {
        "spicy": (0, 0.3),   # Increase dim 0
        "hot": (0, 0.4),
        "mild": (0, -0.2),
        
        "sweet": (1, 0.3),   # Increase dim 1
        "sugary": (1, 0.4),
        "bitter": (1, -0.3),
        
        "salty": (2, 0.3),   # Increase dim 2
        "savory": (2, 0.2),
        
        "rich": (3, 0.3),    # Increase dim 3
        "creamy": (3, 0.3),
        "light": (3, -0.2),
        
        "crispy": (4, 0.3),  # Increase dim 4
        "soft": (4, -0.2),
        "chewy": (4, 0.2)
    }

    def vectorize_from_keywords(self, keywords: List[str]) -> List[float]:
        # Start with neutral base
        vector = [0.5, 0.5, 0.5, 0.5, 0.5]
        
        for k in keywords:
            rule = self.KEYWORD_RULES.get(k.lower())
            if rule:
                idx, val = rule
                vector[idx] = max(0.0, min(1.0, vector[idx] + val))
                
        return vector

rule_vectorizer = RuleBasedVectorizer()
