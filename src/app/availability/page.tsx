'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { loadCredentials, clearCredentials } from '@/redux/slices/authSlice';
import { fetchServices, Service, AvailabilityException } from '@/redux/slices/servicesSlice';
import { addToast } from '@/redux/slices/toastSlice';
import NotificationBell from '@/components/NotificationBell';

const API = process.env.NEXT_PUBLIC_API_URL;

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAY_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function formatExceptionDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

function todayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function ensureYYYYMMDD(dateStr: string): string {
  if (!dateStr) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr;
  }
  if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) {
    const [d, m, y] = dateStr.split('-');
    return `${y}-${m}-${d}`;
  }
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
    const [d, m, y] = dateStr.split('/');
    return `${y}-${m}-${d}`;
  }
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
  return dateStr;
}

// ─── Add Exception Modal ──────────────────────────────────────────────────────
function AddExceptionModal({
  service,
  onClose,
  onAdded,
  token,
}: {
  service: Service;
  onClose: () => void;
  onAdded: () => void;
  token: string;
}) {
  const dispatch = useAppDispatch();
  const [date, setDate] = useState(todayISO());
  const [isWorking, setIsWorking] = useState(false);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!date) {
      dispatch(addToast({ message: 'Please select a date.', type: 'error' }));
      return;
    }
    if (isWorking && !startTime) {
      dispatch(addToast({ message: 'Please set a start time.', type: 'error' }));
      return;
    }
    if (isWorking && !endTime) {
      dispatch(addToast({ message: 'Please set an end time.', type: 'error' }));
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/api/services/${service.id}/exceptions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          date: ensureYYYYMMDD(date),
          is_working: isWorking,
          start_time: isWorking ? startTime : undefined,
          end_time: isWorking ? endTime : undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        dispatch(addToast({ message: data.message || 'Failed to add exception.', type: 'error' }));
        return;
      }
      dispatch(addToast({ message: 'Exception added successfully.', type: 'success' }));
      onAdded();
      onClose();
    } catch {
      dispatch(addToast({ message: 'Network error. Please try again.', type: 'error' }));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#0D1814]/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl border border-gray-100 animate-fade-in">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Add Availability Exception</h3>
            <p className="text-xs text-gray-400 mt-0.5 truncate max-w-xs">{service.name}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-all cursor-pointer text-sm"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          {/* Date */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Date</label>
            <input
              type="date"
              value={date}
              min={todayISO()}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#027B51] transition-all"
            />
          </div>

          {/* Day Type Toggle */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Type</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setIsWorking(false)}
                className="py-2.5 rounded-xl border text-sm font-semibold transition-all cursor-pointer"
                style={!isWorking
                  ? { background: '#fee2e2', borderColor: '#fca5a5', color: '#b91c1c' }
                  : { background: '#f9fafb', borderColor: '#e5e7eb', color: '#6b7280' }
                }
              >
                🚫 Day Off (Closed)
              </button>
              <button
                onClick={() => setIsWorking(true)}
                className="py-2.5 rounded-xl border text-sm font-semibold transition-all cursor-pointer"
                style={isWorking
                  ? { background: '#dcfce7', borderColor: '#86efac', color: '#166534' }
                  : { background: '#f9fafb', borderColor: '#e5e7eb', color: '#6b7280' }
                }
              >
                ✅ Working (Override)
              </button>
            </div>
          </div>

          {/* Working Hours (only if isWorking) */}
          {isWorking && (
            <div className="grid grid-cols-2 gap-3 p-4 rounded-xl bg-green-50 border border-green-100">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Start Time</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#027B51]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">End Time</label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#027B51]"
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            disabled={submitting}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50 transition-all cursor-pointer disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 py-2.5 rounded-xl font-semibold text-sm text-white transition-all cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
            style={{ background: '#027B51' }}
          >
            {submitting ? 'Adding…' : '✓ Add Exception'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────
function DeleteExceptionModal({
  exception,
  onConfirm,
  onCancel,
  loading,
}: {
  exception: AvailabilityException;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  return (
    <div className="fixed inset-0 bg-[#0D1814]/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-gray-100 animate-fade-in">
        <div className="text-center mb-4">
          <span className="text-4xl">🗓️</span>
        </div>
        <h3 className="text-lg font-bold text-gray-900 text-center mb-2">Remove Exception?</h3>
        <p className="text-gray-500 text-sm text-center mb-6">
          The exception for <strong className="text-gray-800">{formatExceptionDate(exception.date)}</strong> will be removed.
          Regular weekly schedule will apply for that day.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50 transition-all cursor-pointer"
          >
            Keep it
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-2 disabled:opacity-60 transition-all cursor-pointer"
            style={{ background: '#b91c1c' }}
          >
            {loading ? 'Removing…' : 'Remove'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Service Availability Card ─────────────────────────────────────────────────
function ServiceAvailabilityCard({
  service,
  token,
  onRefresh,
}: {
  service: Service;
  token: string;
  onRefresh: () => void;
}) {
  const dispatch = useAppDispatch();
  const [showAddModal, setShowAddModal] = useState(false);
  const [deletingException, setDeletingException] = useState<AvailabilityException | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const exceptions = service.exceptions ?? [];

  // Sort exceptions: upcoming first
  const sortedExceptions = [...exceptions].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const handleDeleteConfirm = async () => {
    if (!deletingException) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(
        `${API}/api/services/${service.id}/exceptions/${deletingException.id}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!res.ok) {
        const data = await res.json();
        dispatch(addToast({ message: data.message || 'Failed to remove exception.', type: 'error' }));
        return;
      }
      dispatch(addToast({ message: 'Exception removed.', type: 'info' }));
      setDeletingException(null);
      onRefresh();
    } catch {
      dispatch(addToast({ message: 'Network error.', type: 'error' }));
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Card Header */}
        <div
          className="px-6 py-5 flex items-center justify-between"
          style={{ borderBottom: '1px solid #f1f5f4' }}
        >
          <div>
            <h3 className="font-bold text-gray-900">{service.name}</h3>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-xs text-gray-400">⏱ {service.duration} min</span>
              <span className="text-xs text-gray-400">·</span>
              <span className="text-xs font-semibold" style={{ color: '#027B51' }}>
                ₹{(service.price / 100).toFixed(0)}
              </span>
            </div>
          </div>
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: '#dcfce7' }}
          >
            <span className="text-xl">📋</span>
          </div>
        </div>

        <div className="px-6 py-5 space-y-6">
          {/* Weekly Schedule */}
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase mb-3">Weekly Schedule</p>
            <div className="grid grid-cols-7 gap-1.5">
              {DAY_LABELS.map((label, idx) => {
                const avail = service.availabilities.find((a) => a.day_of_week === idx);
                const isWorking = avail?.is_working ?? false;
                const hours =
                  isWorking && avail?.start_time && avail?.end_time
                    ? `${avail.start_time}–${avail.end_time}`
                    : null;
                return (
                  <div key={idx} className="flex flex-col items-center gap-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase">{label}</span>
                    <div
                      className="w-full rounded-xl py-2 flex flex-col items-center gap-0.5 border"
                      style={
                        isWorking
                          ? { background: '#f0fdf4', borderColor: '#86efac' }
                          : { background: '#f9fafb', borderColor: '#e5e7eb' }
                      }
                    >
                      <span className="text-sm">{isWorking ? '✅' : '❌'}</span>
                      {hours && (
                        <span
                          className="text-[9px] font-semibold text-center leading-tight px-0.5"
                          style={{ color: '#166534' }}
                        >
                          {avail?.start_time}
                          <br />
                          {avail?.end_time}
                        </span>
                      )}
                      {!isWorking && (
                        <span className="text-[9px] text-gray-400">Off</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Exceptions */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold text-gray-400 uppercase">
                Exceptions ({sortedExceptions.length})
              </p>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white transition-all hover:opacity-90 cursor-pointer active:scale-95"
                style={{ background: '#027B51' }}
              >
                <span>+</span> Add Exception
              </button>
            </div>

            {sortedExceptions.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 py-6 text-center">
                <p className="text-gray-400 text-xs">No exceptions set.</p>
                <p className="text-gray-300 text-xs mt-0.5">Regular weekly schedule applies.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto">
                {sortedExceptions.map((ex) => {
                  const isPast = new Date(ex.date).getTime() < Date.now() - 86400000;
                  return (
                    <div
                      key={ex.id}
                      className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl border"
                      style={
                        ex.is_working
                          ? { background: '#f0fdf4', borderColor: '#bbf7d0' }
                          : { background: '#fff7f7', borderColor: '#fecaca' }
                      }
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-sm flex-shrink-0">{ex.is_working ? '✅' : '🚫'}</span>
                        <div className="min-w-0">
                          <p
                            className="text-xs font-semibold truncate"
                            style={{ color: isPast ? '#9ca3af' : '#1f2937' }}
                          >
                            {formatExceptionDate(ex.date)}
                            {isPast && <span className="ml-1 text-gray-400 font-normal">(past)</span>}
                          </p>
                          <p className="text-[10px] text-gray-500">
                            {ex.is_working
                              ? `Working: ${ex.start_time} – ${ex.end_time}`
                              : 'Closed / Day off'}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setDeletingException(ex)}
                        className="w-6 h-6 rounded-full bg-white border border-gray-200 flex items-center justify-center text-red-400 hover:bg-red-50 hover:border-red-200 transition-all cursor-pointer flex-shrink-0 text-[11px]"
                        title="Remove exception"
                      >
                        ✕
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {showAddModal && (
        <AddExceptionModal
          service={service}
          token={token}
          onClose={() => setShowAddModal(false)}
          onAdded={onRefresh}
        />
      )}
      {deletingException && (
        <DeleteExceptionModal
          exception={deletingException}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeletingException(null)}
          loading={deleteLoading}
        />
      )}
    </>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function AvailabilityPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { isAuthenticated, name, role, token } = useAppSelector((s) => s.auth);
  const { items: services, loading: svLoading } = useAppSelector((s) => s.services);

  useEffect(() => {
    dispatch(loadCredentials());
  }, [dispatch]);

  useEffect(() => {
    const t = localStorage.getItem('token');
    const r = localStorage.getItem('role');
    if (!t) { router.replace('/login'); return; }
    if (r !== 'owner') { router.replace('/'); }
  }, [router]);

  useEffect(() => {
    if (token) {
      dispatch(fetchServices(token));
    }
  }, [token, dispatch]);

  const handleRefresh = useCallback(() => {
    if (token) dispatch(fetchServices(token));
  }, [token, dispatch]);

  const handleLogout = () => {
    dispatch(clearCredentials());
    dispatch(addToast({ message: 'You have been logged out.', type: 'info' }));
    router.replace('/login');
  };

  if (!isAuthenticated || role !== 'owner') {
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

  return (
    <div className="min-h-screen" style={{ background: '#f4f6f5' }}>
      {/* Navbar */}
      <nav className="sticky top-0 z-40 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
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

          <div className="hidden md:flex items-center gap-6">
            <Link href="/services" className="text-sm font-medium text-gray-500 hover:text-[#027B51] transition-colors">
              My Services
            </Link>
            <Link href="/availability" className="text-sm font-semibold transition-colors" style={{ color: '#027B51' }}>
              Availability
            </Link>
            <Link href="/bookings" className="text-sm font-medium text-gray-500 hover:text-[#027B51] transition-colors">
              Bookings
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-sm font-semibold text-gray-900">{name}</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-800 font-medium capitalize">
                {role}
              </span>
            </div>
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
              style={{ background: '#027B51' }}
            >
              {name ? name.charAt(0).toUpperCase() : 'O'}
            </div>
            <NotificationBell />
            <button
              onClick={handleLogout}
              className="ml-1 px-4 py-2 rounded-xl text-sm font-semibold border transition-all hover:bg-gray-50 cursor-pointer"
              style={{ borderColor: '#e5e7eb', color: '#555' }}
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Page Header */}
        <div
          className="rounded-2xl p-8 mb-8 text-white relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #0D1814 0%, #027B51 100%)' }}
        >
          <div className="relative z-10">
            <p className="text-green-200 text-sm font-medium mb-1">Owner Tools 🛠️</p>
            <h1 className="text-2xl font-bold mb-2">Availability Management</h1>
            <p className="text-green-100 text-sm max-w-lg">
              View and manage working hours for each service. Add date-specific exceptions
              to override your regular weekly schedule — for holidays, special events, or extra hours.
            </p>
          </div>
          <div className="absolute right-8 bottom-0 text-8xl opacity-10 select-none">🗓️</div>
        </div>

        {/* Services */}
        {svLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[1, 2].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6 animate-pulse space-y-4">
                <div className="h-5 w-1/3 bg-gray-200 rounded" />
                <div className="h-4 w-1/4 bg-gray-200 rounded" />
                <div className="grid grid-cols-7 gap-1">
                  {[...Array(7)].map((_, j) => (
                    <div key={j} className="h-16 bg-gray-200 rounded-xl" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : services.length === 0 ? (
          <div className="bg-white rounded-2xl p-16 text-center border border-gray-100 shadow-sm max-w-lg mx-auto">
            <span className="text-5xl block mb-4">🛠️</span>
            <h3 className="text-lg font-bold text-gray-900 mb-2">No services yet</h3>
            <p className="text-gray-500 text-sm mb-6">
              Create your first service to manage its availability.
            </p>
            <Link
              href="/services"
              className="inline-block px-6 py-3 rounded-xl text-white text-sm font-bold shadow transition-all hover:opacity-90"
              style={{ background: '#027B51' }}
            >
              Go to My Services
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {services.map((service) => (
              <ServiceAvailabilityCard
                key={service.id}
                service={service}
                token={token ?? ''}
                onRefresh={handleRefresh}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
