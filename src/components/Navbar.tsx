'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { clearCredentials } from '@/redux/slices/authSlice';
import { addToast } from '@/redux/slices/toastSlice';
import NotificationBell from '@/components/NotificationBell';

/**
 * Common application navbar.
 *
 * Renders the BookSlot logo, role-aware navigation links
 * (with the active page highlighted), the user's name & role badge,
 * avatar, notification bell and logout button.
 *
 * Pages that should NOT show this navbar (login, register, book/:id)
 * simply don't import it.
 */
export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { name, role } = useAppSelector((s) => s.auth);

  const isOwner = role === 'owner';

  const handleLogout = () => {
    dispatch(clearCredentials());
    dispatch(addToast({ message: 'You have been logged out.', type: 'info' }));
    router.replace('/login');
  };

  /** Returns Tailwind-compatible inline style for active vs inactive links. */
  const linkStyle = (href: string) =>
    pathname === href
      ? { color: '#027B51', fontWeight: 700 }
      : { color: '#6b7280', fontWeight: 500 };

  return (
    <nav className="sticky top-0 z-40 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* ── Logo ── */}
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

        {/* ── Role-aware nav links ── */}
        <div className="hidden md:flex items-center gap-6">
          {isOwner ? (
            <>
              <Link
                href="/services"
                className="text-sm transition-colors hover:text-[#027B51]"
                style={linkStyle('/services')}
              >
                My Services
              </Link>
              <Link
                href="/availability"
                className="text-sm transition-colors hover:text-[#027B51]"
                style={linkStyle('/availability')}
              >
                Availability
              </Link>
              <Link
                href="/bookings"
                className="text-sm transition-colors hover:text-[#027B51]"
                style={linkStyle('/bookings')}
              >
                Bookings
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/browse"
                className="text-sm transition-colors hover:text-[#027B51]"
                style={linkStyle('/browse')}
              >
                Browse Services
              </Link>
              <Link
                href="/bookings"
                className="text-sm transition-colors hover:text-[#027B51]"
                style={linkStyle('/bookings')}
              >
                My Bookings
              </Link>
            </>
          )}
        </div>

        {/* ── User menu ── */}
        <div className="flex items-center gap-3">
          {/* Name + role badge */}
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-sm font-semibold text-gray-900">{name}</span>
            <span
              className="text-xs px-2 py-0.5 rounded-full capitalize font-medium"
              style={{
                background: isOwner ? '#dcfce7' : '#dbeafe',
                color: isOwner ? '#166534' : '#1e40af',
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

          {/* Notification bell */}
          <NotificationBell />

          {/* Logout */}
          <button
            id="navbar-logout-btn"
            onClick={handleLogout}
            className="ml-1 px-4 py-2 rounded-xl text-sm font-semibold border transition-all hover:bg-gray-50 cursor-pointer"
            style={{ borderColor: '#e5e7eb', color: '#555' }}
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}
