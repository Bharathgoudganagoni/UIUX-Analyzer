import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 180000, // 3 minutes for AI operations
});

// Request interceptor to attach user ID and tenant isolation headers
api.interceptors.request.use(
  (config) => {
    try {
      const savedUser = localStorage.getItem('uiux_analyzer_user_profile');
      if (savedUser) {
        const userObj = JSON.parse(savedUser);
        if (userObj?.id) {
          config.headers['x-user-id'] = userObj.id;
        }
      }
    } catch (_) {}
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for consistent error handling
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      'An unexpected error occurred';
    
    const err = new Error(message);
    err.status = error.response?.status;
    err.data = error.response?.data;
    return Promise.reject(err);
  }
);

// Analysis API
export const analysisApi = {
  analyze: (formData) =>
    api.post('/api/analysis', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  getAnalysis: (id) => api.get(`/api/analysis/${id}`),

  analyzeDemo: () =>
    api.post('/api/analysis', { isDemo: true }),
};

// Redesign API
export const redesignApi = {
  createRedesign: (data) => api.post('/api/redesign', data),
  getRedesign: (id) => api.get(`/api/redesign/${id}`),
};

// Code Generation API
export const codeGenApi = {
  generateCode: (data) => api.post('/api/code-generation', data),
};

// Projects API
export const projectsApi = {
  getProjects: () => api.get('/api/projects'),
  getProject: (id) => api.get(`/api/projects/${id}`),
  deleteProject: (id) => api.delete(`/api/projects/${id}`),
};

// Website API
export const websiteApi = {
  analyze: (data) => api.post('/api/website/analyze', data),
};

// Health API
export const healthApi = {
  check: () => api.get('/api/health'),
};

export default api;
