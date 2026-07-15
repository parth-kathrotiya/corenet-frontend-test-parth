'use client';

import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { fetchServices } from '@/redux/slices/servicesSlice';
import { fetchOwnerBookings, fetchOwnerStats } from '@/redux/slices/bookingsSlice';

const STATUS_STYLE: Record<string, { bg: string; text: string; label: string }> = {
  confirmed: { bg: '#dcfce7', text: '#166534', label: 'Confirmed' },
  pending:   { bg: '#fef9c3', text: '#854d0e', label: 'Pending' },
  cancelled: { bg: '#fee2e2', text: '#991b1b', label: 'Cancelled' },
  completed: { bg: '#e0e7ff', text: '#3730a3', label: 'Completed' },
  noshow:    { bg: '#f3f4f6', text: '#374151', label: 'No-show' },
};

function formatDateTime(iso: string): { date: string; time: string } {
  const d = new Date(iso);
  const date = d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
  const time = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'UTC' });
  return { date, time };
}

function BookingSkeleton() {
  return (
    <div className="px-6 py-4 flex items-center gap-4 animate-pulse">
      <div className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-1/2 bg-gray-200 rounded" />
        <div className="h-3 w-1/3 bg-gray-200 rounded" />
      </div>
      <div className="space-y-1 text-right">
        <div className="h-4 w-16 bg-gray-200 rounded" />
        <div className="h-3 w-12 bg-gray-200 rounded" />
      </div>
      <div className="h-6 w-20 bg-gray-200 rounded-full" />
    </div>
  );
}

export default function OwnerDashboard({ name }: { name: string }) {
  const dispatch = useAppDispatch();
  const { token } = useAppSelector((s) => s.auth);
  const { items: services, loading: svLoading } = useAppSelector((s) => s.services);
  const { ownerBookings, ownerStats, loading: bkLoading } = useAppSelector((s) => s.bookings);

  useEffect(() => {
    if (!token) return;
    dispatch(fetchServices(token));
    dispatch(fetchOwnerBookings(token));
    dispatch(fetchOwnerStats(token));
  }, [token, dispatch]);

  const stats = [
    {
      label: "Today's Bookings",
      value: bkLoading ? '…' : String(ownerStats?.todayBookings ?? 0),
      icon: '📅',
      delta: 'Upcoming today',
    },
    {
      label: 'This Week',
      value: bkLoading ? '…' : String(ownerStats?.weekBookings ?? 0),
      icon: '📊',
      delta: 'Last 7 days',
    },
    {
      label: 'Total Revenue',
      value: bkLoading ? '…' : `₹${((ownerStats?.totalRevenue ?? 0) / 100).toFixed(0)}`,
      icon: '💰',
      delta: `₹${((ownerStats?.weekRevenue ?? 0) / 100).toFixed(0)} this week`,
    },
    {
      label: 'Active Services',
      value: svLoading ? '…' : String(ownerStats?.activeServices ?? services.length),
      icon: '⚡',
      delta: 'Live & bookable',
    },
  ];

  return (
    <div className="animate-fade-in">
      {/* Welcome Banner */}
      <div
        className="rounded-2xl p-8 mb-8 text-white relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0D1814 0%, #027B51 100%)' }}
      >
        <div className="relative z-10">
          <p className="text-green-200 text-sm font-medium mb-1">Business Dashboard 🏢</p>
          <h2 className="text-2xl font-bold mb-2">Welcome back, {name}!</h2>
          <p className="text-green-100 text-sm max-w-md">
            Manage your appointments, track revenue, and grow your business.
          </p>
        </div>
        <div className="absolute right-6 bottom-0 text-8xl opacity-10 select-none">💼</div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <div className="text-2xl mb-2">{s.icon}</div>
            <div className="text-2xl font-bold text-gray-900">{s.value}</div>
            <div className="text-sm text-gray-500 mt-0.5">{s.label}</div>
            <div className="text-xs mt-2 font-medium" style={{ color: '#027B51' }}>{s.delta}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Upcoming Bookings */}
        <div className="xl:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
            <h3 className="font-bold text-gray-900">Upcoming Bookings</h3>
            <span className="text-xs text-gray-400 bg-gray-50 px-3 py-1 rounded-full">
              {ownerBookings.length} upcoming
            </span>
          </div>
          <div className="divide-y divide-gray-50">
            {bkLoading ? (
              [1, 2, 3].map((i) => <BookingSkeleton key={i} />)
            ) : ownerBookings.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center px-6">
                <div className="text-5xl mb-3">📭</div>
                <p className="font-semibold text-gray-700 mb-1">No upcoming bookings</p>
                <p className="text-sm text-gray-400">Bookings from customers will appear here.</p>
              </div>
            ) : (
              ownerBookings.map((b) => {
                const st = STATUS_STYLE[b.status] ?? STATUS_STYLE.pending;
                const { date, time } = formatDateTime(b.start_time);
                const customerName = b.customer?.name ?? 'Customer';
                return (
                  <div
                    key={b.id}
                    className="px-6 py-4 flex items-center gap-4 hover:bg-gray-50/50 transition-colors"
                  >
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                      style={{ background: '#027B51' }}
                    >
                      {customerName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm truncate">{customerName}</p>
                      <p className="text-gray-500 text-xs">
                        {b.service?.name ?? 'Service'} · {b.service?.duration ?? '—'} min
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-medium text-gray-800">{time}</p>
                      <p className="text-xs text-gray-400">{date}</p>
                    </div>
                    <span
                      className="px-2.5 py-1 rounded-full text-xs font-semibold flex-shrink-0"
                      style={{ background: st.bg, color: st.text }}
                    >
                      {st.label}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* My Services */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
            <h3 className="font-bold text-gray-900">My Services</h3>
            <a
              href="/services"
              className="text-xs font-semibold px-3 py-1 rounded-full text-white"
              style={{ background: '#027B51' }}
            >
              Manage
            </a>
          </div>
          <div className="divide-y divide-gray-50">
            {svLoading ? (
              [1, 2, 3].map((i) => (
                <div key={i} className="px-6 py-4 animate-pulse">
                  <div className="h-4 w-2/3 bg-gray-200 rounded mb-2" />
                  <div className="flex gap-4">
                    <div className="h-3 w-16 bg-gray-200 rounded" />
                    <div className="h-3 w-16 bg-gray-200 rounded" />
                  </div>
                </div>
              ))
            ) : services.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center px-6">
                <div className="text-4xl mb-2">🛠️</div>
                <p className="text-sm text-gray-500">No services yet. Add one!</p>
              </div>
            ) : (
              services.map((s) => {
                const bookingCount = ownerBookings.filter((b) => b.service_id === s.id).length;
                return (
                  <div key={s.id} className="px-6 py-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-semibold text-sm text-gray-900 truncate">{s.name}</p>
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0 ml-2"
                        style={{ background: '#027B51' }}
                      />
                    </div>
                    <div className="flex gap-4 text-xs text-gray-500">
                      <span>📅 {bookingCount} upcoming</span>
                      <span>💰 ₹{(s.price / 100).toFixed(0)}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
