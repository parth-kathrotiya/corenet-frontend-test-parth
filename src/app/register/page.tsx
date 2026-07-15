'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { setCredentials } from '@/redux/slices/authSlice';
import { addToast } from '@/redux/slices/toastSlice';

type Role = 'customer' | 'owner';

export default function RegisterPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('customer');
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  useEffect(() => {
    if (isAuthenticated) router.replace('/');
  }, [isAuthenticated, router]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) router.replace('/');
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      dispatch(addToast({ message: 'Please fill in all fields.', type: 'error' }));
      return;
    }
    if (password.length < 6) {
      dispatch(addToast({ message: 'Password must be at least 6 characters.', type: 'error' }));
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role }),
      });
      const data = await res.json();
      if (!res.ok) {
        dispatch(addToast({ message: data.message || 'Registration failed.', type: 'error' }));
        return;
      }
      // Auto login after registration
      const loginRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const loginData = await loginRes.json();
      if (loginRes.ok) {
        dispatch(
          setCredentials({
            token: loginData.token,
            email: loginData.user.email,
            name: loginData.user.name,
            role: loginData.user.role,
          })
        );
        dispatch(addToast({ message: `Account created! Welcome, ${loginData.user.name}!`, type: 'success' }));
        router.replace('/');
      } else {
        dispatch(addToast({ message: 'Account created! Please sign in.', type: 'success' }));
        router.replace('/login');
      }
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
              Join thousands of<br />
              <span style={{ color: '#027B51' }}>happy customers.</span>
            </h1>
            <p className="text-gray-400 text-lg leading-relaxed max-w-sm">
              Whether you&apos;re looking to book an appointment or grow your business, BookSlot has you covered.
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {[
            { role: 'Customer', icon: '👤', desc: 'Discover services and book appointments instantly.' },
            { role: 'Business Owner', icon: '🏢', desc: 'List your services and manage your bookings effortlessly.' },
          ].map((r) => (
            <div key={r.role} className="flex items-start gap-4">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: '#1a2e26' }}
              >
                <span className="text-lg">{r.icon}</span>
              </div>
              <div>
                <p className="text-white font-semibold text-sm">{r.role}</p>
                <p className="text-gray-500 text-xs">{r.desc}</p>
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

          <h2 className="text-3xl font-bold text-gray-900 mb-2">Create account</h2>
          <p className="text-gray-500 mb-8">
            Already have an account?{' '}
            <Link href="/login" className="font-semibold hover:underline" style={{ color: '#027B51' }}>
              Sign in
            </Link>
          </p>

          {/* Role Toggle */}
          <div
            className="flex rounded-xl p-1 mb-6"
            style={{ background: '#f4f6f5' }}
          >
            {(['customer', 'owner'] as Role[]).map((r) => (
              <button
                key={r}
                type="button"
                id={`role-${r}`}
                onClick={() => setRole(r)}
                className="flex-1 py-2.5 rounded-lg text-sm font-semibold capitalize transition-all duration-200"
                style={{
                  background: role === r ? '#027B51' : 'transparent',
                  color: role === r ? 'white' : '#555',
                }}
              >
                {r === 'customer' ? '👤 Customer' : '🏢 Business Owner'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Full name</label>
              <input
                id="register-name"
                type="text"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Doe"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 transition-all"
                disabled={loading}
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email address</label>
              <input
                id="register-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 transition-all"
                disabled={loading}
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <input
                  id="register-password"
                  type={showPwd ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 transition-all pr-12"
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
              <p className="text-xs text-gray-400 mt-1">Must be at least 6 characters</p>
            </div>

            {/* Submit */}
            <button
              id="register-submit"
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl font-semibold text-white transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60"
              style={{ background: loading ? '#025e3e' : '#027B51' }}
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin-slow inline-block" />
                  Creating account…
                </>
              ) : (
                `Create ${role === 'owner' ? 'Business' : ''} Account`
              )}
            </button>

            <p className="text-xs text-center text-gray-400">
              By signing up you agree to our{' '}
              <span className="underline cursor-pointer" style={{ color: '#027B51' }}>Terms of Service</span>
              {' '}and{' '}
              <span className="underline cursor-pointer" style={{ color: '#027B51' }}>Privacy Policy</span>.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
