// Capa única de acceso al backend. Toda llamada HTTP pasa por aquí; las
// pantallas no hacen fetch directo. Endpoints según BACKEND_REQUERIMIENTOS.md §5.
import type {
  User,
  BrandSummary,
  BrandManual,
  Content,
  ContentState,
  AuditReport,
} from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const TOKEN_KEY = 'access_token';

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers = new Headers(options.headers);
  if (token) headers.set('Authorization', `Bearer ${token}`);
  // No forzar Content-Type en multipart (el browser pone el boundary).
  if (options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers });
  } catch {
    throw new ApiError(0, 'No se pudo conectar con el servidor');
  }

  if (response.status === 401) {
    clearToken();
    if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
      window.location.href = '/login';
    }
    throw new ApiError(401, 'Sesión expirada');
  }

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    // FastAPI devuelve el error de dominio en `detail`.
    const detail = typeof data.detail === 'string' ? data.detail : `Error ${response.status}`;
    throw new ApiError(response.status, detail);
  }

  if (response.status === 204) return undefined as T;
  return response.json();
}

// --- Auth ---
export const authApi = {
  login: (email: string, password: string): Promise<{ access_token: string; token_type: string }> =>
    request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),

  me: (): Promise<User> => request('/auth/me'),
};

// --- Marcas ---
export const brandApi = {
  list: (): Promise<BrandSummary[]> => request('/brands'),

  get: (id: string): Promise<BrandManual> => request(`/brands/${id}`),

  create: (categoria: string, tono: string, publico: string): Promise<BrandManual> =>
    request('/brands', { method: 'POST', body: JSON.stringify({ categoria, tono, publico }) }),
};

// --- Contenido ---
export const contentApi = {
  create: (brand_id: string, tipo: string, brief: string): Promise<Content> =>
    request('/content', { method: 'POST', body: JSON.stringify({ brand_id, tipo, brief }) }),

  list: (estado?: string): Promise<Content[]> =>
    request(`/content${estado ? `?estado=${encodeURIComponent(estado)}` : ''}`),

  get: (id: string): Promise<Content> => request(`/content/${id}`),

  approve: (id: string): Promise<ContentState> =>
    request(`/content/${id}/approve`, { method: 'POST' }),

  reject: (id: string, motivo: string): Promise<ContentState> =>
    request(`/content/${id}/reject`, { method: 'POST', body: JSON.stringify({ motivo }) }),

  audit: (id: string, image: File): Promise<AuditReport> => {
    const form = new FormData();
    form.append('image', image);
    return request(`/content/${id}/audit`, { method: 'POST', body: form });
  },

  audits: (id: string): Promise<AuditReport[]> => request(`/content/${id}/audits`),
};

// --- Usuarios (Superadmin) ---
export const usersApi = {
  list: (): Promise<User[]> => request('/users'),

  create: (email: string, password: string, rol: string): Promise<User> =>
    request('/users', { method: 'POST', body: JSON.stringify({ email, password, rol }) }),

  changeRole: (id: string, rol: string): Promise<User> =>
    request(`/users/${id}/role`, { method: 'PATCH', body: JSON.stringify({ rol }) }),

  deactivate: (id: string): Promise<User> =>
    request(`/users/${id}/deactivate`, { method: 'POST' }),
};
