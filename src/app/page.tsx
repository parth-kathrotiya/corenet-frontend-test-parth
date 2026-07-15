'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { loadCredentials } from '@/redux/slices/authSlice';

// Lazy-load dashboards
const CustomerDashboard = dynamic(() => import('@/components/CustomerDashboard'), {
  loading: () => <DashboardSkeleton />,
  ssr: false,
});
const OwnerDashboard = dynamic(() => import('@/components/OwnerDashboard'), {
  loading: () => <DashboardSkeleton />,
  ssr: false,
});

function DashboardSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-40 bg-gray-200 rounded-2xl" />
      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => <div key={i} className="h-32 bg-gray-200 rounded-2xl" />)}
      </div>
      <div className="h-64 bg-gray-200 rounded-2xl" />
    </div>
  );
}

export default function HomePage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isAuthenticated, name, email, role } = useAppSelector((s) => s.auth);

  // Hydrate Redux from localStorage on mount
  useEffect(() => {
    dispatch(loadCredentials());
  }, [dispatch]);

  // Redirect to login if not authenticated after hydration
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.replace('/login');
    }
  }, [router]);



  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#f4f6f5' }}>
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin-slow"
            style={{ borderColor: '#027B51', borderTopColor: 'transparent' }}
          />
          <p className="text-gray-500 text-sm">Loading your dashboard…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: '#f4f6f5' }}>
      {/* ── Page Content ── */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Page Header */}
        <div className="mb-6">
          <p className="text-gray-500 text-sm">
            {email} ·{' '}
            <span className="capitalize font-medium" style={{ color: '#027B51' }}>
              {role} account
            </span>
          </p>
        </div>

        {/* Role-based lazy-loaded dashboard */}
        {role === 'owner'
          ? <OwnerDashboard name={name || 'there'} />
          : <CustomerDashboard name={name || 'there'} />
        }
      </main>
    </div>
  );
}
