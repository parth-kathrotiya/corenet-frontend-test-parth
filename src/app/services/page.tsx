'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { loadCredentials, clearCredentials } from '@/redux/slices/authSlice';
import {
  fetchServices,
  createService,
  updateService,
  archiveService,
  Service,
} from '@/redux/slices/servicesSlice';
import { addToast } from '@/redux/slices/toastSlice';

interface DayState {
  day_of_week: number;
  label: string;
  is_working: boolean;
  start_time: string;
  end_time: string;
}

const DEFAULT_DAYS: DayState[] = [
  { day_of_week: 0, label: 'Sunday',    is_working: false, start_time: '09:00', end_time: '17:00' },
  { day_of_week: 1, label: 'Monday',    is_working: true,  start_time: '09:00', end_time: '17:00' },
  { day_of_week: 2, label: 'Tuesday',   is_working: true,  start_time: '09:00', end_time: '17:00' },
  { day_of_week: 3, label: 'Wednesday', is_working: true,  start_time: '09:00', end_time: '17:00' },
  { day_of_week: 4, label: 'Thursday',  is_working: true,  start_time: '09:00', end_time: '17:00' },
  { day_of_week: 5, label: 'Friday',    is_working: true,  start_time: '09:00', end_time: '17:00' },
  { day_of_week: 6, label: 'Saturday',  is_working: false, start_time: '09:00', end_time: '17:00' },
];

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const WEEKDAYS_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function buildDaysFromService(service: Service): DayState[] {
  return DEFAULT_DAYS.map((d) => {
    const found = service.availabilities.find((a) => a.day_of_week === d.day_of_week);
    if (found) {
      return {
        ...d,
        is_working: found.is_working,
        start_time: found.start_time || '09:00',
        end_time: found.end_time || '17:00',
      };
    }
    return d;
  });
}

