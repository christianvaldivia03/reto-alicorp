'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { ProtectedRoute } from '@/components/protected-route';
import { AppLayout } from '@/components/layout/app-layout';
import { LoadingSpinner } from '@/components/ui-custom/loading-spinner';
import { ErrorAlert } from '@/components/ui-custom/error-alert';
import { mockApi } from '@/lib/mock-api';
import { BrandManual } from '@/lib/types';
import { mockBrandManuals } from '@/lib/mock-data';

function BrandStudioContent() {
  const [manuals, setManuals] = useState<BrandManual[]>(mockBrandManuals);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    guidelines: '',
  });

  const handleCreateManual = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await mockApi.createBrandManual(formData);
      setManuals([...manuals, response.manual]);
      setFormData({ name: '', description: '', guidelines: '' });
      setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create brand manual');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Brand Studio</h1>
          <p className="text-muted-foreground">
            Create and manage brand manuals with AI-generated rules
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity"
        >
          {showForm ? 'Cancel' : 'Create Manual'}
        </button>
      </div>

      {error && (
        <ErrorAlert message={error} onDismiss={() => setError(null)} />
      )}

      {/* Create Form */}
      {showForm && (
        <div className="bg-card border border-border rounded-lg p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">New Brand Manual</h2>
          <form onSubmit={handleCreateManual} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Manual Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Corporate Brand Guidelines"
                required
                className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of brand guidelines"
                required
                className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Brand Guidelines</label>
              <textarea
                value={formData.guidelines}
                onChange={(e) => setFormData({ ...formData, guidelines: e.target.value })}
                placeholder="Paste your brand guidelines here. AI will analyze and extract rules automatically..."
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
                  'Create Manual'
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

      {/* Manuals List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {manuals.map((manual) => (
          <div
            key={manual.id}
            className="bg-card border border-border rounded-lg p-6 hover:border-primary/50 transition-colors"
          >
            <h3 className="text-lg font-bold mb-2">{manual.name}</h3>
            <p className="text-sm text-muted-foreground mb-4">{manual.description}</p>

            {/* Rules Preview */}
            <div className="mb-4">
              <h4 className="text-sm font-semibold mb-3">Brand Rules</h4>
              <div className="space-y-2">
                {manual.rules.slice(0, 3).map((rule) => (
                  <div
                    key={rule.id}
                    className="text-xs bg-muted/50 rounded p-2 flex items-start gap-2"
                  >
                    <span className="font-medium text-primary min-w-fit">{rule.type}</span>
                    <div>
                      <p className="font-medium">{rule.title}</p>
                      <p className="text-muted-foreground truncate">{rule.description}</p>
                    </div>
                  </div>
                ))}
                {manual.rules.length > 3 && (
                  <p className="text-xs text-muted-foreground pt-2">
                    +{manual.rules.length - 3} more rules
                  </p>
                )}
              </div>
            </div>

            <button className="w-full px-3 py-2 bg-primary/10 text-primary rounded font-medium text-sm hover:bg-primary/20 transition-colors">
              View Details
            </button>
          </div>
        ))}
      </div>

      {manuals.length === 0 && !showForm && (
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
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h3 className="text-lg font-semibold mb-2">No brand manuals yet</h3>
          <p className="text-muted-foreground mb-4">Create your first brand manual to get started</p>
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity"
          >
            Create Your First Manual
          </button>
        </div>
      )}
    </div>
  );
}

export default function BrandStudio() {
  return (
    <ProtectedRoute>
      <AppLayout currentPath="studio">
        <BrandStudioContent />
      </AppLayout>
    </ProtectedRoute>
  );
}
