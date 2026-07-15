'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { loadCredentials, clearCredentials } from '@/redux/slices/authSlice';
import { addToast } from '@/redux/slices/toastSlice';
import NotificationBell from '@/components/NotificationBell';

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

  const handleLogout = () => {
    dispatch(clearCredentials());
    dispatch(addToast({ message: 'You have been logged out.', type: 'info' }));
    router.replace('/login');
  };

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
      {/* ── Navbar ── */}
      <nav className="sticky top-0 z-40 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: '#027B51' }}
              >
                <span className="text-white font-bold text-base">B</span>
              </div>
              <span className="font-bold text-xl tracking-tight" style={{ color: '#0D1814' }}>
                BookSlot
              </span>
            </Link>
          </div>

          {/* Nav Links */}
          <div className="hidden md:flex items-center gap-6">
            {role === 'customer' ? (
              <>
                <Link href="/browse" className="text-sm font-medium text-gray-600 hover:text-[#027B51] transition-colors">Browse Services</Link>
                <Link href="/bookings" className="text-sm font-medium text-gray-600 hover:text-[#027B51] transition-colors">My Bookings</Link>
              </>
            ) : (
              <>
                <Link href="/services" className="text-sm font-medium text-gray-600 hover:text-[#027B51] transition-colors">My Services</Link>
                <Link href="/availability" className="text-sm font-medium text-gray-600 hover:text-[#027B51] transition-colors">Availability</Link>
                <Link href="/bookings" className="text-sm font-medium text-gray-600 hover:text-[#027B51] transition-colors">Bookings</Link>
              </>
            )}
          </div>

          {/* User Menu */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-sm font-semibold text-gray-900">{name}</span>
              <span
                className="text-xs px-2 py-0.5 rounded-full capitalize font-medium"
                style={{
                  background: role === 'owner' ? '#dcfce7' : '#dbeafe',
                  color: role === 'owner' ? '#166534' : '#1e40af',
                }}
              >
                {role}
              </span>
            </div>

            {/* Avatar */}
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
              style={{ background: '#027B51' }}
            >
              {name ? name.charAt(0).toUpperCase() : '?'}
            </div>

            {/* Notification Bell */}
            <NotificationBell />

            <button
              id="logout-btn"
              onClick={handleLogout}
              className="ml-1 px-4 py-2 rounded-xl text-sm font-semibold border transition-all hover:bg-gray-50"
              style={{ borderColor: '#e5e7eb', color: '#555' }}
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

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
