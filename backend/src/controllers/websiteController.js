import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { getPrismaClient } from '../utils/database.js';
import { aiService } from '../services/aiService.js';
import { storeService } from '../services/storeService.js';
import { logger } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const screenshotsDir = path.join(__dirname, '../../uploads/screenshots');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

async function launchBrowser(playwright) {
  // 1. Try Microsoft Edge (built into Windows)
  try {
    return await playwright.chromium.launch({ channel: 'msedge', headless: true });
  } catch (e1) {
    logger.debug('msedge launch failed:', e1.message);
  }

  // 2. Try Google Chrome
  try {
    return await playwright.chromium.launch({ channel: 'chrome', headless: true });
  } catch (e2) {
    logger.debug('chrome launch failed:', e2.message);
  }

  // 3. Try default Playwright Chromium
  try {
    return await playwright.chromium.launch({ headless: true });
  } catch (e3) {
    logger.error('All browser launch options failed:', e3.message);
    throw new Error('Could not launch browser. Please ensure Microsoft Edge or Google Chrome is installed.');
  }
}

export async function analyzeWebsite(req, res, next) {
  try {
    const { url, userInstruction, projectName } = req.body;
    const userId = req.headers['x-user-id'] || req.body.userId || 'default_user';

    // Validate URL is not internal
    const parsedUrl = new URL(url);
    const blockedHosts = ['localhost', '127.0.0.1', '0.0.0.0', '::1'];
    if (blockedHosts.includes(parsedUrl.hostname)) {
      return res.status(400).json({
        error: 'Invalid URL',
        message: 'Analysis of local/internal URLs is not permitted for security reasons.',
      });
    }

    // Check if Playwright is available
    let playwright;
    try {
      playwright = await import('playwright');
    } catch (e) {
      return res.status(503).json({
        error: 'Website analysis unavailable',
        message: 'Playwright is not installed. Run: npm install playwright',
        hint: 'See SETUP.md for installation instructions.',
      });
    }

    logger.info(`Starting website analysis for: ${url}`);

    let browser;
    let screenshotPath;
    let htmlContent;
    let axeResults = null;

    try {
      browser = await launchBrowser(playwright);
      const context = await browser.newContext({
        viewport: { width: 1440, height: 900 },
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      });
      const page = await context.newPage();

      // Navigate with timeout
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

      // Capture screenshot
      const filename = `screenshot-${uuidv4()}.png`;
      screenshotPath = path.join(screenshotsDir, filename);
      await page.screenshot({ path: screenshotPath, fullPage: false });

      // Extract relevant HTML (not full page to keep size manageable)
      htmlContent = await page.evaluate(() => {
        const body = document.body.cloneNode(true);
        // Remove script tags
        body.querySelectorAll('script, style').forEach(el => el.remove());
        return body.innerHTML.slice(0, 50000); // Limit size
      });

      // Run axe-core accessibility checks
      try {
        await page.addScriptTag({
          url: 'https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.9.1/axe.min.js',
        });
        axeResults = await page.evaluate(async () => {
          return await new Promise((resolve) => {
            window.axe.run(document, {
              runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'best-practice'] },
            }, (err, results) => {
              if (err) resolve(null);
              else resolve({
                violations: results.violations.slice(0, 20),
                passes: results.passes.length,
                incomplete: results.incomplete.length,
              });
            });
          });
        });
      } catch (axeErr) {
        logger.warn('axe-core check failed:', axeErr.message);
      }

      await browser.close();
    } catch (playwrightErr) {
      if (browser) await browser.close().catch(() => {});
      
      const errMsg = playwrightErr.message;
      if (errMsg.includes('net::ERR_NAME_NOT_RESOLVED') || errMsg.includes('ERR_CONNECTION_REFUSED')) {
        return res.status(400).json({
          error: 'Website unreachable',
          message: `Could not connect to ${url}. The site may be down or the URL may be incorrect.`,
        });
      }
      if (errMsg.includes('timeout')) {
        return res.status(408).json({
          error: 'Request timeout',
          message: 'The website took too long to load. Please try again.',
        });
      }
      throw playwrightErr;
    }

    // Send to AI service
    let aiResult;
    try {
      aiResult = await aiService.analyzeWebsite(url, screenshotPath, htmlContent, axeResults, userInstruction);
    } catch (aiErr) {
      return res.status(503).json({
        error: 'AI analysis failed',
        message: aiErr.message,
      });
    }

    // Merge axe results into accessibility issues
    if (axeResults?.violations?.length > 0) {
      const axeIssues = axeResults.violations.map(v => ({
        title: v.help,
        description: v.description,
        whyItMatters: `This is a ${v.impact} accessibility issue affecting users who rely on assistive technology.`,
        recommendation: v.helpUrl ? `See: ${v.helpUrl}` : 'Review and fix the affected elements.',
        severity: v.impact === 'critical' || v.impact === 'serious' ? 'high' : 'medium',
        source: 'AXE_CORE',
        elements: v.nodes?.slice(0, 3).map(n => n.html).join('\n'),
      }));

      if (!aiResult.categories.accessibility) {
        aiResult.categories.accessibility = { issues: [] };
      }
      aiResult.categories.accessibility.automatedChecks = axeIssues;
      aiResult.axeSummary = {
        violations: axeResults.violations.length,
        passes: axeResults.passes,
        incomplete: axeResults.incomplete,
      };
    }

    // Save to Store
    let project = null;
    let analysis = null;
    try {
      project = await storeService.createProject({
        name: projectName || new URL(url).hostname,
        userId,
      });

      analysis = await storeService.createAnalysis({
        projectId: project.id,
        userId,
        type: 'URL',
        sourceUrl: url,
        originalImagePath: screenshotPath,
        status: 'COMPLETED',
        summary: aiResult.summary,
        rawAiResponse: aiResult,
        userInstruction: userInstruction || null,
      });

      const categoryMap = {
        layout: 'LAYOUT',
        typography: 'TYPOGRAPHY',
        color: 'COLOR',
        spacing: 'SPACING',
        hierarchy: 'HIERARCHY',
        accessibility: 'ACCESSIBILITY',
        navigation: 'NAVIGATION',
        content: 'CONTENT',
      };

      const issueCreateData = [];
      for (const [cat, data] of Object.entries(aiResult.categories || {})) {
        for (const issue of data.issues || []) {
          issueCreateData.push({
            category: categoryMap[cat] || 'LAYOUT',
            title: issue.title,
            description: issue.description,
            whyItMatters: issue.whyItMatters,
            recommendation: issue.recommendation,
            severity: issue.severity,
            source: 'AI',
          });
        }
        for (const issue of data.automatedChecks || []) {
          issueCreateData.push({
            category: 'ACCESSIBILITY',
            title: issue.title,
            description: issue.description,
            whyItMatters: issue.whyItMatters,
            recommendation: issue.recommendation,
            severity: issue.severity,
            source: 'AXE_CORE',
            elements: issue.elements,
          });
        }
      }

      await storeService.saveIssues(analysis.id, issueCreateData);
    } catch (saveErr) {
      logger.warn('Failed to persist website analysis:', saveErr.message);
    }

    res.json({
      success: true,
      analysisId: analysis?.id,
      projectId: project?.id,
      imageUrl: screenshotPath ? `/uploads/screenshots/${path.basename(screenshotPath)}` : null,
      analysis: aiResult,
    });
  } catch (error) {
    next(error);
  }
}
