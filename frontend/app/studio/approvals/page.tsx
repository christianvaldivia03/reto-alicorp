'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { ProtectedRoute } from '@/components/protected-route';
import { AppLayout } from '@/components/layout/app-layout';
import { LoadingSpinner } from '@/components/ui-custom/loading-spinner';
import { ErrorAlert } from '@/components/ui-custom/error-alert';
import { mockApi } from '@/lib/mock-api';
import { mockApprovalQueue } from '@/lib/mock-data';
import { ApprovalItem } from '@/lib/types';

function ApprovalQueueContent() {
  const [queue, setQueue] = useState<ApprovalItem[]>(mockApprovalQueue);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<ApprovalItem | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);

  const handleApprove = async (itemId: string) => {
    setError(null);
    setIsLoading(true);

    try {
      await mockApi.approveContent(itemId);
      setQueue(queue.filter((item) => item.id !== itemId));
      setSelectedItem(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve content');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedItem) return;

    setError(null);
    setIsLoading(true);

    try {
      await mockApi.rejectContent(selectedItem.contentId, rejectionReason);
      setQueue(queue.filter((item) => item.id !== selectedItem.id));
      setSelectedItem(null);
      setShowRejectModal(false);
      setRejectionReason('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject content');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Approval Queue</h1>
        <p className="text-muted-foreground">
          Review and approve pending content
        </p>
      </div>

      {error && (
        <ErrorAlert message={error} onDismiss={() => setError(null)} />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Queue List */}
        <div className="lg:col-span-1 space-y-2">
          <h2 className="text-sm font-semibold mb-4">Pending ({queue.length})</h2>
          {queue.map((item) => (
            <button
              key={item.id}
              onClick={() => setSelectedItem(item)}
              className={`w-full text-left p-4 rounded-lg border transition-colors ${
                selectedItem?.id === item.id
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <h3 className="font-semibold text-sm line-clamp-1">{item.title}</h3>
              <p className="text-xs text-muted-foreground mt-1">
                {new Date(item.createdAt).toLocaleDateString()}
              </p>
            </button>
          ))}
          {queue.length === 0 && (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">No pending content</p>
            </div>
          )}
        </div>

        {/* Detail View */}
        <div className="lg:col-span-2">
          {selectedItem ? (
            <div className="bg-card border border-border rounded-lg p-6 space-y-6">
              {/* Header */}
              <div>
                <h2 className="text-2xl font-bold mb-2">{selectedItem.title}</h2>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>By {selectedItem.createdBy}</span>
                  <span>•</span>
                  <span>{new Date(selectedItem.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Content */}
              <div className="bg-background rounded-lg p-4">
                <h3 className="text-xs font-semibold mb-2 text-muted-foreground uppercase">Content</h3>
                <p className="text-sm leading-relaxed text-foreground">{selectedItem.text}</p>
              </div>

              {/* Applied Rules */}
              {selectedItem.appliedRules.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold mb-3 text-muted-foreground uppercase">
                    Applied Rules
                  </h3>
                  <div className="space-y-2">
                    {selectedItem.appliedRules.map((rule) => (
                      <div
                        key={rule.id}
                        className="bg-background rounded-lg p-3 border border-border/50"
                      >
                        <div className="flex items-start gap-2">
                          <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-1 rounded">
                            {rule.type}
                          </span>
                          <div>
                            <p className="text-sm font-medium">{rule.title}</p>
                            <p className="text-xs text-muted-foreground mt-1">{rule.description}</p>
                          </div>
                        </div>
                        {rule.examples.length > 0 && (
                          <div className="mt-2 pl-2 border-l border-muted">
                            <p className="text-xs font-medium text-muted-foreground mb-1">Examples:</p>
                            <ul className="text-xs text-muted-foreground space-y-1">
                              {rule.examples.map((example, idx) => (
                                <li key={idx}>• {example}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t border-border">
                <button
                  onClick={() => handleApprove(selectedItem.id)}
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <LoadingSpinner size="sm" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Approve
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowRejectModal(true)}
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Reject
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-lg p-12 text-center">
              <p className="text-muted-foreground">Select an item from the queue to review</p>
            </div>
          )}
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && selectedItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-card border border-border rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">Reject Content</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Please provide a reason for rejecting this content.
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Reason for rejection..."
              rows={4}
              className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none mb-4"
            />
            <div className="flex gap-2">
              <button
                onClick={() => handleReject()}
                disabled={isLoading || !rejectionReason.trim()}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium disabled:opacity-50 transition-colors"
              >
                Reject
              </button>
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectionReason('');
                }}
                disabled={isLoading}
                className="flex-1 px-4 py-2 border border-input rounded-lg font-medium hover:bg-muted transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ApprovalQueue() {
  return (
    <ProtectedRoute>
      <AppLayout currentPath="studio">
        <ApprovalQueueContent />
      </AppLayout>
    </ProtectedRoute>
  );
}
