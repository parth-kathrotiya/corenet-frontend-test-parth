'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { loadCredentials } from '@/redux/slices/authSlice';
import {
  fetchMyBookings,
  cancelBooking,
  fetchAllOwnerBookings,
  cancelOwnerBooking,
  updateOwnerBookingStatus,
  Booking,
} from '@/redux/slices/bookingsSlice';
import { fetchServices } from '@/redux/slices/servicesSlice';
import { addToast } from '@/redux/slices/toastSlice';

const STATUS_STYLE: Record<string, { bg: string; text: string; label: string }> = {
  confirmed: { bg: '#dcfce7', text: '#166534', label: 'Confirmed' },
  pending:   { bg: '#fef9c3', text: '#854d0e', label: 'Pending' },
  cancelled: { bg: '#fee2e2', text: '#991b1b', label: 'Cancelled' },
  completed: { bg: '#e0e7ff', text: '#3730a3', label: 'Completed' },
  noshow:    { bg: '#f3f4f6', text: '#374151', label: 'No-show' },
};

function formatDateYYYYMMDD(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatBookingTime(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
    timeZone: 'UTC',
  });
}

function BookingSkeleton() {
  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100 animate-pulse space-y-3 shadow-sm">
      <div className="flex justify-between">
        <div className="h-5 w-1/3 bg-gray-200 rounded" />
        <div className="h-5 w-16 bg-gray-200 rounded-full" />
      </div>
      <div className="h-4 w-1/4 bg-gray-200 rounded" />
      <div className="h-4 w-1/2 bg-gray-200 rounded" />
    </div>
  );
}

