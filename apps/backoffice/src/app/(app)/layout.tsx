'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/hooks/useAuth';
import { isPlatformUser } from '@/types/auth';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    const token =
      typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    if (!token && !user) {
      router.replace('/login');
      return;
    }
    // Kitchen users belong in /kitchen, not in the regular app
    if (user?.tenant_role === 'kitchen' && !pathname.startsWith('/kitchen')) {
      router.replace('/kitchen');
    }
    // Platform users (superadmin) belong in /admin, not in tenant pages
    if (isPlatformUser(user) && !pathname.startsWith('/admin')) {
      router.replace('/admin/tenants');
    }
  }, [router, user, pathname]);

  const hasToken =
    typeof window !== 'undefined' && !!localStorage.getItem('access_token');

  if (!user && !hasToken) {
    return null;
  }

  // While kitchen redirect is pending, render nothing
  if (user?.tenant_role === 'kitchen' && !pathname.startsWith('/kitchen')) {
    return null;
  }

  // While platform redirect is pending, render nothing
  if (isPlatformUser(user) && !pathname.startsWith('/admin')) {
    return null;
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-8">{children}</main>
      </div>
    </div>
  );
}