// ─── Archiving Confirmation Modal ─────────────────────────────────────────────
function ArchiveConfirmModal({
  service,
  onConfirm,
  onCancel,
  loading,
}: {
  service: Service;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  return (
    <div className="fixed inset-0 bg-[#0D1814]/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl animate-fade-in border border-gray-100">
        <div className="text-center mb-5">
          <span className="text-4xl">📦</span>
        </div>
        <h3 className="text-lg font-bold text-gray-900 text-center mb-2">Archive Service?</h3>
        <p className="text-gray-500 text-sm text-center mb-6">
          <strong className="text-gray-800">&ldquo;{service.name}&rdquo;</strong> will be hidden from
          customers. Existing bookings won&apos;t be affected.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50 transition-all"
          >
            Keep Active
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-2 disabled:opacity-60 transition-all"
            style={{ background: '#b91c1c' }}
          >
            {loading ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin-slow" />
                Archiving…
              </>
            ) : (
              'Archive It'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Service Form Modal (Create / Edit) ───────────────────────────────────────
function ServiceFormModal({
  mode,
  service,
  onClose,
  onSubmit,
  submitting,
}: {
  mode: 'create' | 'edit';
  service?: Service;
  onClose: () => void;
  onSubmit: (data: { name: string; duration: number; price: number; availabilities: any[] }) => void;
  submitting: boolean;
}) {
  const [nameInput, setNameInput] = useState(service?.name ?? '');
  const [durationInput, setDurationInput] = useState(String(service?.duration ?? 30));
  const [priceInput, setPriceInput] = useState(service ? String(service.price / 100) : '500');
  const [days, setDays] = useState<DayState[]>(
    service ? buildDaysFromService(service) : DEFAULT_DAYS
  );

  const toggleDay = (dayIndex: number) =>
    setDays((prev) =>
      prev.map((d) => (d.day_of_week === dayIndex ? { ...d, is_working: !d.is_working } : d))
    );

  const changeTime = (dayIndex: number, field: 'start_time' | 'end_time', value: string) =>
    setDays((prev) =>
      prev.map((d) => (d.day_of_week === dayIndex ? { ...d, [field]: value } : d))
    );

  const dispatch = useAppDispatch();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const name = nameInput.trim();
    const duration = parseInt(durationInput);
    const priceRupees = parseFloat(priceInput);

    if (!name) { dispatch(addToast({ message: 'Service name is required.', type: 'error' })); return; }
    if (isNaN(duration) || duration <= 0) { dispatch(addToast({ message: 'Duration must be a positive number.', type: 'error' })); return; }
    if (isNaN(priceRupees) || priceRupees < 0) { dispatch(addToast({ message: 'Price must be valid.', type: 'error' })); return; }

    onSubmit({
      name,
      duration,
      price: Math.round(priceRupees * 100),
      availabilities: days.map((d) => ({
        day_of_week: d.day_of_week,
        is_working: d.is_working,
        start_time: d.is_working ? d.start_time : undefined,
        end_time: d.is_working ? d.end_time : undefined,
      })),
    });
  };

  return (
    <div className="fixed inset-0 bg-[#0D1814]/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl animate-fade-in border border-gray-100">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-gray-100 pb-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {mode === 'create' ? 'Create New Service' : 'Edit Service'}
            </h2>
            <p className="text-gray-500 text-sm mt-0.5">
              {mode === 'create' ? 'Set up a new service and its operating schedule.' : 'Update the service details and availability.'}
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            className="text-gray-400 hover:text-gray-600 text-xl font-bold p-1 transition-colors"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Service Name</label>
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="e.g. Classic Haircut, Consultation"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#027B51]"
                disabled={submitting}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Duration (minutes)</label>
              <input
                type="number"
                value={durationInput}
                onChange={(e) => setDurationInput(e.target.value)}
                min="1"
                placeholder="30"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#027B51]"
                disabled={submitting}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Price (₹ Rupees)</label>
              <input
                type="number"
                value={priceInput}
                onChange={(e) => setPriceInput(e.target.value)}
                min="0"
                step="0.01"
                placeholder="500"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#027B51]"
                disabled={submitting}
              />
            </div>
          </div>

          {/* Weekly schedule */}
          <div>
            <h3 className="text-sm font-bold text-gray-900 mb-3 border-t border-gray-100 pt-4">
              Weekly Operating Schedule
            </h3>
            <div className="space-y-3">
              {days.map((day) => (
                <div
                  key={day.day_of_week}
                  className="flex flex-col sm:flex-row sm:items-center gap-3 p-3.5 rounded-xl border border-gray-100 transition-colors"
                  style={{ background: day.is_working ? '#f0fdf4' : '#f9fafb' }}
                >
                  <div className="flex items-center gap-3 min-w-[140px]">
                    <input
                      type="checkbox"
                      id={`day-${day.day_of_week}`}
                      checked={day.is_working}
                      onChange={() => toggleDay(day.day_of_week)}
                      className="w-5 h-5 rounded border-gray-300 cursor-pointer accent-[#027B51]"
                      disabled={submitting}
                    />
                    <label
                      htmlFor={`day-${day.day_of_week}`}
                      className="text-sm font-semibold cursor-pointer select-none"
                      style={{ color: day.is_working ? '#027B51' : '#6b7280' }}
                    >
                      {day.label}
                    </label>
                  </div>

                  {day.is_working ? (
                    <div className="flex items-center gap-2 animate-fade-in">
                      <input
                        type="time"
                        value={day.start_time}
                        onChange={(e) => changeTime(day.day_of_week, 'start_time', e.target.value)}
                        className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#027B51]"
                        disabled={submitting}
                      />
                      <span className="text-xs text-gray-400 font-medium">to</span>
                      <input
                        type="time"
                        value={day.end_time}
                        onChange={(e) => changeTime(day.day_of_week, 'end_time', e.target.value)}
                        className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#027B51]"
                        disabled={submitting}
                      />
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400 italic">Closed / Not available</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-5 py-3 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-3 rounded-xl font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-60 transition-all cursor-pointer"
              style={{ background: '#027B51' }}
            >
              {submitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin-slow" />
                  {mode === 'create' ? 'Creating…' : 'Saving…'}
                </>
              ) : mode === 'create' ? 'Create Service' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function MyServicesPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isAuthenticated, name, role, token } = useAppSelector((s) => s.auth);
  const { items: services, loading, error } = useAppSelector((s) => s.services);

  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [archivingService, setArchivingService] = useState<Service | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [archiving, setArchiving] = useState(false);

  useEffect(() => { dispatch(loadCredentials()); }, [dispatch]);

  useEffect(() => {
    const t = localStorage.getItem('token');
    const r = localStorage.getItem('role');
    if (!t) { router.replace('/login'); return; }
    if (r !== 'owner') { router.replace('/'); }
  }, [router]);

  useEffect(() => {
    if (token) dispatch(fetchServices(token));
  }, [token, dispatch]);

  const handleLogout = () => {
    dispatch(clearCredentials());
    dispatch(addToast({ message: 'You have been logged out.', type: 'info' }));
    router.replace('/login');
  };

  const openCreate = () => { setEditingService(null); setModalMode('create'); };
  const openEdit = (s: Service) => { setEditingService(s); setModalMode('edit'); };
  const closeModal = () => { setModalMode(null); setEditingService(null); };

  const handleFormSubmit = async (data: { name: string; duration: number; price: number; availabilities: any[] }) => {
    if (!token) return;
    setSubmitting(true);
    try {
      if (modalMode === 'create') {
        const res = await dispatch(createService({ token, serviceData: data }));
        if (createService.fulfilled.match(res)) {
          dispatch(addToast({ message: 'Service created successfully!', type: 'success' }));
          closeModal();
        } else {
          dispatch(addToast({ message: (res.payload as string) || 'Failed to create.', type: 'error' }));
        }
      } else if (modalMode === 'edit' && editingService) {
        const res = await dispatch(updateService({ token, id: editingService.id, serviceData: data }));
        if (updateService.fulfilled.match(res)) {
          dispatch(addToast({ message: 'Service updated successfully!', type: 'success' }));
          closeModal();
        } else {
          dispatch(addToast({ message: (res.payload as string) || 'Failed to update.', type: 'error' }));
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleArchiveConfirm = async () => {
    if (!token || !archivingService) return;
    setArchiving(true);
    try {
      const res = await dispatch(archiveService({ token, id: archivingService.id }));
      if (archiveService.fulfilled.match(res)) {
        dispatch(addToast({ message: `"${archivingService.name}" archived successfully.`, type: 'success' }));
        setArchivingService(null);
      } else {
        dispatch(addToast({ message: (res.payload as string) || 'Failed to archive.', type: 'error' }));
      }
    } finally {
      setArchiving(false);
    }
  };

  if (!isAuthenticated || role !== 'owner') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#f4f6f5' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin-slow" style={{ borderColor: '#027B51', borderTopColor: 'transparent' }} />
          <p className="text-gray-500 text-sm">Loading…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: '#f4f6f5' }}>
      {/* ── Navbar ── */}
      <nav className="sticky top-0 z-40 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#027B51' }}>
              <span className="text-white font-bold text-base">B</span>
            </div>
            <span className="font-bold text-xl tracking-tight" style={{ color: '#0D1814' }}>BookSlot</span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            <Link href="/services" className="text-sm font-semibold transition-colors" style={{ color: '#027B51' }}>My Services</Link>
            <a href="#" className="text-sm font-medium text-gray-500 hover:text-[#027B51] transition-colors">Availability</a>
            <a href="#" className="text-sm font-medium text-gray-500 hover:text-[#027B51] transition-colors">Bookings</a>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-sm font-semibold text-gray-900">{name}</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-[#dcfce7] text-[#166534] font-medium">Owner</span>
            </div>
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0" style={{ background: '#027B51' }}>
              {name ? name.charAt(0).toUpperCase() : 'O'}
            </div>
            <button onClick={handleLogout} className="ml-1 px-4 py-2 rounded-xl text-sm font-semibold border transition-all hover:bg-gray-50" style={{ borderColor: '#e5e7eb', color: '#555' }}>
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* ── Main Content ── */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Services</h1>
            <p className="text-gray-500 text-sm mt-1">
              {services.length > 0 ? `${services.length} active service${services.length > 1 ? 's' : ''}` : 'No active services yet.'}
            </p>
          </div>
          <button
            onClick={openCreate}
            className="self-start sm:self-auto px-5 py-3 rounded-xl text-white font-semibold flex items-center gap-2 transition-all cursor-pointer hover:opacity-90"
            style={{ background: '#027B51' }}
          >
            <span className="text-lg leading-none">+</span> Create Service
          </button>
        </div>

        {/* States */}
        {loading && services.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
            {[1, 2, 3].map((n) => <div key={n} className="bg-white h-64 rounded-2xl border border-gray-100" />)}
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-600 p-6 rounded-2xl text-center border border-red-100">
            <p className="font-semibold mb-1">Failed to load services</p>
            <p className="text-sm">{error}</p>
            <button onClick={() => dispatch(fetchServices(token!))} className="mt-4 px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition-all">Retry</button>
          </div>
        ) : services.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm max-w-lg mx-auto">
            <span className="text-5xl block mb-4">✨</span>
            <h3 className="text-lg font-bold text-gray-900 mb-2">No services yet</h3>
            <p className="text-gray-500 text-sm mb-6">Create your first service so customers can start booking you.</p>
            <button onClick={openCreate} className="px-5 py-3 text-white rounded-xl font-semibold transition-all hover:opacity-90" style={{ background: '#027B51' }}>Create a Service</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {services.map((s) => (
              <div key={s.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col overflow-hidden group hover:shadow-md transition-all duration-200">
                {/* Card Header */}
                <div className="p-6 flex-1">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-bold text-gray-900 text-lg leading-tight pr-2 group-hover:text-[#027B51] transition-colors">{s.name}</h3>
                    <span className="text-xl font-bold flex-shrink-0" style={{ color: '#027B51' }}>
                      ₹{(s.price / 100).toFixed(0)}
                    </span>
                  </div>

                  <div className="inline-flex items-center gap-1.5 text-xs text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg mb-4">
                    <span>⏱</span>
                    <span>{s.duration} min</span>
                  </div>

                  {/* Weekly schedule preview */}
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Schedule</p>
                    <div className="flex gap-1 flex-wrap">
                      {WEEKDAYS.map((day, i) => {
                        const avail = s.availabilities.find((a) => a.day_of_week === i);
                        const isWorking = avail?.is_working ?? false;
                        return (
                          <span
                            key={i}
                            title={isWorking ? `${WEEKDAYS_FULL[i]}: ${avail?.start_time} – ${avail?.end_time}` : `${WEEKDAYS_FULL[i]}: Closed`}
                            className="w-8 h-8 rounded-lg text-xs font-bold flex items-center justify-center transition-colors"
                            style={{
                              background: isWorking ? '#dcfce7' : '#f3f4f6',
                              color: isWorking ? '#166534' : '#9ca3af',
                            }}
                          >
                            {day.charAt(0)}
                          </span>
                        );
                      })}
                    </div>
                    {/* Working days detail */}
                    <div className="mt-3 space-y-1">
                      {s.availabilities.filter((a) => a.is_working).slice(0, 3).map((a) => (
                        <div key={a.id} className="flex justify-between text-xs text-gray-500">
                          <span className="font-medium">{WEEKDAYS_FULL[a.day_of_week]}</span>
                          <span className="text-gray-700">{a.start_time} – {a.end_time}</span>
                        </div>
                      ))}
                      {s.availabilities.filter((a) => a.is_working).length > 3 && (
                        <p className="text-xs text-gray-400">+{s.availabilities.filter((a) => a.is_working).length - 3} more days</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Footer — Edit & Archive */}
                <div className="border-t border-gray-50 px-6 py-3 flex items-center gap-2 bg-gray-50/50">
                  <button
                    onClick={() => openEdit(s)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-semibold text-[#027B51] hover:bg-[#027B51] hover:text-white transition-all border border-[#027B51]"
                  >
                    <span>✏️</span> Edit
                  </button>
                  <button
                    onClick={() => setArchivingService(s)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-semibold text-gray-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all border border-gray-200"
                  >
                    <span>📦</span> Archive
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* ── Modals ── */}
      {(modalMode === 'create' || modalMode === 'edit') && (
        <ServiceFormModal
          mode={modalMode}
          service={editingService ?? undefined}
          onClose={closeModal}
          onSubmit={handleFormSubmit}
          submitting={submitting}
        />
      )}

      {archivingService && (
        <ArchiveConfirmModal
          service={archivingService}
          onConfirm={handleArchiveConfirm}
          onCancel={() => setArchivingService(null)}
          loading={archiving}
        />
      )}
    </div>
  );
}
