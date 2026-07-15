'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { loadCredentials } from '@/redux/slices/authSlice';
import { addToast } from '@/redux/slices/toastSlice';
import { createBooking, fetchMyBookings } from '@/redux/slices/bookingsSlice';

const API = process.env.NEXT_PUBLIC_API_URL;

interface ServiceDetail {
  id: string;
  name: string;
  duration: number;
  price: number;
  owner_id: string;
  owner?: { id: string; name: string };
  availabilities: {
    day_of_week: number;
    is_working: boolean;
    start_time: string | null;
    end_time: string | null;
  }[];
  exceptions: {
    id: string;
    service_id: string;
    date: string;
    is_working: boolean;
    start_time: string | null;
    end_time: string | null;
  }[];
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatSlotTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'UTC',
  });
}

function formatBookingTime(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'UTC',
  });
}

// Helper to get YYYY-MM-DD
function formatDateYYYYMMDD(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// Generate the 7 dates starting from weekStartDate
function getWeekDates(startDate: Date): Date[] {
  const dates: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
    dates.push(d);
  }
  return dates;
}

export default function BookPage() {
  const params = useParams();
  const serviceId = params?.serviceId as string;
  const router = useRouter();
  const dispatch = useAppDispatch();

  const { token, role, isAuthenticated } = useAppSelector((s) => s.auth);
  const { loading: bookingLoading, customerBookings, customerBookingsLoading } = useAppSelector((s) => s.bookings);

  const [service, setService] = useState<ServiceDetail | null>(null);
  const [allServices, setAllServices] = useState<ServiceDetail[]>([]);
  const [serviceLoading, setServiceLoading] = useState(true);

  // Weekly scheduler states
  const [weekStartDate, setWeekStartDate] = useState<Date>(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [bookingBlocks, setBookingBlocks] = useState<{ start_time: string; end_time: string; status: string }[]>([]);
  const [blocksLoading, setBlocksLoading] = useState(false);

  // Booking selection
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  // Hydrate auth from localStorage
  useEffect(() => {
    dispatch(loadCredentials());
  }, [dispatch]);

  // Redirect non-customers
  useEffect(() => {
    if (!isAuthenticated) {
      const t = localStorage.getItem('token');
      if (!t) router.replace('/login');
    }
  }, [isAuthenticated, router]);

  // Fetch service details and all services
  useEffect(() => {
    if (!serviceId || !token) return;
    setServiceLoading(true);
    fetch(`${API}/api/services`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data: ServiceDetail[]) => {
        if (Array.isArray(data)) {
          setAllServices(data);
          const found = data.find((s) => s.id === serviceId);
          setService(found ?? null);
        } else {
          setService(null);
        }
      })
      .catch(() => setService(null))
      .finally(() => setServiceLoading(false));
  }, [serviceId, token]);

  // Fetch current user's upcoming bookings for this service
  useEffect(() => {
    if (token && serviceId) {
      dispatch(fetchMyBookings({ token, serviceId }));
    }
  }, [token, serviceId, dispatch, confirmed]);

  // Fetch bookings (blocked times) for the active week
  const fetchBlocks = useCallback(() => {
    if (!token || !serviceId) return;
    setBlocksLoading(true);

    const dates = getWeekDates(weekStartDate);
    const startStr = formatDateYYYYMMDD(dates[0]);
    const endStr = formatDateYYYYMMDD(dates[6]);

    fetch(`${API}/api/bookings/service/${serviceId}/blocks?startDate=${startStr}&endDate=${endStr}T23:59:59.999Z`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setBookingBlocks(data);
        }
      })
      .catch(() => {})
      .finally(() => setBlocksLoading(false));
  }, [token, serviceId, weekStartDate]);

  useEffect(() => {
    fetchBlocks();
  }, [fetchBlocks]);

  const handleConfirm = async () => {
    if (!selectedSlot || !token) return;
    const result = await dispatch(createBooking({ token, serviceId, startTime: selectedSlot }));
    if (createBooking.fulfilled.match(result)) {
      setConfirmed(true);
      dispatch(addToast({ message: '🎉 Booking confirmed! Check your notifications.', type: 'success' }));
      setTimeout(() => router.push('/'), 2000);
    } else {
      const msg = (result.payload as string) || 'Failed to create booking.';
      dispatch(addToast({ message: msg, type: 'error' }));
    }
  };

  const handlePrevWeek = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const prevWeek = new Date(weekStartDate.getTime() - 7 * 24 * 60 * 60 * 1000);
    if (prevWeek.getTime() + 7 * 24 * 60 * 60 * 1000 > today.getTime()) {
      setWeekStartDate(prevWeek);
    } else {
      setWeekStartDate(today);
    }
    setSelectedSlot(null);
  };

  const handleNextWeek = () => {
    setWeekStartDate(new Date(weekStartDate.getTime() + 7 * 24 * 60 * 60 * 1000));
    setSelectedSlot(null);
  };

  const isPrevDisabled = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return weekStartDate.getTime() <= today.getTime();
  };

  // Derive related services
  const moreFromOwner = service
    ? allServices.filter((s) => s.owner_id === service.owner_id && s.id !== service.id)
    : [];

  const similarServices = service
    ? allServices.filter((s) => s.name === service.name && s.owner_id !== service.owner_id)
    : [];

  // Helper to generate slots for a specific day string (YYYY-MM-DD)
  const generateSlotsForDay = (dateStr: string) => {
    if (!service) return [];

    const [year, month, day] = dateStr.split('-').map(Number);
    const jsDate = new Date(Date.UTC(year, month - 1, day));
    const dayOfWeek = jsDate.getUTCDay();

    let isOpen = false;
    let windowStart: string | null = null;
    let windowEnd: string | null = null;

    // 1. Check exceptions
    const exception = service.exceptions?.find((ex) => {
      const exDate = new Date(ex.date);
      return (
        exDate.getUTCFullYear() === year &&
        exDate.getUTCMonth() === month - 1 &&
        exDate.getUTCDate() === day
      );
    });

    if (exception) {
      isOpen = exception.is_working;
      windowStart = exception.start_time;
      windowEnd = exception.end_time;
    } else {
      // 2. Fall back to weekly availabilities
      const avail = service.availabilities?.find((a) => a.day_of_week === dayOfWeek);
      if (avail) {
        isOpen = avail.is_working;
        windowStart = avail.start_time;
        windowEnd = avail.end_time;
      }
    }

    if (!isOpen || !windowStart || !windowEnd) {
      return [];
    }

    const [startHour, startMin] = windowStart.split(':').map(Number);
    const [endHour, endMin] = windowEnd.split(':').map(Number);

    const windowStartMs = Date.UTC(year, month - 1, day, startHour, startMin, 0, 0);
    const windowEndMs = Date.UTC(year, month - 1, day, endHour, endMin, 0, 0);
    const durationMs = service.duration * 60 * 1000;
    const now = Date.now();

    const slots = [];
    let cursor = windowStartMs;

    while (cursor + durationMs <= windowEndMs) {
      const slotStart = new Date(cursor);
      const isPast = cursor <= now + 15 * 60 * 1000;

      // Check if slot overlaps with any booking block
      const isBooked = bookingBlocks.some((bk) => {
        const bkStart = new Date(bk.start_time).getTime();
        const bkEnd = new Date(bk.end_time).getTime();
        return cursor < bkEnd && (cursor + durationMs) > bkStart;
      });

      slots.push({
        time: slotStart,
        isoString: slotStart.toISOString(),
        isPast,
        isBooked,
      });

      cursor += durationMs;
    }

    return slots;
  };

  if (serviceLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#f4f6f5' }}>
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: '#027B51', borderTopColor: 'transparent' }}
          />
          <p className="text-gray-500 text-sm">Loading service details…</p>
        </div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#f4f6f5' }}>
        <div className="text-center">
          <div className="text-6xl mb-4">😕</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Service not found</h2>
          <Link href="/" className="text-sm font-semibold" style={{ color: '#027B51' }}>← Back to dashboard</Link>
        </div>
      </div>
    );
  }

  const weekDates = getWeekDates(weekStartDate);
  const weekRangeLabel = `${weekDates[0].getDate()} ${MONTH_NAMES[weekDates[0].getMonth()]} – ${weekDates[6].getDate()} ${MONTH_NAMES[weekDates[6].getMonth()]} ${weekDates[6].getFullYear()}`;

  return (
    <div className="min-h-screen" style={{ background: '#f4f6f5' }}>
      {/* Navbar */}
      <nav className="sticky top-0 z-40 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center gap-4">
          <Link href="/" className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: '#027B51' }}
            >
              <span className="text-white font-bold text-base">B</span>
            </div>
            <span className="font-bold text-xl tracking-tight" style={{ color: '#0D1814' }}>BookSlot</span>
          </Link>
          <span className="text-gray-300 font-light text-lg">/</span>
          <span className="text-sm font-semibold text-gray-600 truncate">{service.name}</span>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {confirmed ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="text-7xl mb-4 animate-bounce">✅</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Booking Confirmed!</h2>
            <p className="text-gray-500 mb-6">Redirecting you to your dashboard…</p>
            <div
              className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin"
              style={{ borderColor: '#027B51', borderTopColor: 'transparent' }}
            />
          </div>
        ) : (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left — Service Info & My Upcoming Slots */}
              <div className="lg:col-span-4 space-y-6">
                {/* Service Info Card */}
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 text-white text-xl font-bold"
                    style={{ background: 'linear-gradient(135deg, #027B51, #0D1814)' }}
                  >
                    {service.name.charAt(0)}
                  </div>
                  <h1 className="text-2xl font-extrabold text-gray-900 mb-1">{service.name}</h1>
                  <p className="text-gray-500 text-sm mb-4">By {service.owner?.name ?? 'Provider'}</p>

                  <div className="space-y-3 pt-2 text-sm text-gray-600 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">⏱ Duration</span>
                      <span className="font-semibold text-gray-900">{service.duration} mins</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">💰 Price</span>
                      <span className="font-extrabold text-lg text-[#027B51]">₹{(service.price / 100).toFixed(0)}</span>
                    </div>
                  </div>
                </div>

                {/* Upcoming Slots for User */}
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                  <h3 className="font-bold text-gray-900 mb-3 text-sm flex items-center justify-between">
                    <span>Your Upcoming Bookings</span>
                    <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full font-semibold">
                      {customerBookings.length}
                    </span>
                  </h3>
                  {customerBookingsLoading ? (
                    <div className="animate-pulse space-y-2">
                      <div className="h-10 bg-gray-100 rounded-xl" />
                      <div className="h-10 bg-gray-100 rounded-xl" />
                    </div>
                  ) : customerBookings.length === 0 ? (
                    <p className="text-xs text-gray-400 italic">You have no upcoming bookings for this service.</p>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {customerBookings.map((b) => (
                        <div key={b.id} className="p-3 bg-green-50 border border-green-100 rounded-xl text-xs flex flex-col gap-1">
                          <div className="flex justify-between font-semibold text-green-800">
                            <span>🕒 Booked Slot</span>
                            <span className="capitalize px-1.5 py-0.2 bg-green-200/50 rounded text-[10px]">
                              {b.status}
                            </span>
                          </div>
                          <span className="text-green-700 font-medium">{formatBookingTime(b.start_time)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Service Working Days Overview */}
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                  <h3 className="font-bold text-gray-900 mb-4 text-sm">Working Hours</h3>
                  <div className="space-y-2">
                    {DAY_NAMES.map((day, idx) => {
                      const avail = service.availabilities.find((a) => a.day_of_week === idx);
                      const isWorking = avail?.is_working;
                      return (
                        <div key={day} className="flex justify-between items-center text-xs">
                          <span className="font-semibold text-gray-500">{DAY_NAMES[idx]}</span>
                          {isWorking ? (
                            <span className="text-gray-900">{avail?.start_time} – {avail?.end_time}</span>
                          ) : (
                            <span className="text-gray-400 italic">Closed</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Right — 7-Day Scheduler Grid & Confirm Panel */}
              <div className="lg:col-span-8 space-y-6">
                {/* 7-Day Columns Scheduler */}
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div>
                      <h3 className="font-extrabold text-gray-900 text-lg">Select a Time Slot</h3>
                      <p className="text-xs text-gray-400 mt-0.5">Click on a green slot to schedule. Red slots are already booked.</p>
                    </div>
                    {/* Navigation Buttons */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handlePrevWeek}
                        disabled={isPrevDisabled() || blocksLoading}
                        className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 disabled:opacity-40 transition-all cursor-pointer font-bold"
                      >
                        ◀ Prev Week
                      </button>
                      <span className="text-xs font-bold text-gray-700 bg-gray-50 px-3 py-2 rounded-xl border border-gray-100 whitespace-nowrap">
                        {weekRangeLabel}
                      </span>
                      <button
                        onClick={handleNextWeek}
                        disabled={blocksLoading}
                        className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 disabled:opacity-40 transition-all cursor-pointer font-bold"
                      >
                        Next Week ▶
                      </button>
                    </div>
                  </div>

                  {blocksLoading ? (
                    <div className="grid grid-cols-7 gap-3 h-80 animate-pulse">
                      {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                        <div key={i} className="bg-gray-50 rounded-xl h-full" />
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-7 gap-3 min-w-[650px] overflow-x-auto no-scrollbar">
                      {weekDates.map((dateObj) => {
                        const dateStr = formatDateYYYYMMDD(dateObj);
                        const dayName = DAY_NAMES[dateObj.getDay()];
                        const dateNum = dateObj.getDate();
                        const monthName = MONTH_NAMES[dateObj.getMonth()];
                        const slots = generateSlotsForDay(dateStr);

                        const isToday = formatDateYYYYMMDD(new Date()) === dateStr;

                        return (
                          <div key={dateStr} className="flex flex-col gap-2 min-w-[85px] border-r border-gray-50 last:border-0 pr-1">
                            {/* Column Header */}
                            <div
                              className="text-center p-2 rounded-xl border flex flex-col gap-0.5 shadow-sm"
                              style={{
                                background: isToday ? '#027B51' : 'white',
                                color: isToday ? 'white' : '#1f2937',
                                borderColor: isToday ? '#027B51' : '#f3f4f6',
                              }}
                            >
                              <span className="text-[10px] uppercase font-bold tracking-wider opacity-90">{dayName}</span>
                              <span className="text-base font-extrabold">{dateNum}</span>
                              <span className="text-[10px] opacity-80">{monthName}</span>
                            </div>

                            {/* Column Slots */}
                            <div className="flex flex-col gap-1.5 max-h-[350px] overflow-y-auto pr-0.5 pt-1">
                              {slots.length === 0 ? (
                                <div className="text-[10px] text-gray-400 italic text-center py-6 border border-dashed border-gray-100 rounded-xl">
                                  Closed
                                </div>
                              ) : (
                                slots.map((s) => {
                                  const isSelected = selectedSlot === s.isoString;
                                  let bg = 'white';
                                  let text = '#374151';
                                  let border = '#e5e7eb';
                                  let pointer = 'pointer';
                                  let label = formatSlotTime(s.time);
                                  let disabled = false;

                                  if (s.isPast) {
                                    bg = '#f9fafb';
                                    text = '#9ca3af';
                                    border = '#f3f4f6';
                                    pointer = 'not-allowed';
                                    disabled = true;
                                  } else if (s.isBooked) {
                                    bg = '#fee2e2';
                                    text = '#b91c1c';
                                    border = '#fecaca';
                                    pointer = 'not-allowed';
                                    disabled = true;
                                    label = '🔒 Booked';
                                  } else if (isSelected) {
                                    bg = '#027B51';
                                    text = 'white';
                                    border = '#027B51';
                                  } else {
                                    // Available (Green)
                                    bg = '#f0fdf4';
                                    text = '#15803d';
                                    border = '#bbf7d0';
                                  }

                                  return (
                                    <button
                                      key={s.isoString}
                                      disabled={disabled}
                                      onClick={() => setSelectedSlot(s.isoString)}
                                      className="py-2.5 px-1 rounded-xl text-[10px] font-bold text-center border transition-all hover:scale-[1.02] active:scale-[0.98]"
                                      style={{
                                        background: bg,
                                        color: text,
                                        borderColor: border,
                                        cursor: pointer,
                                      }}
                                    >
                                      {label}
                                    </button>
                                  );
                                })
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Confirm Booking Panel */}
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
                      style={{ background: selectedSlot ? '#027B51' : '#9ca3af' }}
                    >
                      ✓
                    </div>
                    <h3 className="font-bold text-gray-900">Confirm Appointment</h3>
                  </div>

                  {selectedSlot ? (
                    <div
                      className="rounded-xl p-4 mb-4 text-sm"
                      style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}
                    >
                      <p className="font-semibold text-green-800 mb-2">Appointment Confirmation Summary</p>
                      <div className="grid grid-cols-2 gap-2 text-xs text-green-700">
                        <div>📋 Service:</div>
                        <div className="font-bold text-green-900">{service.name}</div>

                        <div>👤 Provider:</div>
                        <div className="font-bold text-green-900">{service.owner?.name ?? 'Provider'}</div>

                        <div>🕐 Time:</div>
                        <div className="font-bold text-green-900">{formatBookingTime(selectedSlot)}</div>

                        <div>💰 Price:</div>
                        <div className="font-bold text-green-900">₹{(service.price / 100).toFixed(0)}</div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 mb-4 text-center py-4">
                      Please select an available green slot from the week view above.
                    </p>
                  )}

                  <button
                    onClick={handleConfirm}
                    disabled={!selectedSlot || bookingLoading}
                    className="w-full py-3.5 rounded-xl text-sm font-bold text-white transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-sm"
                    style={{ background: selectedSlot ? '#027B51' : '#9ca3af' }}
                  >
                    {bookingLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4" />
                          <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8v8H4z" />
                        </svg>
                        Confirming Appointment…
                      </span>
                    ) : (
                      '🎯 Book Appointment'
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Related Services Section */}
            <div className="border-t border-gray-200 pt-8 space-y-8">
              {/* More From This Owner */}
              {moreFromOwner.length > 0 && (
                <div>
                  <h3 className="text-lg font-extrabold text-gray-900 mb-4">More from {service.owner?.name ?? 'Provider'}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    {moreFromOwner.map((s) => (
                      <div
                        key={s.id}
                        onClick={() => router.push(`/book/${s.id}`)}
                        className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
                      >
                        <div>
                          <h4 className="font-bold text-gray-900 text-sm group-hover:text-[#027B51] transition-colors line-clamp-1 mb-1">
                            {s.name}
                          </h4>
                          <p className="text-gray-400 text-xs mb-3">⏱ {s.duration} mins</p>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t border-gray-50">
                          <span className="font-extrabold text-[#027B51] text-sm">₹{(s.price / 100).toFixed(0)}</span>
                          <span className="text-xs font-semibold text-[#027B51] hover:underline">Book →</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Similar Services from Other Owners */}
              {similarServices.length > 0 && (
                <div>
                  <h3 className="text-lg font-extrabold text-gray-900 mb-4">Similar Services from Other Providers</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    {similarServices.map((s) => (
                      <div
                        key={s.id}
                        onClick={() => router.push(`/book/${s.id}`)}
                        className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
                      >
                        <div>
                          <h4 className="font-bold text-gray-900 text-sm group-hover:text-[#027B51] transition-colors line-clamp-1 mb-1">
                            {s.name}
                          </h4>
                          <p className="text-gray-400 text-xs mb-3">By {s.owner?.name ?? 'Provider'}</p>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t border-gray-50">
                          <span className="font-extrabold text-[#027B51] text-sm">₹{(s.price / 100).toFixed(0)}</span>
                          <span className="text-xs font-semibold text-[#027B51] hover:underline">Book →</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
