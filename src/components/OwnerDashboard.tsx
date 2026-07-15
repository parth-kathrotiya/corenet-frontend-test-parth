'use client';

const FAKE_BOOKINGS = [
  { id: '1', customerName: 'Alice Johnson', service: 'Classic Haircut', date: 'Today', time: '10:00 AM', status: 'confirmed', duration: 30 },
  { id: '2', customerName: 'Bob Smith', service: 'Classic Haircut', date: 'Today', time: '11:30 AM', status: 'confirmed', duration: 30 },
  { id: '3', customerName: 'Carol White', service: 'Deep Tissue Massage', date: 'Tomorrow', time: '2:00 PM', status: 'pending', duration: 60 },
  { id: '4', customerName: 'David Lee', service: 'Classic Haircut', date: 'Jul 17', time: '9:00 AM', status: 'confirmed', duration: 30 },
  { id: '5', customerName: 'Eva Martinez', service: 'Deep Tissue Massage', date: 'Jul 18', time: '3:30 PM', status: 'pending', duration: 60 },
];

const FAKE_SERVICES = [
  { name: 'Classic Haircut', bookings: 24, revenue: 36000, active: true },
  { name: 'Deep Tissue Massage', bookings: 12, revenue: 54000, active: true },
  { name: 'Hair Colouring', bookings: 8, revenue: 64000, active: false },
];

const STATUS_STYLE: Record<string, { bg: string; text: string; label: string }> = {
  confirmed: { bg: '#dcfce7', text: '#166534', label: 'Confirmed' },
  pending:   { bg: '#fef9c3', text: '#854d0e', label: 'Pending' },
  cancelled: { bg: '#fee2e2', text: '#991b1b', label: 'Cancelled' },
  completed: { bg: '#e0e7ff', text: '#3730a3', label: 'Completed' },
};

export default function OwnerDashboard({ name }: { name: string }) {
  return (
    <div className="animate-fade-in">
      {/* Welcome Banner */}
      <div
        className="rounded-2xl p-8 mb-8 text-white relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0D1814 0%, #027B51 100%)' }}
      >
        <div className="relative z-10">
          <p className="text-green-200 text-sm font-medium mb-1">Business Dashboard 🏢</p>
          <h2 className="text-2xl font-bold mb-2">Welcome back, {name}!</h2>
          <p className="text-green-100 text-sm max-w-md">
            Manage your appointments, track revenue, and grow your business.
          </p>
        </div>
        <div className="absolute right-6 bottom-0 text-8xl opacity-10 select-none">💼</div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Today\'s Bookings', value: '2', icon: '📅', delta: '+1 from yesterday' },
          { label: 'This Week', value: '5', icon: '📊', delta: '+2 from last week' },
          { label: 'Total Revenue', value: '₹1,540', icon: '💰', delta: '+₹320 this week' },
          { label: 'Active Services', value: '2', icon: '⚡', delta: '1 inactive' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <div className="text-2xl mb-2">{s.icon}</div>
            <div className="text-2xl font-bold text-gray-900">{s.value}</div>
            <div className="text-sm text-gray-500 mt-0.5">{s.label}</div>
            <div className="text-xs mt-2 font-medium" style={{ color: '#027B51' }}>{s.delta}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Upcoming Bookings */}
        <div className="xl:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
            <h3 className="font-bold text-gray-900">Upcoming Bookings</h3>
            <span className="text-xs text-gray-400 bg-gray-50 px-3 py-1 rounded-full">
              {FAKE_BOOKINGS.filter((b) => b.status !== 'cancelled').length} upcoming
            </span>
          </div>
          <div className="divide-y divide-gray-50">
            {FAKE_BOOKINGS.map((b) => {
              const st = STATUS_STYLE[b.status] || STATUS_STYLE.pending;
              return (
                <div key={b.id} className="px-6 py-4 flex items-center gap-4 hover:bg-gray-50/50 transition-colors">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                    style={{ background: '#027B51' }}
                  >
                    {b.customerName.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm truncate">{b.customerName}</p>
                    <p className="text-gray-500 text-xs">{b.service} · {b.duration} min</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-medium text-gray-800">{b.time}</p>
                    <p className="text-xs text-gray-400">{b.date}</p>
                  </div>
                  <span
                    className="px-2.5 py-1 rounded-full text-xs font-semibold flex-shrink-0"
                    style={{ background: st.bg, color: st.text }}
                  >
                    {st.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* My Services */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
            <h3 className="font-bold text-gray-900">My Services</h3>
            <button
              className="text-xs font-semibold px-3 py-1 rounded-full text-white"
              style={{ background: '#027B51' }}
            >
              + Add
            </button>
          </div>
          <div className="divide-y divide-gray-50">
            {FAKE_SERVICES.map((s) => (
              <div key={s.name} className="px-6 py-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-semibold text-sm text-gray-900">{s.name}</p>
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ background: s.active ? '#027B51' : '#d1d5db' }}
                  />
                </div>
                <div className="flex gap-4 text-xs text-gray-500">
                  <span>📅 {s.bookings} bookings</span>
                  <span>💰 ₹{(s.revenue / 100).toFixed(0)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
