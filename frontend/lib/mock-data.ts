import { User, BrandManual, Content, ApprovalItem, AuditResult, UserRole, ContentStatus, RuleType, AuditStatus } from './types';

// Mock Users
export const mockUsers: User[] = [
  {
    id: '1',
    email: 'admin@example.com',
    name: 'Sarah Admin',
    role: UserRole.ADMIN,
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    email: 'manager@example.com',
    name: 'John Manager',
    role: UserRole.BRAND_MANAGER,
    isActive: true,
    createdAt: '2024-01-02T00:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z',
  },
  {
    id: '3',
    email: 'creator@example.com',
    name: 'Emma Creator',
    role: UserRole.CONTENT_CREATOR,
    isActive: true,
    createdAt: '2024-01-03T00:00:00Z',
    updatedAt: '2024-01-03T00:00:00Z',
  },
  {
    id: '4',
    email: 'approver@example.com',
    name: 'Mike Approver',
    role: UserRole.APPROVER,
    isActive: true,
    createdAt: '2024-01-04T00:00:00Z',
    updatedAt: '2024-01-04T00:00:00Z',
  },
  {
    id: '5',
    email: 'auditor@example.com',
    name: 'Lisa Auditor',
    role: UserRole.AUDITOR,
    isActive: true,
    createdAt: '2024-01-05T00:00:00Z',
    updatedAt: '2024-01-05T00:00:00Z',
  },
];

// Mock Brand Rules
const mockRules = [
  {
    id: 'rule-1',
    type: RuleType.TONE,
    title: 'Professional & Friendly',
    description: 'Use a professional yet approachable tone. Avoid jargon unless necessary.',
    examples: [
      'Good: "We\'d love to help you get started!"',
      'Bad: "Initiate onboarding protocol"',
    ],
  },
  {
    id: 'rule-2',
    type: RuleType.BRAND_VOICE,
    title: 'Inclusive Language',
    description: 'Always use inclusive and diverse language. Avoid gendered terms.',
    examples: [
      'Good: "Each developer can customize their workspace"',
      'Bad: "Each developer can customize his workspace"',
    ],
  },
  {
    id: 'rule-3',
    type: RuleType.COMPLIANCE,
    title: 'No Unsubstantiated Claims',
    description: 'All performance claims must be backed by data or testing.',
    examples: [
      'Good: "30% faster than competitors (source: independent benchmark)"',
      'Bad: "Significantly faster than competitors"',
    ],
  },
  {
    id: 'rule-4',
    type: RuleType.SEO,
    title: 'Target Keywords',
    description: 'Include primary keywords naturally within the first 100 words.',
    examples: [
      'Primary keywords: content management, brand compliance, AI-powered',
    ],
  },
  {
    id: 'rule-5',
    type: RuleType.FORMATTING,
    title: 'Title Length',
    description: 'Keep titles between 30-60 characters for optimal display.',
    examples: [
      'Good: "AI-Powered Content Management System (45 chars)"',
      'Bad: "This is our comprehensive all-in-one solution for managing content" (74 chars)',
    ],
  },
];

// Mock Brand Manuals
export const mockBrandManuals: BrandManual[] = [
  {
    id: 'brand-1',
    name: 'TechCorp Brand Guidelines',
    description: 'Official brand guidelines for TechCorp products and marketing',
    rules: mockRules,
    createdBy: '2',
    createdAt: '2024-01-10T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z',
  },
  {
    id: 'brand-2',
    name: 'SaaS Startup Voice',
    description: 'Brand voice guidelines for early-stage SaaS companies',
    rules: mockRules.slice(0, 3),
    createdBy: '2',
    createdAt: '2024-01-08T00:00:00Z',
    updatedAt: '2024-01-12T00:00:00Z',
  },
];

