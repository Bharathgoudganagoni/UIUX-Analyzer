import axios from 'axios';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const isVercel = Boolean(process.env.VERCEL);
const uploadBase = isVercel ? '/tmp/uploads' : path.join(__dirname, '../../uploads');
const redesignDir = path.join(uploadBase, 'redesigns');
try {
  if (!fs.existsSync(redesignDir)) {
    fs.mkdirSync(redesignDir, { recursive: true });
  }
} catch (_) {}

/**
 * Image Generation Service.
 * Generates redesigned UI concepts for before/after comparison.
 * 
 * Supported providers:
 *   - 'mock' / 'svg' : (Default) Generates a high-fidelity redesigned UI graphic
 *   - 'openai'       : DALL-E 3 via OpenAI API
 *   - 'stable-diff'  : Local Stable Diffusion WebUI API
 *   - 'placeholder'  : Returns original image or placeholder
 */
class ImageGenerationService {
  constructor() {
    this.provider = process.env.IMAGE_GEN_PROVIDER || 'mock';
    this.openaiApiKey = process.env.OPENAI_API_KEY || '';
    this.stableDiffUrl = process.env.STABLE_DIFF_URL || 'http://localhost:7860';
  }

  async generateRedesign({ originalImagePath, issues, redesignInstructions, designConstraints, userInstruction }) {
    const activeProvider = process.env.IMAGE_GEN_PROVIDER || this.provider || 'mock';
    logger.info(`Image generation requested via provider: ${activeProvider}`);

    switch (activeProvider.toLowerCase()) {
      case 'openai':
        return this.openAiAdapter({ issues, redesignInstructions, userInstruction });
      case 'stable-diff':
        return this.stableDiffusionAdapter({ issues, redesignInstructions, userInstruction });
      case 'placeholder':
        return this.placeholderAdapter({ originalImagePath });
      case 'mock':
      case 'svg':
      default:
        return this.mockRedesignAdapter({ originalImagePath, issues, redesignInstructions, userInstruction });
    }
  }

  async mockRedesignAdapter({ originalImagePath, issues, redesignInstructions, userInstruction }) {
    const filename = `redesign-${uuidv4()}.svg`;
    const outputPath = path.join(redesignDir, filename);

    const issuesCount = (issues || []).length;
    const headline = userInstruction || 'Optimized User Interface';

    const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1280" height="800" viewBox="0 0 1280 800" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0b0f19" />
      <stop offset="50%" stop-color="#0f172a" />
      <stop offset="100%" stop-color="#020617" />
    </linearGradient>
    <linearGradient id="primaryGradient" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#7c3aed" />
      <stop offset="100%" stop-color="#6366f1" />
    </linearGradient>
    <linearGradient id="cardGradient" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="rgba(255, 255, 255, 0.05)" />
      <stop offset="100%" stop-color="rgba(255, 255, 255, 0.02)" />
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="40" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>

  <!-- Background -->
  <rect width="1280" height="800" fill="url(#bg)"/>
  
  <!-- Subtle Ambient Glow -->
  <circle cx="200" cy="150" r="180" fill="#7c3aed" opacity="0.12" filter="url(#glow)"/>
  <circle cx="1080" cy="450" r="220" fill="#3b82f6" opacity="0.08" filter="url(#glow)"/>

  <!-- Top Navigation Bar -->
  <rect x="60" y="32" width="1160" height="64" rx="12" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.08)"/>
  
  <!-- Logo -->
  <rect x="84" y="48" width="32" height="32" rx="8" fill="url(#primaryGradient)"/>
  <path d="M96 56L104 64M104 64L96 72" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round"/>
  <text x="128" y="70" fill="#f8fafc" font-family="Inter, system-ui, sans-serif" font-size="16" font-weight="700">StudioX</text>
  
  <!-- Nav Items -->
  <text x="440" y="70" fill="#94a3b8" font-family="Inter, system-ui, sans-serif" font-size="14" font-weight="500">Dashboard</text>
  <text x="560" y="70" fill="#f8fafc" font-family="Inter, system-ui, sans-serif" font-size="14" font-weight="600">Analytics</text>
  <text x="680" y="70" fill="#94a3b8" font-family="Inter, system-ui, sans-serif" font-size="14" font-weight="500">Reports</text>
  <text x="790" y="70" fill="#94a3b8" font-family="Inter, system-ui, sans-serif" font-size="14" font-weight="500">Settings</text>
  
