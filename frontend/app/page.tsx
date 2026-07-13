'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { LoadingSpinner } from '@/components/ui-custom/loading-spinner';
import { homeForRole } from '@/lib/roles';

export default function Home() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    if (isAuthenticated && user) {
      router.replace(homeForRole(user.rol));
    } else {
      router.replace('/login');
    }
  }, [isAuthenticated, isLoading, user, router]);

  return (
    <div className="flex items-center justify-center h-screen bg-background">
      <LoadingSpinner size="lg" />
    </div>
  );
}
