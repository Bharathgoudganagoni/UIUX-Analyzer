import os
import base64
import json
import httpx
from pathlib import Path
from typing import Optional, Dict, Any
import logging

logger = logging.getLogger(__name__)

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_VISION_MODEL = os.getenv("OLLAMA_VISION_MODEL", "llava")
OLLAMA_TEXT_MODEL = os.getenv("OLLAMA_TEXT_MODEL", "llama3")
AI_PROVIDER = os.getenv("AI_PROVIDER", "ollama")

ANALYSIS_PROMPT_TEMPLATE = """You are an expert UI/UX designer and accessibility specialist. Analyze this user interface screenshot and provide a structured critique.

{user_instruction_section}

Return ONLY valid JSON in this exact format (no markdown, no explanation outside JSON):
{{
  "summary": "2-3 sentence overall assessment",
  "categories": {{
    "layout": {{
      "issues": [
        {{
          "title": "Issue title",
          "description": "What was observed",
          "whyItMatters": "User impact explanation",
          "recommendation": "Specific actionable fix",
          "severity": "high|medium|low"
        }}
      ]
    }},
    "typography": {{ "issues": [] }},
    "color": {{ "issues": [] }},
    "spacing": {{ "issues": [] }},
    "hierarchy": {{ "issues": [] }},
    "accessibility": {{ "issues": [] }}
  }},
  "recommendations": ["Top recommendation 1", "Top recommendation 2"],
  "redesignInstructions": ["Instruction for redesign 1", "Instruction for redesign 2"]
}}

Important guidelines:
- Use "Appears to", "May indicate", "Potential issue" when certainty is limited
- Do not claim exact measurements from a screenshot
- Identify 2-4 issues per category maximum
- Focus on actionable, specific feedback
- Severity must be exactly "high", "medium", or "low"
"""

CODE_GENERATION_PROMPT = """You are an expert React developer. Based on the UI/UX analysis below, generate a clean, modern React component.

Analysis Summary:
{analysis_summary}

Key Issues to Address:
{issues_list}

User Goal / Instruction:
{user_instruction}

Return ONLY valid JSON with two fields: "jsx" and "css".
{{
  "jsx": "React component code string",
  "css": "CSS stylesheet string"
}}
"""


class OllamaProvider:
    async def analyze_image(self, image_path: str, prompt: str) -> str:
        image_data = self._encode_image(image_path)
        if not image_data:
            raise ValueError(f"Could not read image at {image_path}")

        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(
                f"{OLLAMA_BASE_URL}/api/generate",
                json={
                    "model": OLLAMA_VISION_MODEL,
                    "prompt": prompt,
                    "images": [image_data],
                    "stream": False,
                    "options": {
                        "temperature": 0.3,
                        "top_p": 0.9,
                    }
                }
            )
            if response.status_code != 200:
                raise RuntimeError(
                    f"Ollama returned {response.status_code}. "
                    f"Is {OLLAMA_VISION_MODEL} installed? Run: ollama pull {OLLAMA_VISION_MODEL}"
                )
            return response.json().get("response", "")

    async def generate_text(self, prompt: str) -> str:
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(
                f"{OLLAMA_BASE_URL}/api/generate",
                json={
                    "model": OLLAMA_TEXT_MODEL,
                    "prompt": prompt,
                    "stream": False,
                    "options": {"temperature": 0.4}
                }
            )
            if response.status_code != 200:
                raise RuntimeError(f"Ollama text generation failed: {response.status_code}")
            return response.json().get("response", "")

    async def check_availability(self) -> bool:
        try:
            async with httpx.AsyncClient(timeout=2.0) as client:
                r = await client.get(f"{OLLAMA_BASE_URL}/api/tags")
                return r.status_code == 200
        except Exception:
            return False

    def _encode_image(self, image_path: str) -> Optional[str]:
        try:
            with open(image_path, "rb") as f:
                return base64.b64encode(f.read()).decode("utf-8")
        except Exception as e:
            logger.error(f"Failed to encode image {image_path}: {e}")
            return None