// Mock Content
export const mockContent: Content[] = [
  {
    id: 'content-1',
    brandManualId: 'brand-1',
    title: 'Getting Started with Our Platform',
    text: 'Our platform makes it easy to get started. Simply sign up, configure your workspace, and begin creating. We provide templates and tutorials to guide you through every step.',
    status: ContentStatus.APPROVED,
    appliedRules: mockRules.slice(0, 3),
    createdBy: '3',
    createdAt: '2024-01-12T00:00:00Z',
    updatedAt: '2024-01-14T00:00:00Z',
    approvedBy: '4',
    approvedAt: '2024-01-14T10:00:00Z',
  },
  {
    id: 'content-2',
    brandManualId: 'brand-1',
    title: 'Advanced Features Guide',
    text: 'Unlock the full potential of our platform with advanced features. Customize workflows, automate processes, and integrate with your favorite tools to create a seamless experience.',
    status: ContentStatus.PENDING_APPROVAL,
    appliedRules: mockRules,
    createdBy: '3',
    createdAt: '2024-01-16T00:00:00Z',
    updatedAt: '2024-01-16T08:00:00Z',
  },
  {
    id: 'content-3',
    brandManualId: 'brand-1',
    title: 'Pricing that Works for Everyone',
    text: 'We believe pricing should be transparent and flexible. Choose the plan that fits your needs, from free to enterprise. No hidden fees.',
    status: ContentStatus.DRAFT,
    appliedRules: mockRules.slice(1, 4),
    createdBy: '3',
    createdAt: '2024-01-17T00:00:00Z',
    updatedAt: '2024-01-17T05:00:00Z',
  },
];

// Mock Approval Queue
export const mockApprovalQueue: ApprovalItem[] = [
  {
    id: 'approval-1',
    contentId: 'content-2',
    title: 'Advanced Features Guide',
    text: 'Unlock the full potential of our platform with advanced features. Customize workflows, automate processes, and integrate with your favorite tools to create a seamless experience.',
    createdBy: '3',
    createdAt: '2024-01-16T00:00:00Z',
    appliedRules: mockRules,
  },
];

// Mock Audit Results
export const mockAuditResults: AuditResult[] = [
  {
    id: 'audit-1',
    imageUrl: '/sample-image.png',
    status: AuditStatus.COMPLIANT,
    confidence: 0.95,
    violations: [],
    suggestions: ['Consider increasing font size for better readability on mobile devices'],
    aiAnalysis:
      'The marketing banner displays compliant branding. Colors match brand guidelines. Typography is consistent with brand voice.',
    uploadedBy: '5',
    uploadedAt: '2024-01-15T00:00:00Z',
  },
  {
    id: 'audit-2',
    imageUrl: '/sample-image-2.png',
    status: AuditStatus.NON_COMPLIANT,
    confidence: 0.88,
    violations: [
      'Logo dimensions do not match brand specifications (should be 1:1 ratio)',
      'Color usage: Secondary color appears over-saturated',
    ],
    suggestions: [
      'Adjust logo to proper 1:1 aspect ratio',
      'Reduce saturation of secondary colors by 15%',
      'Add proper spacing around logo elements',
    ],
    aiAnalysis:
      'Several compliance issues detected. The logo dimensions deviate from specifications. Color saturation exceeds brand guidelines. Recommend revisions before publication.',
    uploadedBy: '5',
    uploadedAt: '2024-01-14T00:00:00Z',
  },
  {
    id: 'audit-3',
    imageUrl: '/sample-image-3.png',
    status: AuditStatus.NEEDS_REVIEW,
    confidence: 0.72,
    violations: [
      'Font not clearly identifiable - may not match brand typography',
    ],
    suggestions: [
      'Verify font is from approved brand font family',
      'Increase contrast between text and background',
    ],
    aiAnalysis:
      'Moderate confidence in compliance assessment. Font identification uncertain. Recommend manual review by brand team to confirm typography compliance.',
    uploadedBy: '5',
    uploadedAt: '2024-01-13T00:00:00Z',
  },
];
