
from typing import List, Dict, Any, Tuple
from PIL import Image
import colorsys
import io
import json
from backend.services.local_llm import generate_json

# Deterministic Fallback Data (kept for safety/fallback)
VIBE_DATA_SOURCE = {
    "Chill": {
        "colors": ["#E0F2F1", "#B2DFDB", "#80CBC4", "#4DB6AC", "#26A69A"],
        "music": {"track": "Lo-Fi Sunday", "genre": "Lo-Fi Hip Hop", "bpm": 85},
        "scent": {"top": "Lavender", "middle": "Chamomile", "base": "Sandalwood"},
        "dna": "Minimalist",
        "synergy": {"score": 98, "status": "Perfect Harmony"},
        "risk": [],
        "personas": []
    }
}

def _generate_vibe_prompt(mode: str, era: str) -> str:
    return (
        f"Analyze the sensory vibe for a space with Mode='{mode}' and Era='{era}'.\n"
        "Return a JSON object with the following keys:\n"
        "- colors: list of 5 hex color codes\n"
        "- music: {track (str), genre (str), bpm (int)}\n"
        "- scent: {top (str), middle (str), base (str)}\n"
        "- dna: a short string describing the core identity (elemental DNA)\n"
        "- synergy: {score (int 0-100), status (str)}\n"
        "- risk: list of {subject (str), A (int 0-100), fullMark (100)}\n"
        "- personas: list of {initial (1 char), name (str), comment (str), likes (int)}\n"
        "Be creative and specific to the requested era and mode."
    )

def analyze_vibe(mode: str, era: str = "Modern") -> Dict[str, Any]:
    """
    Returns AI-generated vibe analysis data for a given mode and era.
    Falls back to deterministic data if LLM fails.
    """
    system_prompt = "You are a sensory design director. Return valid JSON only."
    user_prompt = _generate_vibe_prompt(mode, era)
    
    try:
        result = generate_json([
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ])
        
        if result and isinstance(result, dict):
            # Basic validation
            if "colors" in result and "music" in result:
                return result
    except Exception as e:
        print(f"LLM Vibe Analysis failed: {e}")

    # Fallback Logic
    base_data = VIBE_DATA_SOURCE.get(mode, {
        "colors": ["#ddd", "#ccc", "#bbb"],
        "music": {"track": "Unknown", "genre": "N/A", "bpm": 0},
        "scent": {"top": "N/A", "middle": "N/A", "base": "N/A"},
        "dna": "Generic",
        "synergy": {"score": 50, "status": "Average"},
        "risk": [],
        "personas": []
    }).copy()
    
    # Simple Era modifier for fallback
    if era != "Modern":
        base_data["dna"] = f"{era} {base_data['dna']}"
    
    return base_data

def generate_playlist(modes: List[str] = ["Energetic", "Focus", "Chill", "Romantic"]) -> List[Dict[str, Any]]:
    """
    Generates a daily playlist schedule.
    """
    schedule = [
        {"time": "09:00", "label": "Morning Boost", "mode": "Energetic"},
        {"time": "14:00", "label": "Deep Focus", "mode": "Focus"},
        {"time": "19:00", "label": "Sunset Chill", "mode": "Chill"},
        {"time": "22:00", "label": "Midnight Mood", "mode": "Romantic"},
    ]
    
    playlist = []
    for item in schedule:
        vibe_data = analyze_vibe(item["mode"])
        playlist.append({
            "time": item["time"],
            "label": item["label"],
            "colors": vibe_data.get("colors", []),
            "music": vibe_data.get("music", {}),
            "scent": vibe_data.get("scent", {}),
            "dna": vibe_data.get("dna", "")
        })
    return playlist

def infer_mode_from_space_type(space_type: str) -> str:
    """
    Lightweight mapping from space type to vibe mode.
    Defaults to Chill when unknown.
    """
    if not space_type:
        return "Chill"

    normalized = space_type.strip().lower()
    mapping = {
        "cafe": "Chill",
        "cafe_bar": "Romantic",
        "hotel": "Romantic",
        "retail": "Energetic",
        "office": "Focus",
        "gallery": "Focus",
        "popup": "Energetic",
        "restaurant": "Romantic",
        "studio": "Focus",
    }
    return mapping.get(normalized, "Chill")

def _hex_from_rgb(rgb: Tuple[int, int, int]) -> str:
    return "#{:02X}{:02X}{:02X}".format(*rgb)

def _extract_image_metrics(image_bytes: bytes) -> Dict[str, Any]:
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    image = image.resize((64, 64))
    pixels = list(image.getdata())
    total = len(pixels) or 1
    avg = (
        int(sum(p[0] for p in pixels) / total),
        int(sum(p[1] for p in pixels) / total),
        int(sum(p[2] for p in pixels) / total),
    )
    r, g, b = [v / 255 for v in avg]
    h, l, s = colorsys.rgb_to_hls(r, g, b)
    return {
        "avg_rgb": avg,
        "avg_hex": _hex_from_rgb(avg),
        "brightness": round(l, 3),
        "saturation": round(s, 3),
        "hue": round(h, 3),
    }

def _infer_mode_from_image(metrics: Dict[str, Any]) -> str:
    brightness = metrics.get("brightness", 0.5)
    saturation = metrics.get("saturation", 0.5)

    if brightness >= 0.7 and saturation >= 0.45:
        return "Energetic"
    if brightness <= 0.35:
        return "Romantic"
    if saturation <= 0.2:
        return "Focus"
    return "Chill"

def analyze_vibe_from_image(image_bytes: bytes, era: str = "Modern", space_type: str = "") -> Dict[str, Any]:
    """
    Infer vibe using basic color metrics from the provided image.
    Uses space type as a hint when supplied.
    """
    metrics = _extract_image_metrics(image_bytes)
    hinted_mode = infer_mode_from_space_type(space_type) if space_type else ""
    inferred_mode = _infer_mode_from_image(metrics)
    mode = hinted_mode or inferred_mode
    
    # Enhanced analysis: Pass image metrics to the vibe generator if possible, 
    # but for now we simply use the inferred mode to trigger the standard analysis.
    # Ideally, we could feed "brightness/saturation" into the LLM prompt for more accuracy.
    
    result = analyze_vibe(mode, era)
    
    return {
        **result,
        "mode": mode,
        "era": era,
        "space_type": space_type or None,
        "image_metrics": metrics,
        "image_color": metrics.get("avg_hex"),
    }