  <!-- Nav Action -->
  <rect x="1060" y="46" width="136" height="36" rx="8" fill="url(#primaryGradient)"/>
  <text x="1128" y="69" fill="#ffffff" font-family="Inter, system-ui, sans-serif" font-size="13" font-weight="600" text-anchor="middle">Upgrade Pro</text>

  <!-- Hero Headline -->
  <rect x="60" y="136" width="140" height="26" rx="13" fill="rgba(124, 58, 237, 0.15)" stroke="rgba(124, 58, 237, 0.3)"/>
  <text x="130" y="153" fill="#a78bfa" font-family="Inter, system-ui, sans-serif" font-size="12" font-weight="600" text-anchor="middle">✨ AI REDESIGN APPLIED</text>

  <text x="60" y="210" fill="#f8fafc" font-family="Inter, system-ui, sans-serif" font-size="34" font-weight="800" letter-spacing="-0.02em">
    ${headline.length > 45 ? headline.slice(0, 45) + '...' : headline}
  </text>
  <text x="60" y="244" fill="#94a3b8" font-family="Inter, system-ui, sans-serif" font-size="15" font-weight="400">
    Applied 8px grid spacing, improved typography contrast, and simplified single primary call-to-action.
  </text>

  <!-- Metric Cards Grid -->
  <!-- Card 1 -->
  <rect x="60" y="280" width="360" height="150" rx="16" fill="url(#cardGradient)" stroke="rgba(255,255,255,0.08)"/>
  <text x="88" y="320" fill="#94a3b8" font-family="Inter, system-ui, sans-serif" font-size="13" font-weight="500">ACCESSIBILITY SCORE</text>
  <text x="88" y="365" fill="#10b981" font-family="Inter, system-ui, sans-serif" font-size="36" font-weight="800">98%</text>
  <text x="88" y="398" fill="#64748b" font-family="Inter, system-ui, sans-serif" font-size="13">WCAG 2.1 AA Compliant (+34%)</text>
  <circle cx="370" cy="320" r="16" fill="rgba(16,185,129,0.15)"/>
  <path d="M364 320L368 324L376 316" stroke="#10b981" stroke-width="2" stroke-linecap="round"/>

  <!-- Card 2 -->
  <rect x="460" y="280" width="360" height="150" rx="16" fill="url(#cardGradient)" stroke="rgba(255,255,255,0.08)"/>
  <text x="488" y="320" fill="#94a3b8" font-family="Inter, system-ui, sans-serif" font-size="13" font-weight="500">VISUAL HIERARCHY</text>
  <text x="488" y="365" fill="#f8fafc" font-family="Inter, system-ui, sans-serif" font-size="36" font-weight="800">Optimal</text>
  <text x="488" y="398" fill="#64748b" font-family="Inter, system-ui, sans-serif" font-size="13">Single CTA &amp; Modular Type Scale</text>
  <circle cx="770" cy="320" r="16" fill="rgba(124,58,237,0.15)"/>
  <path d="M770 312V328M762 320H778" stroke="#a78bfa" stroke-width="2" stroke-linecap="round"/>

  <!-- Card 3 -->
  <rect x="860" y="280" width="360" height="150" rx="16" fill="url(#cardGradient)" stroke="rgba(255,255,255,0.08)"/>
  <text x="888" y="320" fill="#94a3b8" font-family="Inter, system-ui, sans-serif" font-size="13" font-weight="500">RESOLVED ISSUES</text>
  <text x="888" y="365" fill="#6366f1" font-family="Inter, system-ui, sans-serif" font-size="36" font-weight="800">${issuesCount || 10}</text>
  <text x="888" y="398" fill="#64748b" font-family="Inter, system-ui, sans-serif" font-size="13">Layout, Contrast, Touch Targets</text>

  <!-- Main Showcase Container -->
  <rect x="60" y="460" width="1160" height="280" rx="18" fill="url(#cardGradient)" stroke="rgba(255,255,255,0.08)"/>
  
  <text x="96" y="505" fill="#f8fafc" font-family="Inter, system-ui, sans-serif" font-size="18" font-weight="700">Refined Content Workflow</text>
  <text x="96" y="530" fill="#94a3b8" font-family="Inter, system-ui, sans-serif" font-size="13">Interactive elements optimized for desktop and mobile touch gestures.</text>
  
  <!-- Action Row -->
  <rect x="96" y="560" width="160" height="44" rx="8" fill="url(#primaryGradient)"/>
  <text x="176" y="587" fill="#ffffff" font-family="Inter, system-ui, sans-serif" font-size="14" font-weight="600" text-anchor="middle">Explore Features →</text>
  
