'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { ProtectedRoute } from '@/components/protected-route';
import { AppLayout } from '@/components/layout/app-layout';
import { LoadingSpinner } from '@/components/ui-custom/loading-spinner';
import { ErrorAlert } from '@/components/ui-custom/error-alert';
import { StatusBadge } from '@/components/ui-custom/status-badge';
import { mockApi } from '@/lib/mock-api';
import { mockBrandManuals, mockContent } from '@/lib/mock-data';
import { Content } from '@/lib/types';

function ContentStudioContent() {
  const [content, setContent] = useState<Content[]>(mockContent);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedManualId, setSelectedManualId] = useState(mockBrandManuals[0]?.id || '');
  const [formData, setFormData] = useState({
    title: '',
    text: '',
  });

  const handleCreateContent = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await mockApi.createContent({
        brandManualId: selectedManualId,
        ...formData,
      });
      setContent([...content, response.content]);
      setFormData({ title: '', text: '' });
      setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create content');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Content Studio</h1>
          <p className="text-muted-foreground">
            Create content with AI-powered brand compliance
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity"
        >
          {showForm ? 'Cancel' : 'Create Content'}
        </button>
      </div>

      {error && (
        <ErrorAlert message={error} onDismiss={() => setError(null)} />
      )}

      {/* Create Form */}
      {showForm && (
        <div className="bg-card border border-border rounded-lg p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">New Content</h2>
          <form onSubmit={handleCreateContent} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Brand Manual</label>
              <select
                value={selectedManualId}
                onChange={(e) => setSelectedManualId(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {mockBrandManuals.map((manual) => (
                  <option key={manual.id} value={manual.id}>
                    {manual.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Content title"
                required
                className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Content</label>
              <textarea
                value={formData.text}
                onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                placeholder="Write your content here..."
                required
                rows={8}
                className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <LoadingSpinner size="sm" />
                    Processing...
                  </>
                ) : (
                  'Create & Apply Rules'
                )}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 border border-input rounded-lg font-medium hover:bg-muted transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Content List */}
      <div className="space-y-4">
        {content.map((item) => (
          <div key={item.id} className="bg-card border border-border rounded-lg p-6 hover:border-primary/50 transition-colors">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="text-lg font-bold">{item.title}</h3>
                <p className="text-sm text-muted-foreground">
                  Created {new Date(item.createdAt).toLocaleDateString()}
                </p>
              </div>
              <StatusBadge status={item.status} />
            </div>

            <p className="text-sm mb-4 line-clamp-2">{item.text}</p>

            {/* Applied Rules */}
            {item.appliedRules.length > 0 && (
              <div className="mb-4">
                <h4 className="text-xs font-semibold mb-2 text-muted-foreground uppercase">Applied Rules</h4>
                <div className="flex flex-wrap gap-2">
                  {item.appliedRules.map((rule) => (
                    <span
                      key={rule.id}
                      className="text-xs bg-primary/10 text-primary px-2 py-1 rounded"
                    >
                      {rule.type}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <button className="flex-1 px-3 py-2 bg-primary/10 text-primary rounded font-medium text-sm hover:bg-primary/20 transition-colors">
                View Details
              </button>
              {item.status === 'draft' && (
                <button className="flex-1 px-3 py-2 bg-primary text-primary-foreground rounded font-medium text-sm hover:opacity-90 transition-opacity">
                  Submit for Approval
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {content.length === 0 && !showForm && (
        <div className="text-center py-12">
          <svg
            className="w-16 h-16 text-muted-foreground mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
          <h3 className="text-lg font-semibold mb-2">No content yet</h3>
          <p className="text-muted-foreground mb-4">Create your first piece of content to get started</p>
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity"
          >
            Create Your First Content
          </button>
        </div>
      )}
    </div>
  );
}

export default function ContentStudio() {
  return (
    <ProtectedRoute>
      <AppLayout currentPath="studio">
        <ContentStudioContent />
      </AppLayout>
    </ProtectedRoute>
  );
}