// ─── Cancel Confirmation Modal ─────────────────────────────────────────────────
function CancelConfirmModal({
  booking,
  role,
  onConfirm,
  onCancel,
  loading,
}: {
  booking: Booking;
  role: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const isOwner = role === 'owner';
  return (
    <div className="fixed inset-0 bg-[#0D1814]/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl animate-fade-in border border-gray-100">
        <div className="text-center mb-5">
          <span className="text-4xl">🗑️</span>
        </div>
        <h3 className="text-lg font-bold text-gray-900 text-center mb-2">Cancel Appointment?</h3>
        <p className="text-gray-500 text-sm text-center mb-1">
          Are you sure you want to cancel{' '}
          <strong className="text-gray-800">&ldquo;{booking.service?.name}&rdquo;</strong>?
        </p>
        {isOwner && (
          <p className="text-orange-600 text-xs text-center mb-4">
            ⚠️ The customer will be notified of this cancellation.
          </p>
        )}
        <div className="flex gap-3 mt-4">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50 transition-all cursor-pointer"
          >
            No, Keep it
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-2 disabled:opacity-60 transition-all cursor-pointer"
            style={{ background: '#b91c1c' }}
          >
            {loading ? 'Cancelling…' : 'Yes, Cancel'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Customer Booking Card ─────────────────────────────────────────────────────
function CustomerBookingCard({
  booking,
  onCancel,
  actionLoading,
}: {
  booking: Booking;
  onCancel: (b: Booking) => void;
  actionLoading: boolean;
}) {
  const style = STATUS_STYLE[booking.status] || { bg: '#f3f4f6', text: '#374151', label: booking.status };
  const canCancel =
    ['pending', 'confirmed'].includes(booking.status) &&
    new Date(booking.start_time) > new Date();

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group hover:-translate-y-0.5 duration-200">
      <div>
        <div className="flex justify-between items-start mb-4">
          <span
            className="px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider"
            style={{ background: style.bg, color: style.text }}
          >
            {style.label}
          </span>
          <span className="text-base font-black" style={{ color: '#027B51' }}>
            ₹{booking.service ? (booking.service.price / 100).toFixed(0) : '—'}
          </span>
        </div>

        <h3 className="font-extrabold text-gray-900 text-lg mb-1 group-hover:text-[#027B51] transition-colors">
          {booking.service?.name ?? 'Deleted Service'}
        </h3>
        <p className="text-xs text-gray-400 mb-4">By {booking.owner?.name ?? '—'}</p>

        <div className="space-y-2 text-xs text-gray-600 border-t border-gray-50 pt-4">
          <div className="flex items-center gap-2">
            <span>🕒 Slot</span>
            <span className="font-semibold text-gray-800">{formatBookingTime(booking.start_time)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span>⏱ Duration</span>
            <span>{booking.service?.duration ?? '—'} min</span>
          </div>
        </div>
      </div>

      {canCancel && (
        <div className="mt-6 pt-4 border-t border-gray-50">
          <button
            disabled={actionLoading}
            onClick={() => onCancel(booking)}
            className="w-full py-2.5 rounded-xl border border-red-200 text-red-600 text-xs font-bold hover:bg-red-50 hover:border-red-300 transition-all cursor-pointer disabled:opacity-50"
          >
            Cancel Appointment
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Owner Booking Card ────────────────────────────────────────────────────────
function OwnerBookingCard({
  booking,
  onCancel,
  onUpdateStatus,
  actionLoading,
}: {
  booking: Booking;
  onCancel: (b: Booking) => void;
  onUpdateStatus: (bookingId: string, status: string) => void;
  actionLoading: boolean;
}) {
  const style = STATUS_STYLE[booking.status] || { bg: '#f3f4f6', text: '#374151', label: booking.status };
  const now = new Date();
  const isFuture = new Date(booking.start_time) > now;
  const customerName = booking.customer?.name ?? 'Customer';

  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group hover:-translate-y-0.5 duration-200">
      <div>
        {/* Customer + Status */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
              style={{ background: '#027B51' }}
            >
              {customerName.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-bold text-gray-900 text-sm">{customerName}</p>
              <p className="text-xs text-gray-400">{booking.customer?.email ?? '—'}</p>
            </div>
          </div>
          <span
            className="px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider flex-shrink-0 ml-2"
            style={{ background: style.bg, color: style.text }}
          >
            {style.label}
          </span>
        </div>

        {/* Service Info */}
        <div className="space-y-2 border-t border-gray-50 pt-3 mt-3">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-gray-800 text-sm group-hover:text-[#027B51] transition-colors truncate">
              {booking.service?.name ?? 'Deleted Service'}
            </p>
            <span className="text-sm font-black flex-shrink-0 ml-2" style={{ color: '#027B51' }}>
              ₹{booking.service ? (booking.service.price / 100).toFixed(0) : '—'}
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span>🕒 {formatBookingTime(booking.start_time)}</span>
            <span>·</span>
            <span>⏱ {booking.service?.duration ?? '—'} min</span>
          </div>
        </div>
      </div>

      {/* Dynamic Actions based on Status & Time */}
      <div className="mt-4 pt-3 border-t border-gray-50 flex gap-2">
        {booking.status === 'pending' && (
          <>
            <button
              disabled={actionLoading}
              onClick={() => onUpdateStatus(booking.id, 'confirmed')}
              className="flex-1 py-2 rounded-xl bg-[#027B51] text-white text-xs font-bold hover:bg-[#026442] transition-all cursor-pointer disabled:opacity-50 text-center"
            >
              Confirm
            </button>
            <button
              disabled={actionLoading}
              onClick={() => onCancel(booking)}
              className="flex-1 py-2 rounded-xl border border-red-200 text-red-600 text-xs font-bold hover:bg-red-50 hover:border-red-300 transition-all cursor-pointer disabled:opacity-50 text-center"
            >
              Cancel
            </button>
          </>
        )}

        {booking.status === 'confirmed' && isFuture && (
          <button
            disabled={actionLoading}
            onClick={() => onCancel(booking)}
            className="w-full py-2.5 rounded-xl border border-red-200 text-red-600 text-xs font-bold hover:bg-red-50 hover:border-red-300 transition-all cursor-pointer disabled:opacity-50 text-center"
          >
            Cancel Booking
          </button>
        )}

        {booking.status === 'confirmed' && !isFuture && (
          <>
            <button
              disabled={actionLoading}
              onClick={() => onUpdateStatus(booking.id, 'completed')}
              className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-all cursor-pointer disabled:opacity-50 text-center"
            >
              Complete
            </button>
            <button
              disabled={actionLoading}
              onClick={() => onUpdateStatus(booking.id, 'noshow')}
              className="flex-1 py-2.5 rounded-xl border border-gray-300 text-gray-700 text-xs font-bold hover:bg-gray-50 transition-all cursor-pointer disabled:opacity-50 text-center"
            >
              No-Show
            </button>
          </>
        )}

        {['cancelled', 'completed', 'noshow'].includes(booking.status) && (
          <span className="w-full py-1 text-center text-xs text-gray-400 italic font-medium">
            No further actions available
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function BookingsPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { isAuthenticated, name, role, token } = useAppSelector((s) => s.auth);
  const {
    customerBookings,
    customerBookingsLoading,
    ownerAllBookings,
    ownerAllBookingsLoading,
    loading: actionLoading,
  } = useAppSelector((s) => s.bookings);
  const { items: services } = useAppSelector((s) => s.services);

  // Filters
  const [filterDate, setFilterDate] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterService, setFilterService] = useState('All');
  const [filterCustomer, setFilterCustomer] = useState('');
  const [filterOwner, setFilterOwner] = useState('All');

  // Cancel modal
  const [cancellingBooking, setCancellingBooking] = useState<Booking | null>(null);
  const [cancellingLoading, setCancellingLoading] = useState(false);

  useEffect(() => {
    dispatch(loadCredentials());
  }, [dispatch]);

  useEffect(() => {
    const t = localStorage.getItem('token');
    if (!t) { router.replace('/login'); }
  }, [router]);

  useEffect(() => {
    if (!token) return;
    if (role === 'customer') {
      dispatch(fetchMyBookings({ token }));
    } else if (role === 'owner') {
      dispatch(fetchAllOwnerBookings(token));
      dispatch(fetchServices(token));
    }
  }, [token, role, dispatch]);


  // ── Customer Filters ───────────────────────────────────────────────────────
  const uniqueOwners = Array.from(
    new Set(customerBookings.map((b) => b.owner?.name).filter((n): n is string => !!n))
  );
  const uniqueCustomerServices = Array.from(
    new Set(customerBookings.map((b) => b.service?.name).filter((n): n is string => !!n))
  );

  const filteredCustomerBookings = customerBookings.filter((b) => {
    const dateStr = formatDateYYYYMMDD(new Date(b.start_time));
    return (
      (!filterDate || dateStr === filterDate) &&
      (filterStatus === 'All' || b.status === filterStatus) &&
      (filterOwner === 'All' || b.owner?.name === filterOwner) &&
      (filterService === 'All' || b.service?.name === filterService)
    );
  });

  // ── Owner Filters ──────────────────────────────────────────────────────────
  const uniqueOwnerServices = Array.from(
    new Set(ownerAllBookings.map((b) => b.service?.name).filter((n): n is string => !!n))
  );

  const filteredOwnerBookings = ownerAllBookings.filter((b) => {
    const dateStr = formatDateYYYYMMDD(new Date(b.start_time));
    const customerMatch =
      !filterCustomer ||
      (b.customer?.name ?? '').toLowerCase().includes(filterCustomer.toLowerCase()) ||
      (b.customer?.email ?? '').toLowerCase().includes(filterCustomer.toLowerCase());
    return (
      (!filterDate || dateStr === filterDate) &&
      (filterStatus === 'All' || b.status === filterStatus) &&
      (filterService === 'All' || b.service?.name === filterService) &&
      customerMatch
    );
  });

  // ── Cancel handlers ────────────────────────────────────────────────────────
  const handleCancelConfirm = async () => {
    if (!token || !cancellingBooking) return;
    setCancellingLoading(true);
    try {
      const action =
        role === 'owner'
          ? cancelOwnerBooking({ token, bookingId: cancellingBooking.id })
          : cancelBooking({ token, bookingId: cancellingBooking.id });
      const result = await dispatch(action as any);
      const isSuccess =
        role === 'owner'
          ? cancelOwnerBooking.fulfilled.match(result)
          : cancelBooking.fulfilled.match(result);
      if (isSuccess) {
        dispatch(addToast({ message: 'Booking cancelled successfully.', type: 'info' }));
        setCancellingBooking(null);
        if (role === 'customer') dispatch(fetchMyBookings({ token }));
        else dispatch(fetchAllOwnerBookings(token));
      } else {
        const msg = (result.payload as string) || 'Failed to cancel booking.';
        dispatch(addToast({ message: msg, type: 'error' }));
      }
    } finally {
      setCancellingLoading(false);
    }
  };

  const handleUpdateStatus = async (bookingId: string, status: string) => {
    if (!token) return;
    try {
      const result = await dispatch(updateOwnerBookingStatus({ token, bookingId, status }));
      if (updateOwnerBookingStatus.fulfilled.match(result)) {
        dispatch(addToast({ message: `Booking status updated to ${status}.`, type: 'success' }));
        dispatch(fetchAllOwnerBookings(token));
      } else {
        const msg = (result.payload as string) || 'Failed to update booking status.';
        dispatch(addToast({ message: msg, type: 'error' }));
      }
    } catch {
      dispatch(addToast({ message: 'An error occurred.', type: 'error' }));
    }
  };

  const clearAllFilters = () => {
    setFilterDate('');
    setFilterStatus('All');
    setFilterService('All');
    setFilterCustomer('');
    setFilterOwner('All');
  };

  const hasActiveFilters =
    filterDate ||
    filterStatus !== 'All' ||
    filterService !== 'All' ||
    filterCustomer ||
    filterOwner !== 'All';

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#f4f6f5' }}>
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-12 h-12 border-4 rounded-full animate-spin"
            style={{ borderColor: '#027B51', borderTopColor: 'transparent' }}
          />
          <p className="text-gray-500 text-sm">Loading…</p>
        </div>
      </div>
    );
  }

  const isOwner = role === 'owner';
  const isLoading = isOwner ? ownerAllBookingsLoading : customerBookingsLoading;
  const displayedBookings = isOwner ? filteredOwnerBookings : filteredCustomerBookings;
  const totalBookings = isOwner ? ownerAllBookings.length : customerBookings.length;

  // Stats for owner
  const ownerStats = isOwner
    ? {
        total: ownerAllBookings.length,
        upcoming: ownerAllBookings.filter(
          (b) => ['pending', 'confirmed'].includes(b.status) && new Date(b.start_time) > new Date()
        ).length,
        today: ownerAllBookings.filter((b) => {
          const d = new Date(b.start_time);
          const now = new Date();
          return (
            d.getUTCFullYear() === now.getUTCFullYear() &&
            d.getUTCMonth() === now.getUTCMonth() &&
            d.getUTCDate() === now.getUTCDate()
          );
        }).length,
        revenue: ownerAllBookings
          .filter((b) => ['confirmed', 'completed'].includes(b.status))
          .reduce((sum, b) => sum + (b.service?.price ?? 0), 0),
      }
    : null;

  return (
    <div className="min-h-screen" style={{ background: '#f4f6f5' }}>
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            {isOwner ? 'Bookings Management' : 'My Bookings'}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {isOwner
              ? 'View and manage all customer bookings for your services.'
              : 'View, filter, and manage your booked appointments.'}
          </p>
        </div>

        {/* Owner Stats Row */}
        {isOwner && ownerStats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Bookings', value: ownerStats.total, icon: '📋', color: '#6366f1' },
              { label: 'Upcoming', value: ownerStats.upcoming, icon: '📅', color: '#027B51' },
              { label: "Today's Bookings", value: ownerStats.today, icon: '⚡', color: '#d97706' },
              { label: 'Total Revenue', value: `₹${(ownerStats.revenue / 100).toFixed(0)}`, icon: '💰', color: '#027B51' },
            ].map((stat) => (
              <div
                key={stat.label}
                className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm"
              >
                <div className="text-2xl mb-2">{stat.icon}</div>
                <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                <div className="text-xs text-gray-500 mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Filters Panel */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h3 className="text-sm font-bold text-gray-900 mb-4">Filter Bookings</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Date */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase mb-1.5">Date</label>
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#027B51] transition-all"
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase mb-1.5">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#027B51] transition-all"
              >
                <option value="All">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="cancelled">Cancelled</option>
                <option value="completed">Completed</option>
                <option value="noshow">No-show</option>
              </select>
            </div>

            {/* Service */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase mb-1.5">Service</label>
              <select
                value={filterService}
                onChange={(e) => setFilterService(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#027B51] transition-all"
              >
                <option value="All">All Services</option>
                {(isOwner ? uniqueOwnerServices : uniqueCustomerServices).map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* Customer search (owner) OR Provider (customer) */}
            {isOwner ? (
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase mb-1.5">Customer</label>
                <input
                  type="text"
                  placeholder="Search name or email…"
                  value={filterCustomer}
                  onChange={(e) => setFilterCustomer(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#027B51] transition-all"
                />
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase mb-1.5">Provider</label>
                <select
                  value={filterOwner}
                  onChange={(e) => setFilterOwner(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#027B51] transition-all"
                >
                  <option value="All">All Providers</option>
                  {uniqueOwners.map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Results count + clear */}
          <div className="flex items-center justify-between mt-4">
            <p className="text-xs text-gray-400">
              Showing{' '}
              <span className="font-semibold text-gray-700">{displayedBookings.length}</span>
              {' '}of{' '}
              <span className="font-semibold text-gray-700">{totalBookings}</span> bookings
            </p>
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="text-xs font-bold text-[#027B51] hover:underline cursor-pointer flex items-center gap-1"
              >
                ✕ Clear filters
              </button>
            )}
          </div>
        </div>

        {/* Bookings Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => <BookingSkeleton key={i} />)}
          </div>
        ) : displayedBookings.length === 0 ? (
          <div className="bg-white rounded-2xl p-16 text-center border border-gray-100 shadow-sm max-w-lg mx-auto">
            <span className="text-5xl block mb-4">📅</span>
            <h3 className="text-lg font-bold text-gray-900 mb-2">No bookings found</h3>
            <p className="text-gray-500 text-sm">
              {totalBookings === 0
                ? isOwner
                  ? 'No customers have booked your services yet.'
                  : "You haven't scheduled any services yet."
                : 'No bookings match your selected filters.'}
            </p>
            {totalBookings === 0 && !isOwner && (
              <button
                onClick={() => router.push('/browse')}
                className="mt-6 px-5 py-3 text-white rounded-xl text-sm font-bold shadow transition-all hover:opacity-90 cursor-pointer"
                style={{ background: '#027B51' }}
              >
                Book Your First Service
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedBookings.map((b) =>
              isOwner ? (
                <OwnerBookingCard
                  key={b.id}
                  booking={b}
                  onCancel={setCancellingBooking}
                  onUpdateStatus={handleUpdateStatus}
                  actionLoading={actionLoading}
                />
              ) : (
                <CustomerBookingCard
                  key={b.id}
                  booking={b}
                  onCancel={setCancellingBooking}
                  actionLoading={actionLoading}
                />
              )
            )}
          </div>
        )}
      </main>

      {/* Cancel Modal */}
      {cancellingBooking && (
        <CancelConfirmModal
          booking={cancellingBooking}
          role={role ?? 'customer'}
          onConfirm={handleCancelConfirm}
          onCancel={() => setCancellingBooking(null)}
          loading={cancellingLoading}
        />
      )}
    </div>
  );
}
