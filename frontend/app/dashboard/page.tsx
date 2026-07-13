'use client';

import { useAuth } from '@/contexts/auth-context';
import { ProtectedRoute } from '@/components/protected-route';
import { AppLayout } from '@/components/layout/app-layout';
import { UserRole } from '@/lib/types';
import Link from 'next/link';

function DashboardContent() {
  const { user } = useAuth();

  const quickLinks = [
    {
      title: 'Brand Studio',
      description: 'Create and manage brand manuals',
      href: '/studio/brand',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
          />
        </svg>
      ),
      roles: [UserRole.ADMIN, UserRole.BRAND_MANAGER],
    },
    {
      title: 'Content Studio',
      description: 'Create and apply brand rules',
      href: '/studio/content',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
          />
        </svg>
      ),
      roles: [UserRole.ADMIN, UserRole.CONTENT_CREATOR],
    },
    {
      title: 'Approval Queue',
      description: 'Review and approve content',
      href: '/studio/approvals',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
          />
        </svg>
      ),
      roles: [UserRole.ADMIN, UserRole.APPROVER],
    },
    {
      title: 'Multimodal Audit',
      description: 'AI-powered image compliance',
      href: '/studio/audit',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      ),
      roles: [UserRole.ADMIN, UserRole.AUDITOR],
    },
    {
      title: 'User Management',
      description: 'Manage team members',
      href: '/admin/users',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4.354a4 4 0 110 5.292M15 19H9a6 6 0 016-6h0a6 6 0 016 6v1a2 2 0 01-2 2H7a2 2 0 01-2-2v-1a6 6 0 016-6z"
          />
        </svg>
      ),
      roles: [UserRole.ADMIN],
    },
  ];

  const visibleLinks = quickLinks.filter(
    (link) => user && link.roles.includes(user.role)
  );

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, <span className="font-medium text-foreground">{user?.name}</span>! Here&apos;s what you can do today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="text-sm font-medium text-muted-foreground mb-2">Brand Manuals</div>
          <div className="text-3xl font-bold">2</div>
          <p className="text-xs text-muted-foreground mt-2">Active guidelines</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="text-sm font-medium text-muted-foreground mb-2">Pending Content</div>
          <div className="text-3xl font-bold">1</div>
          <p className="text-xs text-muted-foreground mt-2">Awaiting approval</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="text-sm font-medium text-muted-foreground mb-2">Compliant Assets</div>
          <div className="text-3xl font-bold">18</div>
          <p className="text-xs text-muted-foreground mt-2">Recently audited</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="text-sm font-medium text-muted-foreground mb-2">Team Members</div>
          <div className="text-3xl font-bold">5</div>
          <p className="text-xs text-muted-foreground mt-2">Active users</p>
        </div>
      </div>

      {/* Quick Links */}
      <h2 className="text-2xl font-bold mb-4">Quick Access</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {visibleLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="bg-card border border-border rounded-lg p-6 hover:border-primary/50 hover:shadow-md transition-all group"
          >
            <div className="text-primary mb-3 group-hover:scale-110 transition-transform">
              {link.icon}
            </div>
            <h3 className="font-semibold mb-1">{link.title}</h3>
            <p className="text-sm text-muted-foreground">{link.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function Dashboard() {
  return (
    <ProtectedRoute>
      <AppLayout currentPath="dashboard">
        <DashboardContent />
      </AppLayout>
    </ProtectedRoute>
  );
}
