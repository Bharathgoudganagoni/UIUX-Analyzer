from fastapi import APIRouter, HTTPException
from app.models.schemas import CodeGenerationRequest
from app.services.ai_service import ai_service
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/code")
async def generate_code(request: CodeGenerationRequest):
    """Generate React + CSS code from analysis data."""
    try:
        result = await ai_service.generate_code(
            analysis=request.analysis or {},
            redesign_image_path=request.redesign_image_path,
            user_instruction=request.user_instruction or ""
        )
        return result
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        logger.exception("Code generation failed")
        raise HTTPException(status_code=500, detail=f"Code generation failed: {str(e)}")
