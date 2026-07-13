// Enums
export enum UserRole {
  ADMIN = 'admin',
  BRAND_MANAGER = 'brand_manager',
  CONTENT_CREATOR = 'content_creator',
  APPROVER = 'approver',
  AUDITOR = 'auditor',
}

export enum ContentStatus {
  DRAFT = 'draft',
  PENDING_APPROVAL = 'pending_approval',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  PUBLISHED = 'published',
}

export enum RuleType {
  TONE = 'tone',
  BRAND_VOICE = 'brand_voice',
  COMPLIANCE = 'compliance',
  SEO = 'seo',
  FORMATTING = 'formatting',
}

export enum AuditStatus {
  COMPLIANT = 'compliant',
  NON_COMPLIANT = 'non_compliant',
  NEEDS_REVIEW = 'needs_review',
}

// User & Auth
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthContext {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (user: User) => void;
}

// Brand Manual
export interface BrandRule {
  id: string;
  type: RuleType;
  title: string;
  description: string;
  examples: string[];
}

export interface BrandManual {
  id: string;
  name: string;
  description: string;
  rules: BrandRule[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBrandManualRequest {
  name: string;
  description: string;
  guidelines: string;
}

export interface CreateBrandManualResponse {
  manual: BrandManual;
  generatedRules: BrandRule[];
}

// Content
export interface Content {
  id: string;
  brandManualId: string;
  title: string;
  text: string;
  status: ContentStatus;
  appliedRules: BrandRule[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
}

export interface CreateContentRequest {
  brandManualId: string;
  title: string;
  text: string;
}

export interface CreateContentResponse {
  content: Content;
  generatedText: string;
  appliedRules: BrandRule[];
}

// Approval Queue
export interface ApprovalItem {
  id: string;
  contentId: string;
  title: string;
  text: string;
  createdBy: string;
  createdAt: string;
  appliedRules: BrandRule[];
}

// Multimodal Audit
export interface AuditResult {
  id: string;
  imageUrl: string;
  status: AuditStatus;
  confidence: number;
  violations: string[];
  suggestions: string[];
  aiAnalysis: string;
  uploadedBy: string;
  uploadedAt: string;
}

export interface UploadImageRequest {
  imageBase64: string;
  brandManualId: string;
}

export interface UploadImageResponse {
  result: AuditResult;
}

// Error Response
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
}
