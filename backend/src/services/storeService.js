import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger.js';
import { getPrismaClient } from '../utils/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const isVercel = Boolean(process.env.VERCEL);
const DATA_DIR = isVercel ? '/tmp/data' : path.join(__dirname, '../../data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

// Ensure data directory exists
try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
} catch (e) {
  logger.warn('Could not create data directory:', e.message);
}

function getInitialData() {
  return {
    projects: [],
    analyses: [],
    issues: [],
    redesigns: [],
    generatedCodes: [],
  };
}

function readStore() {
  try {
    if (!fs.existsSync(DB_FILE)) {
      const initial = getInitialData();
      fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf-8');
      return initial;
    }
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    return {
      projects: parsed.projects || [],
      analyses: parsed.analyses || [],
      issues: parsed.issues || [],
      redesigns: parsed.redesigns || [],
      generatedCodes: parsed.generatedCodes || [],
    };
  } catch (err) {
    logger.warn('Failed to read db.json, returning empty store:', err.message);
    return getInitialData();
  }
}

function writeStore(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    logger.error('Failed to write to db.json:', err.message);
  }
}

export const storeService = {
  // === PROJECTS ===
  async createProject({ id, name, userId = 'default_user' }) {
    const projectId = id || uuidv4();
    const now = new Date().toISOString();
    const newProj = {
      id: projectId,
      userId: userId || 'default_user',
      name: name || `Analysis ${new Date().toLocaleDateString()}`,
      createdAt: now,
      updatedAt: now,
    };

    // Try Prisma if available
    try {
      const prisma = getPrismaClient();
      if (prisma) {
        await prisma.project.create({
          data: {
            id: projectId,
            name: newProj.name,
          },
        });
      }
    } catch (_) {}

    // File store
    const store = readStore();
    const existingIndex = store.projects.findIndex((p) => p.id === projectId);
    if (existingIndex >= 0) {
      store.projects[existingIndex] = { ...store.projects[existingIndex], ...newProj, updatedAt: now };
    } else {
      store.projects.unshift(newProj);
    }
    writeStore(store);

    return newProj;
  },

  async getProjects(userId = null) {
    // Try Prisma first
    try {
      const prisma = getPrismaClient();
      if (prisma) {
        const prismaProjects = await prisma.project.findMany({
          include: {
            analyses: {
              include: { issues: true, redesigns: true },
              orderBy: { createdAt: 'desc' },
            },
            _count: { select: { analyses: true } },
          },
          orderBy: { updatedAt: 'desc' },
        });
        if (prismaProjects && prismaProjects.length > 0) {
          return prismaProjects;
        }
      }
    } catch (_) {}

    // File store fallback
    const store = readStore();
    let userProjects = store.projects;
    if (userId) {
      userProjects = store.projects.filter((p) => !p.userId || p.userId === userId || p.userId === 'default_user');
    }

    const projectsWithDetails = userProjects.map((proj) => {
      const analyses = store.analyses
        .filter((a) => a.projectId === proj.id)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .map((a) => {
          const issues = store.issues.filter((iss) => iss.analysisId === a.id);
          const redesigns = store.redesigns.filter((r) => r.analysisId === a.id);
          return {
            ...a,
            issues,
            redesigns,
          };
        });

      return {
        ...proj,
        analyses,
        _count: {
          analyses: analyses.length,
        },
      };
    });

    return projectsWithDetails.sort(
      (a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt)
    );
  },

  async getProject(id, userId = null) {
    // Try Prisma first
    try {
      const prisma = getPrismaClient();
      if (prisma) {
        const project = await prisma.project.findUnique({
          where: { id },
          include: {
            analyses: {
              include: {
                issues: true,
                redesigns: {
                  include: { generatedCodes: true },
                  orderBy: { createdAt: 'desc' },
                },
              },
              orderBy: { createdAt: 'desc' },
            },
          },
        });
        if (project) return project;
      }
    } catch (_) {}

    // File store fallback
    const store = readStore();
    const proj = store.projects.find((p) => p.id === id);
    if (!proj) return null;

    const analyses = store.analyses
      .filter((a) => a.projectId === proj.id)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .map((a) => {
        const issues = store.issues.filter((iss) => iss.analysisId === a.id);
        const redesigns = store.redesigns
          .filter((r) => r.analysisId === a.id)
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .map((r) => {
            const generatedCodes = store.generatedCodes.filter((g) => g.redesignId === r.id);
            return { ...r, generatedCodes };
          });
        return { ...a, issues, redesigns };
      });

    return {
      ...proj,
      analyses,
      _count: {
        analyses: analyses.length,
      },
    };
  },

  async deleteProject(id) {
    try {
      const prisma = getPrismaClient();
      if (prisma) {
        await prisma.project.delete({ where: { id } });
      }
    } catch (_) {}

    const store = readStore();
    const analysisIds = store.analyses.filter((a) => a.projectId === id).map((a) => a.id);
    const redesignIds = store.redesigns.filter((r) => analysisIds.includes(r.analysisId)).map((r) => r.id);

    store.projects = store.projects.filter((p) => p.id !== id);
    store.analyses = store.analyses.filter((a) => a.projectId !== id);
    store.issues = store.issues.filter((iss) => !analysisIds.includes(iss.analysisId));
    store.redesigns = store.redesigns.filter((r) => !analysisIds.includes(r.analysisId));
    store.generatedCodes = store.generatedCodes.filter((g) => !redesignIds.includes(g.redesignId));

    writeStore(store);
    return true;
  },

  // === ANALYSES ===
  async createAnalysis({
    id,
    projectId,
    userId = 'default_user',
    type = 'SCREENSHOT',
    sourceUrl = null,
    originalImagePath = null,
    status = 'PROCESSING',
    userInstruction = null,
    summary = null,
    rawAiResponse = null,
  }) {
    const analysisId = id || uuidv4();
    const now = new Date().toISOString();
    const analysis = {
      id: analysisId,
      projectId,
      userId: userId || 'default_user',
      type,
      sourceUrl,
      originalImagePath,
      status,
      userInstruction,
      summary,
      rawAiResponse,
      createdAt: now,
      updatedAt: now,
    };

    // Try Prisma
    try {
      const prisma = getPrismaClient();
      if (prisma) {
        await prisma.analysis.create({
          data: {
            id: analysisId,
            projectId,
            type,
            sourceUrl,
            originalImagePath,
            status,
            userInstruction,
            summary,
            rawAiResponse: rawAiResponse || undefined,
          },
        });
      }
    } catch (_) {}

    // File store
    const store = readStore();
    store.analyses.unshift(analysis);

    // Touch project updatedAt
    const proj = store.projects.find((p) => p.id === projectId);
    if (proj) {
      proj.updatedAt = now;
    }

    writeStore(store);
    return analysis;
  },

  async updateAnalysis(id, updateData) {
    const now = new Date().toISOString();
    try {
      const prisma = getPrismaClient();
      if (prisma) {
        await prisma.analysis.update({
          where: { id },
          data: updateData,
        });
      }
    } catch (_) {}

    const store = readStore();
    const idx = store.analyses.findIndex((a) => a.id === id);
    if (idx >= 0) {
      store.analyses[idx] = {
        ...store.analyses[idx],
        ...updateData,
        updatedAt: now,
      };
      // Touch project
      const proj = store.projects.find((p) => p.id === store.analyses[idx].projectId);
      if (proj) proj.updatedAt = now;
      writeStore(store);
      return store.analyses[idx];
    }
    return null;
  },

  async getAnalysis(id) {
    try {
      const prisma = getPrismaClient();
      if (prisma) {
        const analysis = await prisma.analysis.findUnique({
          where: { id },
          include: {
            issues: true,
            redesigns: {
              include: { generatedCodes: true },
              orderBy: { createdAt: 'desc' },
            },
            project: true,
          },
        });
        if (analysis) return analysis;
      }
    } catch (_) {}

    const store = readStore();
    const analysis = store.analyses.find((a) => a.id === id);
    if (!analysis) return null;

    const project = store.projects.find((p) => p.id === analysis.projectId) || null;
    const issues = store.issues.filter((iss) => iss.analysisId === analysis.id);
    const redesigns = store.redesigns
      .filter((r) => r.analysisId === analysis.id)
      .map((r) => {
        const generatedCodes = store.generatedCodes.filter((g) => g.redesignId === r.id);
        return { ...r, generatedCodes };
      });

    return {
      ...analysis,
      project,
      issues,
      redesigns,
    };
  },

  // === ISSUES ===
  async saveIssues(analysisId, issues) {
    if (!issues || issues.length === 0) return [];
    const formatted = issues.map((iss) => ({
      id: iss.id || uuidv4(),
      analysisId,
      category: iss.category || 'LAYOUT',
      title: iss.title || '',
      description: iss.description || '',
      whyItMatters: iss.whyItMatters || '',
      recommendation: iss.recommendation || '',
      severity: (iss.severity || 'MEDIUM').toUpperCase(),
      source: iss.source || 'AI',
      elements: iss.elements || null,
      createdAt: new Date().toISOString(),
    }));

    try {
      const prisma = getPrismaClient();
      if (prisma) {
        await prisma.issue.createMany({ data: formatted });
      }
    } catch (_) {}

    const store = readStore();
    store.issues.push(...formatted);
    writeStore(store);
    return formatted;
  },

  // === REDESIGNS ===
  async createRedesign({
    id,
    analysisId,
    userInstruction = null,
    imageUrl = null,
    promptUsed = null,
    status = 'PROCESSING',
    metadata = null,
  }) {
    const redesignId = id || uuidv4();
    const now = new Date().toISOString();
    const redesign = {
      id: redesignId,
      analysisId,
      userInstruction,
      imageUrl,
      promptUsed,
      status,
      metadata,
      createdAt: now,
      updatedAt: now,
    };

    try {
      const prisma = getPrismaClient();
      if (prisma) {
        await prisma.redesign.create({
          data: {
            id: redesignId,
            analysisId,
            userInstruction,
            status,
          },
        });
      }
    } catch (_) {}

    const store = readStore();
    store.redesigns.unshift(redesign);
    writeStore(store);
    return redesign;
  },

  async updateRedesign(id, updateData) {
    const now = new Date().toISOString();
    try {
      const prisma = getPrismaClient();
      if (prisma) {
        await prisma.redesign.update({
          where: { id },
          data: updateData,
        });
      }
    } catch (_) {}

    const store = readStore();
    const idx = store.redesigns.findIndex((r) => r.id === id);
    if (idx >= 0) {
      store.redesigns[idx] = {
        ...store.redesigns[idx],
        ...updateData,
        updatedAt: now,
      };
      writeStore(store);
      return store.redesigns[idx];
    }
    return null;
  },

  async getRedesign(id) {
    try {
      const prisma = getPrismaClient();
      if (prisma) {
        const redesign = await prisma.redesign.findUnique({
          where: { id },
          include: { generatedCodes: true },
        });
        if (redesign) return redesign;
      }
    } catch (_) {}

    const store = readStore();
    const redesign = store.redesigns.find((r) => r.id === id);
    if (!redesign) return null;

    const generatedCodes = store.generatedCodes.filter((g) => g.redesignId === redesign.id);
    return {
      ...redesign,
      generatedCodes,
    };
  },

  // === GENERATED CODES ===
  async saveGeneratedCode({ redesignId, jsxCode, cssCode, tailwindCode }) {
    const genId = uuidv4();
    const now = new Date().toISOString();
    const codeRecord = {
      id: genId,
      redesignId,
      jsxCode: jsxCode || null,
      cssCode: cssCode || null,
      tailwindCode: tailwindCode || null,
      createdAt: now,
    };

    try {
      const prisma = getPrismaClient();
      if (prisma) {
        await prisma.generatedCode.create({
          data: {
            id: genId,
            redesignId,
            jsxCode,
            cssCode,
            tailwindCode,
          },
        });
      }
    } catch (_) {}

    const store = readStore();
    store.generatedCodes.push(codeRecord);
    writeStore(store);
    return codeRecord;
  },
};
