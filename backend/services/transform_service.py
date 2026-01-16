from typing import List, Optional

def calculate_target_vector(
    source_vec: List[float], 
    target_vec: List[float], 
    mode: str, 
    alpha: float = 0.0,
    direction: Optional[str] = None
) -> List[float]:
    """
    Computes the resulting flavor vector based on the transform mode.
    
    Args:
        source_vec: The 'Current' vector (Reference 2)
        target_vec: The 'Anchor' vector (Reference 1)
        mode: COPY | DISTANCE | REDIRECT
        alpha: 0.0 to 1.0 (Interpolation factor)
        direction: shift key for REDIRECT mode
    """
    
    # Ensure vectors are same length
    length = min(len(source_vec), len(target_vec))
    
    if mode == 'COPY':
        # Result is exactly the Anchor
        return target_vec[:length]
    
    elif mode == 'DISTANCE':
        # Linear Interpolation: Current -> Anchor
        # Result = Current + alpha * (Anchor - Current)
        # alpha 0.0 = Current
        # alpha 1.0 = Anchor
        result = []
        for i in range(length):
            diff = target_vec[i] - source_vec[i]
            val = source_vec[i] + (diff * float(alpha))
            result.append(round(val, 2))
        return result
        
    elif mode == 'REDIRECT':
        # Simple directional shift logic (MVP)
        # "spicy" might increase vector[2] (Saltiness/Spiciness placeholder)
        result = list(source_vec[:length])
        
        # Simple heuristic for MVP
        if direction == 'spicy' and length > 2:
            result[2] += 20.0 # Boost 3rd dim
        elif direction == 'savory' and length > 5:
            result[5] += 20.0 # Boost 6th dim (Umami)
        elif direction == 'signature':
            if length > 0:
                result[0] += 8.0
            if length > 4:
                result[4] += 12.0
            if length > 8:
                result[8] += 10.0
            
        return result
    
    return source_vec[:length]
