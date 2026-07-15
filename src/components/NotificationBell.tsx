'use client';

import { useEffect, useRef, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { fetchNotifications, markAllNotificationsRead } from '@/redux/slices/notificationsSlice';

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function NotificationBell() {
  const dispatch = useAppDispatch();
  const { token } = useAppSelector((s) => s.auth);
  const { items, unreadCount, loading } = useAppSelector((s) => s.notifications);
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  // Fetch on mount and every 30s
  useEffect(() => {
    if (!token) return;
    dispatch(fetchNotifications(token));
    const interval = setInterval(() => dispatch(fetchNotifications(token)), 30000);
    return () => clearInterval(interval);
  }, [token, dispatch]);

  // Close on outside click
  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (dialogRef.current && !dialogRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [open]);

  const handleOpen = () => {
    setOpen((v) => !v);
    if (!open && token) {
      dispatch(fetchNotifications(token));
    }
  };

  const handleMarkAllRead = () => {
    if (token) dispatch(markAllNotificationsRead(token));
  };

  return (
    <div className="relative" ref={dialogRef}>
      {/* Bell Button */}
      <button
        id="notification-bell-btn"
        onClick={handleOpen}
        className="relative w-10 h-10 flex items-center justify-center rounded-xl border transition-all hover:bg-gray-50"
        style={{ borderColor: '#e5e7eb' }}
        aria-label="Notifications"
      >
        <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ color: '#555' }}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span
            className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-white text-xs font-bold flex items-center justify-center"
            style={{ background: '#ef4444' }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dialog Dropdown */}
      {open && (
        <div
          className="absolute right-0 top-12 w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50"
          style={{ maxHeight: '480px' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-gray-900 text-base">Notifications</h3>
              {unreadCount > 0 && (
                <span
                  className="text-xs font-semibold px-2 py-0.5 rounded-full text-white"
                  style={{ background: '#ef4444' }}
                >
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                id="mark-all-read-btn"
                onClick={handleMarkAllRead}
                className="text-xs font-semibold transition-colors hover:underline"
                style={{ color: '#027B51' }}
              >
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="overflow-y-auto" style={{ maxHeight: '380px' }}>
            {loading && items.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <div
                  className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin"
                  style={{ borderColor: '#027B51', borderTopColor: 'transparent' }}
                />
              </div>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center px-6">
                <div className="text-4xl mb-3">🔔</div>
                <p className="font-semibold text-gray-700 mb-1">All caught up!</p>
                <p className="text-sm text-gray-400">You have no notifications yet.</p>
              </div>
            ) : (
              items.map((n) => (
                <div
                  key={n.id}
                  className="px-5 py-4 border-b border-gray-50 last:border-b-0 transition-colors hover:bg-gray-50/60"
                  style={{ background: n.is_read ? 'white' : '#f0fdf4' }}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="w-2 h-2 rounded-full mt-2 flex-shrink-0"
                      style={{ background: n.is_read ? '#d1d5db' : '#027B51' }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-gray-900 leading-snug">{n.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{n.message}</p>
                      <p className="text-xs mt-1.5 font-medium" style={{ color: '#9ca3af' }}>
                        {timeAgo(n.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
