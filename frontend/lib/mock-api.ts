import { User, AuthTokens, BrandManual, Content, ApprovalItem, AuditResult, CreateBrandManualRequest, CreateBrandManualResponse, CreateContentRequest, CreateContentResponse, UploadImageRequest, UploadImageResponse, RuleType } from './types';
import { mockUsers, mockBrandManuals, mockContent, mockApprovalQueue, mockAuditResults } from './mock-data';

// Simulate network delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Simulate auth storage
const authStorage = new Map<string, { user: User; password: string }>();

// Initialize auth storage
mockUsers.forEach((user) => {
  authStorage.set(user.email, { user, password: 'demo123' });
});

// Mock API implementation
export const mockApi = {
  // Auth endpoints
  login: async (email: string, password: string): Promise<{ user: User; tokens: AuthTokens }> => {
    await delay(500);

    const account = authStorage.get(email);
    if (!account || account.password !== password) {
      throw new Error('Invalid email or password');
    }

    return {
      user: account.user,
      tokens: {
        accessToken: 'mock_token_' + Math.random().toString(36).substring(7),
        refreshToken: 'mock_refresh_' + Math.random().toString(36).substring(7),
        expiresIn: 3600,
      },
    };
  },

  getCurrentUser: async (token?: string): Promise<User> => {
    await delay(200);
    // In mock, return the first user (would be decoded from token in real app)
    return mockUsers[0];
  },

  logout: async (): Promise<void> => {
    await delay(200);
  },

  // Brand Manual endpoints
  createBrandManual: async (request: CreateBrandManualRequest): Promise<CreateBrandManualResponse> => {
    await delay(1500);

    // Simulate AI processing to generate rules based on guidelines
    const generatedRules = [
      {
        id: 'ai-rule-1',
        type: RuleType.TONE,
        title: 'Extracted Tone',
        description: 'Tone extracted from provided guidelines',
        examples: ['Example 1', 'Example 2'],
      },
      {
        id: 'ai-rule-2',
        type: RuleType.COMPLIANCE,
        title: 'Compliance Requirement',
        description: 'Extracted compliance requirements',
        examples: ['Compliant example'],
      },
    ];

    const manual: BrandManual = {
      id: 'brand-' + Date.now(),
      name: request.name,
      description: request.description,
      rules: generatedRules,
      createdBy: 'current-user',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return {
      manual,
      generatedRules,
    };
  },

  listBrandManuals: async (): Promise<BrandManual[]> => {
    await delay(300);
    return mockBrandManuals;
  },

  getBrandManual: async (id: string): Promise<BrandManual> => {
    await delay(200);
    const manual = mockBrandManuals.find((m) => m.id === id);
    if (!manual) throw new Error('Brand manual not found');
    return manual;
  },

  // Content endpoints
  createContent: async (request: CreateContentRequest): Promise<CreateContentResponse> => {
    await delay(1200);

    const brand = mockBrandManuals.find((b) => b.id === request.brandManualId);
    if (!brand) throw new Error('Brand manual not found');

    // Simulate AI text generation and rule application
    const generatedText =
      request.text +
      '\n\n[AI-Enhanced] This content has been optimized for brand compliance and readability.';

    const content: Content = {
      id: 'content-' + Date.now(),
      brandManualId: request.brandManualId,
      title: request.title,
      text: generatedText,
      status: 'draft',
      appliedRules: brand.rules.slice(0, 3),
      createdBy: 'current-user',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return {
      content,
      generatedText,
      appliedRules: brand.rules.slice(0, 3),
    };
  },

  listContent: async (): Promise<Content[]> => {
    await delay(300);
    return mockContent;
  },

  getContent: async (id: string): Promise<Content> => {
    await delay(200);
    const content = mockContent.find((c) => c.id === id);
    if (!content) throw new Error('Content not found');
    return content;
  },

  getApprovalQueue: async (): Promise<ApprovalItem[]> => {
    await delay(300);
    return mockApprovalQueue;
  },

  approveContent: async (contentId: string): Promise<Content> => {
    await delay(500);
    const content = mockContent.find((c) => c.id === contentId);
    if (!content) throw new Error('Content not found');
    return { ...content, status: 'approved', approvedBy: 'current-user', approvedAt: new Date().toISOString() };
  },

  rejectContent: async (contentId: string, reason: string): Promise<Content> => {
    await delay(500);
    const content = mockContent.find((c) => c.id === contentId);
    if (!content) throw new Error('Content not found');
    return { ...content, status: 'rejected', rejectionReason: reason };
  },

  // Audit endpoints
  uploadImage: async (request: UploadImageRequest): Promise<UploadImageResponse> => {
    await delay(2000);

    // Simulate AI vision analysis
    const result: AuditResult = {
      id: 'audit-' + Date.now(),
      imageUrl: request.imageBase64.substring(0, 50) + '...',
      status: 'compliant',
      confidence: 0.92,
      violations: [],
      suggestions: ['Image meets all brand guidelines'],
      aiAnalysis: 'AI analysis: Image is compliant with brand specifications.',
      uploadedBy: 'current-user',
      uploadedAt: new Date().toISOString(),
    };

    return { result };
  },

  getAuditHistory: async (): Promise<AuditResult[]> => {
    await delay(300);
    return mockAuditResults;
  },

  getAuditResult: async (id: string): Promise<AuditResult> => {
    await delay(200);
    const result = mockAuditResults.find((r) => r.id === id);
    if (!result) throw new Error('Audit result not found');
    return result;
  },

  // User endpoints
  listUsers: async (): Promise<User[]> => {
    await delay(300);
    return mockUsers;
  },

  createUser: async (email: string, name: string, role: string): Promise<User> => {
    await delay(500);
    const user: User = {
      id: 'user-' + Date.now(),
      email,
      name,
      role: role as any,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    authStorage.set(email, { user, password: 'demo123' });
    return user;
  },

  updateUserRole: async (userId: string, role: string): Promise<User> => {
    await delay(400);
    const user = mockUsers.find((u) => u.id === userId);
    if (!user) throw new Error('User not found');
    const updated = { ...user, role: role as any, updatedAt: new Date().toISOString() };
    const account = authStorage.get(user.email);
    if (account) {
      account.user = updated;
    }
    return updated;
  },

  deactivateUser: async (userId: string): Promise<User> => {
    await delay(400);
    const user = mockUsers.find((u) => u.id === userId);
    if (!user) throw new Error('User not found');
    return { ...user, isActive: false, updatedAt: new Date().toISOString() };
  },
};
