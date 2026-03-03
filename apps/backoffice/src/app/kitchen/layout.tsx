'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/hooks/useAuth';

export default function KitchenLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    if (!token && !user) {
      router.replace('/login');
    }
  }, [router, user]);

  const hasToken = typeof window !== 'undefined' && !!localStorage.getItem('access_token');
  if (!user && !hasToken) return null;

  return <>{children}</>;
}
