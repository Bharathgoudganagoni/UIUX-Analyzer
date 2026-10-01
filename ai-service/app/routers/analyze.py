from fastapi import APIRouter, HTTPException
from app.models.schemas import ImageAnalysisRequest, WebsiteAnalysisRequest
from app.services.ai_service import ai_service
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/image")
async def analyze_image(request: ImageAnalysisRequest):
    """Analyze a UI screenshot using a vision model."""
    try:
        result = await ai_service.analyze_image(
            image_path=request.image_path,
            user_instruction=request.user_instruction or ""
        )
        return result
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        logger.exception("Image analysis failed")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


@router.post("/website")
async def analyze_website(request: WebsiteAnalysisRequest):
    """Analyze a website screenshot with accessibility context."""
    try:
        result = await ai_service.analyze_website(
            url=request.url,
            screenshot_path=request.screenshot_path,
            html_content=request.html_content or "",
            axe_results=request.axe_results,
            user_instruction=request.user_instruction or ""
        )
        return result
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        logger.exception("Website analysis failed")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")
