from backend.services.rule_vectorizer import rule_vectorizer

def test_vectorize_spicy_sweet():
    keywords = ["spicy", "sweet"]
    # Base: [0.5, 0.5, 0.5, 0.5, 0.5]
    # Spicy: dim 0 += 0.3 -> 0.8
    # Sweet: dim 1 += 0.3 -> 0.8
    
    vector = rule_vectorizer.vectorize_from_keywords(keywords)
    assert vector[0] == 0.8
    assert vector[1] == 0.8
    assert vector[2] == 0.5

def test_vectorize_saturation():
    # Test capping at 1.0
    keywords = ["hot", "spicy", "spicy"] # 0.4 + 0.3 + 0.3 = 1.0 (from base 0.5? No, base is 0.5. 0.5 + 1.0 = 1.5 -> 1.0)
    # Wait, simple add: 0.5 + 0.4 = 0.9. + 0.3 = 1.2 -> 1.0
    
    vector = rule_vectorizer.vectorize_from_keywords(keywords)
    assert vector[0] == 1.0

def test_unknown_keyword():
    keywords = ["unknown_flavor"]
    vector = rule_vectorizer.vectorize_from_keywords(keywords)
    assert vector == [0.5, 0.5, 0.5, 0.5, 0.5]
