
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from backend.services.vibe_service import analyze_vibe, generate_playlist, analyze_vibe_from_image

router = APIRouter(
    prefix="/v1/vibe",
    tags=["vibe"],
)

class VibeRequest(BaseModel):
    mode: str
    era: str = "Modern"

class VibeResponse(BaseModel):
    colors: List[str]
    music: Dict[str, Any]
    scent: Dict[str, Any]
    dna: str
    synergy: Dict[str, Any]
    risk: List[Dict[str, Any]]
    personas: List[Dict[str, Any]]

class PlaylistItem(BaseModel):
    time: str
    label: str
    colors: List[str]
    music: Dict[str, Any]
    scent: Dict[str, Any]
    dna: str

class PlaylistResponse(BaseModel):
    playlist: List[PlaylistItem]

class VibeImageResponse(VibeResponse):
    mode: str
    era: str
    space_type: Optional[str] = None
    image_name: Optional[str] = None
    image_color: Optional[str] = None
    image_metrics: Optional[Dict[str, Any]] = None

@router.post("/analyze", response_model=VibeResponse)
def analyze_vibe_endpoint(request: VibeRequest):
    """
    Analyze sensory vibe for a given target atmosphere (mode) and era.
    """
    result = analyze_vibe(request.mode, request.era)
    return result

@router.post("/playlist", response_model=PlaylistResponse)
def generate_playlist_endpoint():
    """
    Generate a daily sensory playlist.
    """
    playlist = generate_playlist()
    return {"playlist": playlist}

@router.post("/curate-image", response_model=VibeImageResponse)
def curate_vibe_from_image(
    image: UploadFile = File(...),
    space_type: Optional[str] = Form(None),
    era: str = Form("Modern"),
):
    """
    Curate vibe based on a space image + optional space type hint.
    """
    if not image.content_type or not image.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Invalid image type")

    image_bytes = image.file.read()
    try:
        result = analyze_vibe_from_image(image_bytes, era=era, space_type=space_type or "")
    except Exception as exc:
        raise HTTPException(status_code=400, detail="Failed to process image") from exc
    return {
        **result,
        "image_name": image.filename,
    }
