// Modelo de datos: espejo exacto del contrato del backend (ver
// BACKEND_REQUERIMIENTOS.md §5). El frontend no inventa campos: consume tal cual.

// --- Enums (valores idénticos a los del backend) ---
export enum Role {
  SUPERADMIN = 'SUPERADMIN',
  CREADOR = 'CREADOR',
  APROBADOR_A = 'APROBADOR_A',
  APROBADOR_B = 'APROBADOR_B',
}

export enum ContentType {
  DESCRIPCION = 'DESCRIPCION',
  GUION = 'GUION',
  PROMPT_IMAGEN = 'PROMPT_IMAGEN',
}

export enum ContentStatus {
  PENDIENTE = 'PENDIENTE',
  APROBADO = 'APROBADO',
  RECHAZADO = 'RECHAZADO',
}

export enum RuleType {
  PROHIBICION = 'PROHIBICION',
  RECOMENDACION = 'RECOMENDACION',
  OBLIGACION = 'OBLIGACION',
}

export enum Verdict {
  CUMPLE = 'CUMPLE',
  NO_CUMPLE = 'NO_CUMPLE',
}

// --- Entidades ---
export interface User {
  id: string;
  email: string;
  rol: Role;
  activo: boolean;
}

export interface BrandRule {
  categoria: string;
  texto: string;
  tipo: RuleType;
}

// Vista ligera del listado (GET /brands).
export interface BrandSummary {
  id: string;
  categoria: string;
  tono: string;
  publico: string;
}

// Respuesta de POST /brands (manual recién generado).
export interface BrandManual {
  id: string;
  estado: string;
  reglas: BrandRule[];
}

export interface Content {
  id: string;
  brand_id: string;
  tipo: ContentType;
  texto: string;
  estado: ContentStatus;
  reglas_aplicadas: string[];
  motivo?: string | null;
}

// Resultado de la transición de estado (approve/reject).
export interface ContentState {
  id: string;
  estado: ContentStatus;
  motivo: string | null;
}

export interface AuditReport {
  id: string;
  content_id: string;
  veredicto: Verdict;
  motivo: string;
  reglas_evaluadas: string[];
}