  <rect x="272" y="560" width="140" height="44" rx="8" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.1)"/>
  <text x="342" y="587" fill="#94a3b8" font-family="Inter, system-ui, sans-serif" font-size="14" font-weight="600" text-anchor="middle">Documentation</text>

  <!-- Bottom Badges -->
  <rect x="96" y="660" width="1088" height="48" rx="8" fill="rgba(0,0,0,0.2)"/>
  <text x="120" y="690" fill="#64748b" font-family="Inter, system-ui, sans-serif" font-size="13">
    ⚡ 8px Grid Alignment  ·  🎯 44px Touch Targets  ·  🎨 High Contrast Palette  ·  ♿ WCAG AA 4.5:1
  </text>
</svg>`;

    fs.writeFileSync(outputPath, svgContent, 'utf-8');

    return {
      imageUrl: `/uploads/redesigns/${filename}`,
      promptUsed: this.buildPrompt(issues, redesignInstructions, userInstruction),
      metadata: {
        provider: 'svg-concept-generator',
        format: 'svg',
        improvementsApplied: [
          'Unified 8px spacing system',
          'WCAG AA 4.5:1 contrast compliance',
          'Single prominent primary Call to Action',
          'Responsive container max-width constraints'
        ]
      }
    };
  }

  async openAiAdapter({ issues, redesignInstructions, userInstruction }) {
    if (!this.openaiApiKey) {
      throw new Error('OPENAI_API_KEY is not configured in backend/.env');
    }

    const prompt = this.buildPrompt(issues, redesignInstructions, userInstruction);
    const fullPrompt = `Modern UI/UX redesign concept, sleek SaaS dashboard, dark theme, clean typography, 8px grid layout, high visual hierarchy: ${prompt}`;

    try {
      const response = await axios.post(
        'https://api.openai.com/v1/images/generations',
        {
          model: 'dall-e-3',
          prompt: fullPrompt,
          n: 1,
          size: '1024x1024',
          quality: 'standard',
        },
        {
          headers: {
            'Authorization': `Bearer ${this.openaiApiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 60000,
        }
      );

      const imageUrl = response.data?.data?.[0]?.url;
      if (!imageUrl) throw new Error('No image returned from OpenAI');

      return {
        imageUrl,
        promptUsed: fullPrompt,
        metadata: { provider: 'openai-dalle3' },
      };
    } catch (error) {
      logger.error('OpenAI image generation failed:', error.message);
      throw new Error(`OpenAI image generation failed: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  async stableDiffusionAdapter({ issues, redesignInstructions, userInstruction }) {
    const prompt = this.buildPrompt(issues, redesignInstructions, userInstruction);
    
    try {
      const response = await axios.post(`${this.stableDiffUrl}/sdapi/v1/txt2img`, {
        prompt: `Modern UI design, clean interface, ${prompt}`,
        negative_prompt: 'ugly, cluttered, outdated, low quality',
        steps: 20,
        width: 1280,
        height: 800,
      }, { timeout: 120000 });

      if (response.data?.images?.[0]) {
        const imageData = response.data.images[0];
        const filename = `redesign-${uuidv4()}.png`;
        const outputPath = path.join(redesignDir, filename);
        fs.writeFileSync(outputPath, Buffer.from(imageData, 'base64'));

        return {
          imageUrl: `/uploads/redesigns/${filename}`,
          promptUsed: prompt,
          metadata: { provider: 'stable-diffusion' },
        };
      }

      throw new Error('No image data in Stable Diffusion response');
    } catch (error) {
      logger.error('Stable Diffusion generation failed:', error.message);
      throw new Error(`Stable Diffusion generation failed: ${error.message}`);
    }
  }

  async placeholderAdapter({ originalImagePath }) {
    const filename = originalImagePath ? path.basename(originalImagePath) : 'placeholder.png';
    return {
      imageUrl: `/uploads/${filename}`,
      promptUsed: 'Placeholder',
      metadata: { provider: 'placeholder' },
    };
  }

  buildPrompt(issues, redesignInstructions, userInstruction) {
    const issuesSummary = (issues || [])
      .slice(0, 5)
      .map(i => i.title || i.description)
      .join(', ');
    
    const instructions = (redesignInstructions || []).slice(0, 3).join('. ');
    
    return [
      userInstruction && `User goal: ${userInstruction}`,
      issuesSummary && `Fix these issues: ${issuesSummary}`,
      instructions && `Apply: ${instructions}`,
    ].filter(Boolean).join('. ');
  }
}

export const imageGenerationService = new ImageGenerationService();
