'use client';

import { useState, useRef } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { ProtectedRoute } from '@/components/protected-route';
import { AppLayout } from '@/components/layout/app-layout';
import { LoadingSpinner } from '@/components/ui-custom/loading-spinner';
import { ErrorAlert } from '@/components/ui-custom/error-alert';
import { StatusBadge } from '@/components/ui-custom/status-badge';
import { mockApi } from '@/lib/mock-api';
import { mockAuditResults } from '@/lib/mock-data';
import { AuditResult } from '@/lib/types';

function MultimodalAuditContent() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [results, setResults] = useState<AuditResult[]>(mockAuditResults);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedResult, setSelectedResult] = useState<AuditResult | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setIsLoading(true);

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target?.result as string;
        const response = await mockApi.uploadImage({
          imageBase64: base64,
          brandManualId: 'brand-1',
        });
        setResults([response.result, ...results]);
        setSelectedResult(response.result);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload image');
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'text-emerald-600 dark:text-emerald-400';
    if (confidence >= 0.7) return 'text-amber-600 dark:text-amber-400';
    return 'text-orange-600 dark:text-orange-400';
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Multimodal Audit</h1>
        <p className="text-muted-foreground">
          AI-powered visual compliance checking for brand assets
        </p>
      </div>

      {error && (
        <ErrorAlert message={error} onDismiss={() => setError(null)} />
      )}

      {/* Upload Section */}
      <div className="bg-card border border-dashed border-border rounded-lg p-12 mb-8 text-center">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          disabled={isLoading}
          className="hidden"
        />

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading}
          className="mx-auto mb-4"
        >
          <svg
            className="w-12 h-12 text-primary mx-auto mb-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </button>

        <h3 className="text-lg font-semibold mb-2">
          {isLoading ? 'Analyzing image...' : 'Upload Brand Asset'}
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          {isLoading
            ? 'AI is analyzing your image for brand compliance'
            : 'Drag and drop your image or click to upload'}
        </p>

        {isLoading && (
          <div className="flex items-center justify-center gap-2">
            <LoadingSpinner size="md" />
          </div>
        )}

        {!isLoading && (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity"
          >
            Choose File
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Results List */}
        <div className="lg:col-span-1 space-y-2">
          <h2 className="text-sm font-semibold mb-4">Audit History ({results.length})</h2>
          {results.map((result) => (
            <button
              key={result.id}
              onClick={() => setSelectedResult(result)}
              className={`w-full text-left p-3 rounded-lg border transition-colors ${
                selectedResult?.id === result.id
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <StatusBadge status={result.status} variant="audit" />
                <span className={`text-xs font-semibold ${getConfidenceColor(result.confidence)}`}>
                  {Math.round(result.confidence * 100)}%
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {new Date(result.uploadedAt).toLocaleDateString()}
              </p>
            </button>
          ))}
        </div>

        {/* Details View */}
        <div className="lg:col-span-3">
          {selectedResult ? (
            <div className="space-y-6">
              {/* Status Overview */}
              <div className="bg-card border border-border rounded-lg p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">Audit Result</h2>
                    <p className="text-sm text-muted-foreground">
                      {new Date(selectedResult.uploadedAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <StatusBadge status={selectedResult.status} variant="audit" />
                    <div className={`text-2xl font-bold mt-2 ${getConfidenceColor(selectedResult.confidence)}`}>
                      {Math.round(selectedResult.confidence * 100)}%
                    </div>
                    <p className="text-xs text-muted-foreground">confidence</p>
                  </div>
                </div>
              </div>

              {/* AI Analysis */}
              <div className="bg-card border border-border rounded-lg p-6">
                <h3 className="text-lg font-bold mb-3">AI Analysis</h3>
                <p className="text-sm leading-relaxed text-foreground">
                  {selectedResult.aiAnalysis}
                </p>
              </div>

              {/* Violations */}
              {selectedResult.violations.length > 0 && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
                  <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                    <svg
                      className="w-5 h-5 text-red-600 dark:text-red-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Violations Found
                  </h3>
                  <ul className="space-y-2">
                    {selectedResult.violations.map((violation, idx) => (
                      <li key={idx} className="text-sm flex items-start gap-2">
                        <span className="text-red-600 dark:text-red-400 mt-0.5">✕</span>
                        <span className="text-red-900 dark:text-red-300">{violation}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Suggestions */}
              {selectedResult.suggestions.length > 0 && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-6">
                  <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                    <svg
                      className="w-5 h-5 text-amber-600 dark:text-amber-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18.243 3.757l-2-2a1 1 0 00-1.414 0L5.414 13.172a1 1 0 000 1.414l2 2a1 1 0 001.414 0L18.243 5.171a1 1 0 000-1.414zM4 12.586V16H7.414l9.172-9.172-3.414-3.414L4 12.586z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Suggestions
                  </h3>
                  <ul className="space-y-2">
                    {selectedResult.suggestions.map((suggestion, idx) => (
                      <li key={idx} className="text-sm flex items-start gap-2">
                        <span className="text-amber-600 dark:text-amber-400 mt-0.5">→</span>
                        <span className="text-amber-900 dark:text-amber-300">{suggestion}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* No Violations */}
              {selectedResult.violations.length === 0 && (
                <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-6">
                  <div className="flex items-center gap-3">
                    <svg
                      className="w-6 h-6 text-emerald-600 dark:text-emerald-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <div>
                      <p className="font-semibold text-emerald-900 dark:text-emerald-300">
                        Fully Compliant
                      </p>
                      <p className="text-sm text-emerald-800 dark:text-emerald-400">
                        This asset meets all brand guidelines
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-card border border-border rounded-lg p-12 text-center">
              <p className="text-muted-foreground">Upload an image to see audit results</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MultimodalAudit() {
  return (
    <ProtectedRoute>
      <AppLayout currentPath="studio">
        <MultimodalAuditContent />
      </AppLayout>
    </ProtectedRoute>
  );
}
