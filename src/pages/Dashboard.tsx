import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Grid, UserPlus, ShoppingBag, LogOut, Receipt } from 'lucide-react';

const features = [
  { icon: Grid, label: 'ROOMS', path: '/rooms', color: 'bg-blue-500' },
  { icon: ShoppingBag, label: 'SHOP', path: '/shop', color: 'bg-purple-500' },
  { icon: LogOut, label: 'CHECKOUT', path: '/checkout', color: 'bg-red-500' },
  { icon: Receipt, label: 'PAYMENT LOGS', path: '/payments', color: 'bg-yellow-500' },
];

function Dashboard() {
  const navigate = useNavigate();

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">BOSS INN</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map(({ icon: Icon, label, path, color }) => (
          <button
            key={path}
            onClick={() => navigate(path)}
            className="p-6 rounded-lg shadow-lg bg-white hover:shadow-xl transition-shadow duration-200"
          >
            <div className={`w-12 h-12 ${color} rounded-lg flex items-center justify-center mb-4`}>
              <Icon className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-gray-800">{label}</h2>
          </button>
        ))}
      </div>
    </div>
  );
}

export default Dashboard;