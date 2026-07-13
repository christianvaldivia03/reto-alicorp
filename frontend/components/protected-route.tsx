'use client';

import { useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { LoadingSpinner } from '@/components/ui-custom/loading-spinner';
import { homeForRole } from '@/lib/roles';
import type { Role } from '@/lib/types';

interface ProtectedRouteProps {
  children: ReactNode;
  // Si se pasan, solo estos roles pueden ver la ruta; el resto va a su home.
  allow?: Role[];
}

export function ProtectedRoute({ children, allow }: ProtectedRouteProps) {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.replace('/login');
    } else if (user && allow && !allow.includes(user.rol)) {
      router.replace(homeForRole(user.rol));
    }
  }, [isAuthenticated, isLoading, user, allow, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) return null;
  if (user && allow && !allow.includes(user.rol)) return null;

  return <>{children}</>;
}
