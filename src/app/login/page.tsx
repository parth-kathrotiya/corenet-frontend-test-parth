'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { setCredentials } from '@/redux/slices/authSlice';
import { addToast } from '@/redux/slices/toastSlice';

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  // If already logged in redirect to home
  useEffect(() => {
    if (isAuthenticated) router.replace('/');
  }, [isAuthenticated, router]);

  // Hydrate from localStorage on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) router.replace('/');
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      dispatch(addToast({ message: 'Please fill in all fields.', type: 'error' }));
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        dispatch(addToast({ message: data.message || 'Login failed.', type: 'error' }));
        return;
      }
      dispatch(
        setCredentials({
          token: data.token,
          email: data.user.email,
          name: data.user.name,
          role: data.user.role,
        })
      );
      dispatch(addToast({ message: `Welcome back, ${data.user.name}!`, type: 'success' }));
      router.replace('/');
    } catch {
      dispatch(addToast({ message: 'Network error. Please try again.', type: 'error' }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* ── Left Branding Panel ── */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12"
        style={{ background: '#0D1814' }}
      >
        <div>
          <div className="flex items-center gap-3 mb-16">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: '#027B51' }}
            >
              <span className="text-white font-bold text-lg">B</span>
            </div>
            <span className="text-white font-bold text-2xl tracking-tight">BookSlot</span>
          </div>

          <div className="animate-fade-in">
            <h1 className="text-4xl font-bold text-white leading-tight mb-6">
              Your time,<br />
              <span style={{ color: '#027B51' }}>booked perfectly.</span>
            </h1>
            <p className="text-gray-400 text-lg leading-relaxed max-w-sm">
              Connect with the best service providers and schedule appointments that fit your life — in seconds.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {[
            { icon: '⚡', title: 'Instant Booking', desc: 'Book in under 30 seconds' },
            { icon: '🔔', title: 'Smart Notifications', desc: 'Never miss an appointment' },
            { icon: '🛡️', title: 'Secure & Private', desc: 'Your data is always protected' },
          ].map((f) => (
            <div key={f.title} className="flex items-center gap-4">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: '#1a2e26' }}
              >
                <span className="text-lg">{f.icon}</span>
              </div>
              <div>
                <p className="text-white font-semibold text-sm">{f.title}</p>
                <p className="text-gray-500 text-xs">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right Form Panel ── */}
      <div className="flex-1 flex items-center justify-center bg-white px-6 py-12">
        <div className="w-full max-w-md animate-fade-in">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: '#027B51' }}
            >
              <span className="text-white font-bold">B</span>
            </div>
            <span className="font-bold text-xl" style={{ color: '#0D1814' }}>BookSlot</span>
          </div>

          <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome back</h2>
          <p className="text-gray-500 mb-8">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="font-semibold hover:underline" style={{ color: '#027B51' }}>
              Sign up free
            </Link>
          </p>

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Email address
              </label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 transition-all"
                style={{ ['--tw-ring-color' as string]: '#027B51' }}
                disabled={loading}
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPwd ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 transition-all pr-12"
                  style={{ ['--tw-ring-color' as string]: '#027B51' }}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm"
                  tabIndex={-1}
                >
                  {showPwd ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              id="login-submit"
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl font-semibold text-white transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60"
              style={{ background: loading ? '#025e3e' : '#027B51' }}
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin-slow inline-block" />
                  Signing in…
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
