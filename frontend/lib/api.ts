import type {
  User,
  AuthTokens,
  BrandManual,
  Content,
  ApprovalItem,
  AuditResult,
  ApiResponse,
  CreateBrandManualRequest,
  CreateBrandManualResponse,
  CreateContentRequest,
  CreateContentResponse,
  UploadImageRequest,
  UploadImageResponse,
} from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// Helper to get stored tokens
function getStoredTokens(): AuthTokens | null {
  if (typeof window === 'undefined') return null;
  const tokens = localStorage.getItem('auth_tokens');
  return tokens ? JSON.parse(tokens) : null;
}

// API request handler
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const tokens = getStoredTokens();

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (tokens) {
    headers['Authorization'] = `Bearer ${tokens.accessToken}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    localStorage.removeItem('auth_tokens');
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error?.message || `HTTP ${response.status}`);
  }

  return response.json();
}

// Authentication endpoints
export const authApi = {
  login: async (email: string, password: string): Promise<{ user: User; tokens: AuthTokens }> => {
    return apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  logout: async (): Promise<void> => {
    try {
      await apiRequest('/auth/logout', { method: 'POST' });
    } finally {
      localStorage.removeItem('auth_tokens');
    }
  },

  getCurrentUser: async (): Promise<User> => {
    return apiRequest('/auth/me');
  },
};

// Brand Manual endpoints
export const brandApi = {
  create: async (request: CreateBrandManualRequest): Promise<CreateBrandManualResponse> => {
    return apiRequest('/brand-manuals', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  },

  list: async (): Promise<BrandManual[]> => {
    return apiRequest('/brand-manuals');
  },

  get: async (id: string): Promise<BrandManual> => {
    return apiRequest(`/brand-manuals/${id}`);
  },
};

// Content endpoints
export const contentApi = {
  create: async (request: CreateContentRequest): Promise<CreateContentResponse> => {
    return apiRequest('/content', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  },

  list: async (): Promise<Content[]> => {
    return apiRequest('/content');
  },

  get: async (id: string): Promise<Content> => {
    return apiRequest(`/content/${id}`);
  },

  getApprovalQueue: async (): Promise<ApprovalItem[]> => {
    return apiRequest('/content/approval-queue');
  },

  approve: async (contentId: string): Promise<Content> => {
    return apiRequest(`/content/${contentId}/approve`, {
      method: 'POST',
    });
  },

  reject: async (contentId: string, reason: string): Promise<Content> => {
    return apiRequest(`/content/${contentId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },
};

// Audit endpoints
export const auditApi = {
  uploadImage: async (request: UploadImageRequest): Promise<UploadImageResponse> => {
    return apiRequest('/audit/upload-image', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  },

  getHistory: async (): Promise<AuditResult[]> => {
    return apiRequest('/audit/history');
  },

  get: async (id: string): Promise<AuditResult> => {
    return apiRequest(`/audit/${id}`);
  },
};

// User management endpoints
export const usersApi = {
  list: async (): Promise<User[]> => {
    return apiRequest('/users');
  },

  create: async (email: string, name: string, role: string): Promise<User> => {
    return apiRequest('/users', {
      method: 'POST',
      body: JSON.stringify({ email, name, role }),
    });
  },

  updateRole: async (userId: string, role: string): Promise<User> => {
    return apiRequest(`/users/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    });
  },

  deactivate: async (userId: string): Promise<User> => {
    return apiRequest(`/users/${userId}/deactivate`, {
      method: 'POST',
    });
  },
};
