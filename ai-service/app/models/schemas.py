from pydantic import BaseModel
from typing import Optional, List, Dict, Any


class Issue(BaseModel):
    title: str
    description: str
    whyItMatters: str
    recommendation: str
    severity: str  # low | medium | high


class CategoryAnalysis(BaseModel):
    issues: List[Issue] = []


class AnalysisResult(BaseModel):
    summary: str
    categories: Dict[str, CategoryAnalysis]
    recommendations: List[str] = []
    redesignInstructions: List[str] = []


class ImageAnalysisRequest(BaseModel):
    image_path: str
    user_instruction: Optional[str] = ""


class WebsiteAnalysisRequest(BaseModel):
    url: str
    screenshot_path: str
    html_content: Optional[str] = ""
    axe_results: Optional[Dict[str, Any]] = None
    user_instruction: Optional[str] = ""


class CodeGenerationRequest(BaseModel):
    analysis: Optional[Dict[str, Any]] = {}
    redesign_image_path: Optional[str] = None
    user_instruction: Optional[str] = ""


class GeneratedCode(BaseModel):
    jsx: str
    css: str
    tailwind: Optional[str] = None