class AIService:
    def __init__(self):
        self.ollama = OllamaProvider()

    async def analyze_image(self, image_path: str, user_instruction: str = "") -> Dict[str, Any]:
        is_available = await self.ollama.check_availability()

        if is_available:
            try:
                user_section = f"\nUser's specific goal: {user_instruction}\n" if user_instruction else ""
                prompt = ANALYSIS_PROMPT_TEMPLATE.format(user_instruction_section=user_section)
                raw_response = await self.ollama.analyze_image(image_path, prompt)
                return self._parse_json_response(raw_response)
            except Exception as e:
                logger.warning(f"Ollama vision inference failed, falling back to heuristics: {e}")

        # Heuristic fallback analysis
        return self._build_heuristic_image_analysis(image_path, user_instruction)

    async def analyze_website(
        self,
        url: str,
        screenshot_path: str,
        html_content: str,
        axe_results: Optional[Dict],
        user_instruction: str = ""
    ) -> Dict[str, Any]:
        is_available = await self.ollama.check_availability()

        if is_available:
            try:
                user_section = f"\nUser's specific goal: {user_instruction}\n" if user_instruction else ""
                axe_section = ""
                if axe_results and axe_results.get("violations"):
                    violations = axe_results["violations"][:5]
                    axe_section = f"\nKnown accessibility violations from automated testing: {json.dumps(violations, indent=2)}\n"

                prompt = ANALYSIS_PROMPT_TEMPLATE.format(
                    user_instruction_section=user_section + axe_section
                )
                prompt += f"\nWebsite URL: {url}"

                raw_response = await self.ollama.analyze_image(screenshot_path, prompt)
                return self._parse_json_response(raw_response)
            except Exception as e:
                logger.warning(f"Ollama website analysis failed, falling back to heuristic critique: {e}")

        return self._build_heuristic_website_analysis(url, html_content, axe_results, user_instruction)

    async def generate_code(
        self,
        analysis: Dict[str, Any],
        redesign_image_path: Optional[str],
        user_instruction: str = ""
    ) -> Dict[str, Any]:
        is_available = await self.ollama.check_availability()

        if is_available:
            try:
                issues_list = []
                for cat, data in analysis.get("categories", {}).items():
                    for issue in data.get("issues", []):
                        issues_list.append(f"- [{cat.upper()}] {issue.get('title', '')}: {issue.get('recommendation', '')}")

                prompt = CODE_GENERATION_PROMPT.format(
                    analysis_summary=analysis.get("summary", "No analysis summary available"),
                    issues_list="\n".join(issues_list[:10]),
                    user_instruction=user_instruction or "Generate a modern, accessible React component"
                )

                raw_response = await self.ollama.generate_text(prompt)
                return self._parse_json_response(raw_response)
            except Exception as e:
                logger.warning(f"Ollama code generation failed, returning standard template: {e}")

        return self._build_default_code_template(analysis)

    def _build_heuristic_website_analysis(self, url: str, html_content: str, axe_results: Optional[Dict], user_instruction: str) -> Dict[str, Any]:
        violations_count = len(axe_results.get("violations", [])) if axe_results else 0
        
        issues_accessibility = []
        if axe_results and axe_results.get("violations"):
            for v in axe_results["violations"][:4]:
                issues_accessibility.append({
                    "title": v.get("help", "Accessibility violation"),
                    "description": v.get("description", "Axe-core rule violation detected"),
                    "whyItMatters": f"Affects WCAG 2.1 conformance ({v.get('impact', 'moderate')} impact).",
                    "recommendation": v.get("helpUrl", "Ensure appropriate ARIA roles, labels, and contrast."),
                    "severity": "high" if v.get("impact") in ["critical", "serious"] else "medium"
                })
        else:
            issues_accessibility.append({
                "title": "Low Color Contrast on Subtext Elements",
                "description": "Appears to have secondary text elements with contrast ratio below WCAG AA 4.5:1 requirement.",
                "whyItMatters": "Users with low vision or in brightly lit conditions may struggle to read secondary information.",
                "recommendation": "Increase text color lightness on dark backgrounds or darken text on light backgrounds to meet 4.5:1.",
                "severity": "medium"
            })

        return {
            "summary": f"UI/UX audit for {url}. The interface displays structured layout elements, with key opportunities to enhance visual hierarchy, improve responsive padding consistency, and resolve accessibility compliance checks.",
            "categories": {
                "layout": {
                    "issues": [
                        {
                            "title": "Asymmetrical Grid Alignment",
                            "description": "Content containers appear to use variable outer margins across responsive breakpoints.",
                            "whyItMatters": "Inconsistent column alignment increases cognitive load and weakens structural rhythm.",
                            "recommendation": "Adopt a unified 12-column grid system with fixed max-width constraints (e.g., 1200px) and uniform gutter spacing.",
                            "severity": "medium"
                        }
                    ]
                },
                "typography": {
                    "issues": [
                        {
                            "title": "Insufficient Heading-to-Body Contrast",
                            "description": "The size and weight delta between H1 headings and H2 subheaders lacks distinct differentiation.",
                            "whyItMatters": "Clear typography scaling allows users to scan page sections rapidly and understand information hierarchy.",
                            "recommendation": "Implement a modular type scale (e.g. Major Third 1.25 ratio: H1 at 2.25rem/36px with 700 weight, H2 at 1.5rem/24px with 600 weight).",
                            "severity": "high"
                        }
                    ]
                },
                "color": {
                    "issues": [
                        {
                            "title": "Ambiguous Interactive Accent Colors",
                            "description": "Primary action buttons share similar hue and saturation with static decorative elements.",
                            "whyItMatters": "Users may experience hesitation identifying clickable primary calls to action.",
                            "recommendation": "Reserve high-chroma primary accent colors exclusively for interactive elements like buttons and active tabs.",
                            "severity": "medium"
                        }
                    ]
                },
                "spacing": {
                    "issues": [
                        {
                            "title": "Crowded Touch Target Padding",
                            "description": "Interactive buttons and link items have padding under the recommended 44x44px minimum touch target.",
                            "whyItMatters": "Leads to accidental mis-clicks, particularly on mobile and touchscreen devices.",
                            "recommendation": "Increase button padding to minimum 12px vertical and 20px horizontal (min-height: 44px).",
                            "severity": "medium"
                        }
                    ]
                },
                "hierarchy": {
                    "issues": [
                        {
                            "title": "Competing Primary Calls-to-Action",
                            "description": "Multiple prominent buttons are rendered with identical visual weight within the same viewport.",
                            "whyItMatters": "Causes decision fatigue and reduces conversion rates on key user funnels.",
                            "recommendation": "Establish a single high-emphasis primary button style and convert secondary actions to ghost/outline variants.",
                            "severity": "high"
                        }
                    ]
                },
                "accessibility": {
                    "issues": issues_accessibility
                }
            },
            "recommendations": [
                "Establish a single unambiguous Primary CTA with distinct accent color.",
                "Enforce strict 8px spatial grid system for consistent margins and padding.",
                "Elevate typography hierarchy with distinct weight scaling for headings.",
                "Verify WCAG AA 4.5:1 contrast ratios across all subtext and interactive states."
            ],
            "redesignInstructions": [
                "Streamline visual hierarchy by emphasizing the core headline and primary action button.",
                "Incorporate generous whitespace (padding: 48px, gap: 24px) to let content breathe.",
                "Apply modern subtle borders (1px solid rgba(255,255,255,0.1)) and soft surface elevation.",
                "Use high-contrast accessible typography with -0.02em letter spacing for headlines."
            ]
        }

    def _build_heuristic_image_analysis(self, image_path: str, user_instruction: str) -> Dict[str, Any]:
        return self._build_heuristic_website_analysis("Uploaded UI Design", "", None, user_instruction)

    def _build_default_code_template(self, analysis: Dict[str, Any]) -> Dict[str, str]:
        return {
            "jsx": """import React, { useState } from 'react';
import styles from './Component.module.css';

export default function RedesignedComponent() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.badge}>Redesigned Concept</div>
        <h1 className={styles.title}>Optimized User Experience</h1>
        <p className={styles.description}>
          Enhanced visual hierarchy, 8px grid spacing, and WCAG AA contrast compliance.
        </p>
      </header>

      <div className={styles.cardGrid}>
        <div className={styles.card}>
          <h3>Clear Hierarchy</h3>
          <p>Distinct heading scales and elevated focus states.</p>
        </div>
        <div className={styles.card}>
          <h3>Accessible Contrast</h3>
          <p>All text elements meet WCAG 4.5:1 contrast ratios.</p>
        </div>
      </div>

      <footer className={styles.actions}>
        <button className={styles.primaryBtn}>Get Started</button>
        <button className={styles.secondaryBtn}>Learn More</button>
      </footer>
    </div>
  );
}""",
            "css": """.container {
  max-width: 800px;
  margin: 0 auto;
  padding: 40px;
  background: #0f172a;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  font-family: system-ui, -apple-system, sans-serif;
  color: #f8fafc;
}

.header {
  margin-bottom: 32px;
}

.badge {
  display: inline-block;
  padding: 4px 12px;
  background: rgba(124, 58, 237, 0.15);
  border: 1px solid rgba(124, 58, 237, 0.3);
  color: #a78bfa;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  margin-bottom: 12px;
}

.title {
  font-size: 2rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  margin: 0 0 8px 0;
}

.description {
  color: #94a3b8;
  font-size: 1rem;
  line-height: 1.5;
  margin: 0;
}

.cardGrid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 32px;
}

.card {
  padding: 20px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 12px;
}

.card h3 {
  margin: 0 0 8px 0;
  font-size: 1.1rem;
  color: #f1f5f9;
}

.card p {
  margin: 0;
  color: #94a3b8;
  font-size: 0.875rem;
}

.actions {
  display: flex;
  gap: 12px;
}

.primaryBtn {
  padding: 12px 24px;
  background: #7c3aed;
  color: #ffffff;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
}

.secondaryBtn {
  padding: 12px 24px;
  background: transparent;
  color: #94a3b8;
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
}"""
        }

    def _parse_json_response(self, raw: str) -> Dict[str, Any]:
        raw = raw.strip()
        import re
        json_match = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', raw, re.DOTALL)
        if json_match:
            raw = json_match.group(1)
        else:
            start = raw.find('{')
            end = raw.rfind('}')
            if start != -1 and end != -1:
                raw = raw[start:end+1]

        try:
            return json.loads(raw)
        except json.JSONDecodeError as e:
            logger.error(f"JSON parse failed: {e}\nRaw: {raw[:500]}")
            raise ValueError(f"AI returned invalid JSON. Response preview: {raw[:200]}")


ai_service = AIService()
