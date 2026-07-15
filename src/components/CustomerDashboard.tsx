'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
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
  return CATEGORY_COLORS[name] ?? '#027B51';
}

function ServiceSkeleton() {
  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100 animate-pulse">
      <div className="flex justify-between mb-4">
        <div className="h-6 w-20 bg-gray-200 rounded-full" />
        <div className="h-4 w-10 bg-gray-200 rounded" />
      </div>
      <div className="h-5 w-2/3 bg-gray-200 rounded mb-2" />
      <div className="h-4 w-1/2 bg-gray-200 rounded mb-4" />
      <div className="flex gap-4 mb-4">
        <div className="h-3 w-16 bg-gray-200 rounded" />
        <div className="h-3 w-20 bg-gray-200 rounded" />
      </div>
      <div className="flex justify-between items-center">
        <div className="h-6 w-12 bg-gray-200 rounded" />
        <div className="h-9 w-24 bg-gray-200 rounded-xl" />
      </div>
    </div>
  );
}

export default function CustomerDashboard({ name }: { name: string }) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { token } = useAppSelector((s) => s.auth);
  const { items: services, loading } = useAppSelector((s) => s.services);
  const [activeCategory, setActiveCategory] = useState('All');

  useEffect(() => {
    if (token) dispatch(fetchServices(token));
  }, [token, dispatch]);

  // Derive unique categories from real data
  const categories = ['All', ...Array.from(
    new Set(
      services
        .map((s) => {
          // Try to infer a category from service name (fallback if no category field)
          return s.name;
        })
        .filter(Boolean)
    )
  )];

  // Since the service model doesn't have a category column, we group by owner name
  // and show 'All' + unique owner names as filters, OR we just show all services.
  // The selectable boxes are unique service NAMES — multiple owners can offer the
  // same service name and both will appear.
  const uniqueServiceNames = Array.from(new Set(services.map((s) => s.name)));
  const filterOptions = ['All', ...uniqueServiceNames];

  const filtered = activeCategory === 'All'
    ? services
    : services.filter((s) => s.name === activeCategory);

  return (
    <div className="animate-fade-in">
      {/* Welcome Banner */}
      <div
        className="rounded-2xl p-8 mb-8 text-white relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #027B51 0%, #0D1814 100%)' }}
      >
        <div className="relative z-10">
          <p className="text-green-200 text-sm font-medium mb-1">Good day 👋</p>
          <h2 className="text-2xl font-bold mb-2">Hello, {name}!</h2>
          <p className="text-green-100 text-sm max-w-md mb-4">
            Discover and book services from trusted professionals near you.
          </p>
          <button
            onClick={() => router.push('/browse')}
            className="px-5 py-2.5 rounded-xl bg-white text-[#027B51] font-bold text-sm hover:bg-green-50 transition-all active:scale-95 shadow-md flex items-center gap-2 cursor-pointer"
          >
            <span>🔍</span> Browse & Search Services
          </button>
        </div>
        <div className="absolute right-6 bottom-0 text-8xl opacity-10 select-none">📅</div>
      </div>

      {/* Category / Service-Name Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6 no-scrollbar">
        {filterOptions.map((opt) => (
          <button
            key={opt}
            id={`filter-${opt.replace(/\s+/g, '-').toLowerCase()}`}
            onClick={() => setActiveCategory(opt)}
            className="px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all border"
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

      {/* Services Grid */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">
            {activeCategory === 'All' ? 'Available Services' : `"${activeCategory}" — All Providers`}
          </h3>
          {!loading && (
            <span className="text-sm text-gray-400 bg-gray-50 px-3 py-1 rounded-full">
              {filtered.length} service{filtered.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {[1, 2, 3, 4, 5, 6].map((i) => <ServiceSkeleton key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="text-6xl mb-4">🔍</div>
            <p className="font-bold text-gray-700 text-lg mb-2">No services found</p>
            <p className="text-gray-400 text-sm">Try a different filter or check back later.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {filtered.map((s) => {
              // Pick a deterministic colour from the service name
              const colour = getCategoryColor(s.name.split(' ')[1] ?? s.name.split(' ')[0] ?? 'Other');
              return (
                <div
                  key={s.id}
                  className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <span
                      className="px-3 py-1 rounded-full text-xs font-semibold text-white truncate max-w-[140px]"
                      style={{ background: colour }}
                      title={s.owner?.name ?? 'Provider'}
                    >
                      {s.owner?.name ?? 'Provider'}
                    </span>
                    <span className="text-yellow-400 text-sm font-medium flex-shrink-0">⚡ Live</span>
                  </div>
                  <h4 className="font-bold text-gray-900 text-lg mb-1 group-hover:text-[#027B51] transition-colors">
                    {s.name}
                  </h4>
                  <p className="text-gray-500 text-sm mb-4">{s.owner?.name ?? '—'}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-400 mb-4">
                    <span>⏱ {s.duration} min</span>
                    <span>💰 ₹{(s.price / 100).toFixed(0)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-bold" style={{ color: '#027B51' }}>
                      ₹{(s.price / 100).toFixed(0)}
                    </span>
                    <button
                      id={`book-now-${s.id}`}
                      onClick={() => router.push(`/book/${s.id}`)}
                      className="px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95"
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
      </div>
    </div>
  );
}
