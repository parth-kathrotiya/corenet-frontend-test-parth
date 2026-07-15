'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { loadCredentials } from '@/redux/slices/authSlice';
import { fetchServices } from '@/redux/slices/servicesSlice';

const CATEGORY_COLORS: Record<string, string> = {
  Hair: '#027B51',
  Wellness: '#7c3aed',
  Health: '#dc2626',
  Fitness: '#d97706',
  Business: '#2563eb',
  Creative: '#db2777',
  Beauty: '#ec4899',
  Education: '#0891b2',
  Legal: '#7c3aed',
  Tech: '#0f172a',
};

function getCategoryColor(name: string): string {
  const parts = name.split(' ');
  const match = parts.find(p => CATEGORY_COLORS[p]);
  return match ? CATEGORY_COLORS[match] : '#027B51';
}

function ServiceSkeleton() {
  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100 animate-pulse shadow-sm">
      <div className="flex justify-between mb-4">
        <div className="h-6 w-24 bg-gray-200 rounded-full" />
        <div className="h-4 w-12 bg-gray-200 rounded" />
      </div>
      <div className="h-6 w-3/4 bg-gray-200 rounded mb-2" />
      <div className="h-4 w-1/2 bg-gray-200 rounded mb-4" />
      <div className="flex gap-4 mb-4">
        <div className="h-3 w-16 bg-gray-200 rounded" />
        <div className="h-3 w-20 bg-gray-200 rounded" />
      </div>
      <div className="flex justify-between items-center pt-4 border-t border-gray-50">
        <div className="h-7 w-20 bg-gray-200 rounded" />
        <div className="h-10 w-28 bg-gray-200 rounded-xl" />
      </div>
    </div>
  );
}

export default function BrowseServicesPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isAuthenticated, name, role, token } = useAppSelector((s) => s.auth);
  const { items: services, loading, error } = useAppSelector((s) => s.services);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  // Hydrate auth from localStorage
  useEffect(() => {
    dispatch(loadCredentials());
  }, [dispatch]);

  // Fetch all services
  useEffect(() => {
    if (token) {
      dispatch(fetchServices(token));
    }
  }, [token, dispatch]);

  // Redirect if not logged in or incorrect role
  useEffect(() => {
    const t = localStorage.getItem('token');
    const r = localStorage.getItem('role');
    if (!t) {
      router.replace('/login');
      return;
    }
    if (r !== 'customer') {
      router.replace('/');
    }
  }, [router]);


  // Derive unique services names (can act as subcategories)
  const uniqueNames = Array.from(new Set(services.map((s) => s.name)));
  const filterOptions = ['All', ...uniqueNames];

  // Filtering logic
  const filtered = services.filter((s) => {
    // Filter by category chip
    const matchesCategory = activeCategory === 'All' || s.name === activeCategory;

    // Filter by search query (owner name or service name)
    const lowerQuery = searchQuery.toLowerCase();
    const matchesSearch =
      s.name.toLowerCase().includes(lowerQuery) ||
      (s.owner?.name && s.owner.name.toLowerCase().includes(lowerQuery));

    return matchesCategory && matchesSearch;
  });

  if (!isAuthenticated || role !== 'customer') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#f4f6f5' }}>
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: '#027B51', borderTopColor: 'transparent' }}
          />
          <p className="text-gray-500 text-sm">Loading…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: '#f4f6f5' }}>
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Browse Services</h1>
          <p className="text-gray-500 text-sm mt-1">
            Search and book top-rated services near you.
          </p>
        </div>

        {/* Search & Filters */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm mb-8 space-y-6">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
              🔍
            </span>
            <input
              type="text"
              placeholder="Search by service name or owner name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#027B51] transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            )}
          </div>

          {/* Categories */}
          <div>
            <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
              Filter by Service Name
            </span>
            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
              {filterOptions.map((opt) => (
                <button
                  key={opt}
                  onClick={() => setActiveCategory(opt)}
                  className="px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all border cursor-pointer"
                  style={
                    activeCategory === opt
                      ? { background: '#027B51', color: 'white', borderColor: '#027B51' }
                      : { background: 'white', color: '#555', borderColor: '#e5e7eb' }
                  }
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Services List */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">
            {activeCategory === 'All' ? 'All Services' : `"${activeCategory}" Services`}
            {searchQuery && ` matching "${searchQuery}"`}
          </h2>
          {!loading && (
            <span className="text-sm font-semibold text-gray-500 bg-white px-3 py-1 rounded-full border border-gray-100 shadow-sm">
              {filtered.length} {filtered.length === 1 ? 'service' : 'services'}
            </span>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <ServiceSkeleton key={i} />
            ))}
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-600 p-6 rounded-2xl text-center border border-red-100">
            <p className="font-semibold mb-1">Failed to load services</p>
            <p className="text-sm">{error}</p>
            <button
              onClick={() => dispatch(fetchServices(token!))}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition-all"
            >
              Retry
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl p-16 text-center border border-gray-100 shadow-sm max-w-lg mx-auto">
            <span className="text-5xl block mb-4">🔍</span>
            <h3 className="text-lg font-bold text-gray-900 mb-2">No matching services</h3>
            <p className="text-gray-500 text-sm">
              We couldn&apos;t find any services matching your search or filters. Try adjusting them.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((s) => {
              const color = getCategoryColor(s.name);
              return (
                <div
                  key={s.id}
                  onClick={() => router.push(`/book/${s.id}`)}
                  className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-start justify-between mb-4">
                      <span
                        className="px-3 py-1 rounded-full text-xs font-semibold text-white truncate max-w-[140px]"
                        style={{ background: color }}
                        title={s.owner?.name ?? 'Provider'}
                      >
                        👤 {s.owner?.name ?? 'Provider'}
                      </span>
                      <span className="text-green-600 text-xs font-semibold bg-green-50 px-2.5 py-1 rounded-full flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-ping" />
                        Available
                      </span>
                    </div>

                    <h3 className="font-bold text-gray-900 text-lg mb-1 group-hover:text-[#027B51] transition-colors line-clamp-1">
                      {s.name}
                    </h3>
                    <p className="text-gray-400 text-xs mb-4">By {s.owner?.name ?? 'Provider'}</p>

                    <div className="flex gap-4 text-xs font-medium text-gray-500 bg-gray-50 p-2.5 rounded-xl mb-4">
                      <span className="flex items-center gap-1">⏱ {s.duration} min</span>
                      <span className="flex items-center gap-1">💰 ₹{(s.price / 100).toFixed(0)}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                    <div>
                      <span className="text-xs text-gray-400 block font-medium">Price starting from</span>
                      <span className="text-2xl font-black text-gray-900" style={{ color: '#027B51' }}>
                        ₹{(s.price / 100).toFixed(0)}
                      </span>
                    </div>
                    <button
                      className="px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-all group-hover:opacity-95 active:scale-95 shadow-sm"
                      style={{ background: '#027B51' }}
                    >
                      Book Now
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
