'use client';

const FAKE_SERVICES = [
  { id: '1', name: 'Classic Haircut', owner: 'The Style Hub', duration: 30, price: 1500, rating: 4.9, reviews: 128, category: 'Hair' },
  { id: '2', name: 'Deep Tissue Massage', owner: 'ZenBody Spa', duration: 60, price: 4500, rating: 4.8, reviews: 94, category: 'Wellness' },
  { id: '3', name: 'Dental Checkup', owner: 'BrightSmile Clinic', duration: 45, price: 2000, rating: 4.7, reviews: 212, category: 'Health' },
  { id: '4', name: 'Yoga Session', owner: 'Mindful Movement', duration: 60, price: 1200, rating: 5.0, reviews: 67, category: 'Fitness' },
  { id: '5', name: 'Financial Consultation', owner: 'ClearPath Advisors', duration: 60, price: 5000, rating: 4.6, reviews: 43, category: 'Business' },
  { id: '6', name: 'Portrait Photography', owner: 'LensArt Studio', duration: 90, price: 8000, rating: 4.9, reviews: 31, category: 'Creative' },
];

const CATEGORIES = ['All', 'Hair', 'Wellness', 'Health', 'Fitness', 'Business', 'Creative'];

const CATEGORY_COLORS: Record<string, string> = {
  Hair: '#027B51', Wellness: '#7c3aed', Health: '#dc2626',
  Fitness: '#d97706', Business: '#2563eb', Creative: '#db2777',
};

export default function CustomerDashboard({ name }: { name: string }) {
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
          <p className="text-green-100 text-sm max-w-md">
            Discover and book services from trusted professionals near you.
          </p>
        </div>
        <div className="absolute right-6 bottom-0 text-8xl opacity-10 select-none">📅</div>
      </div>

      {/* Category Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6 no-scrollbar">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            className="px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all border"
            style={
              cat === 'All'
                ? { background: '#027B51', color: 'white', borderColor: '#027B51' }
                : { background: 'white', color: '#555', borderColor: '#e5e7eb' }
            }
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Services Grid */}
      <div className="mb-4">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Available Services</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {FAKE_SERVICES.map((s) => (
            <div
              key={s.id}
              className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group"
            >
              <div className="flex items-start justify-between mb-4">
                <span
                  className="px-3 py-1 rounded-full text-xs font-semibold text-white"
                  style={{ background: CATEGORY_COLORS[s.category] || '#027B51' }}
                >
                  {s.category}
                </span>
                <span className="text-yellow-400 text-sm font-medium">★ {s.rating}</span>
              </div>
              <h4 className="font-bold text-gray-900 text-lg mb-1 group-hover:text-[#027B51] transition-colors">
                {s.name}
              </h4>
              <p className="text-gray-500 text-sm mb-4">{s.owner}</p>
              <div className="flex items-center gap-4 text-xs text-gray-400 mb-4">
                <span>⏱ {s.duration} min</span>
                <span>💬 {s.reviews} reviews</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xl font-bold" style={{ color: '#027B51' }}>
                  ₹{(s.price / 100).toFixed(0)}
                </span>
                <button
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all"
                  style={{ background: '#027B51' }}
                >
                  Book Now
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
