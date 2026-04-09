import React, { useEffect, useState } from 'react';
import { useAuth } from '../AuthContext';
import { Navigate } from 'react-router-dom';
import { Product, Transaction, Alert } from '../types';
import { 
  Package, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown, 
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  AlertCircle,
  Info
} from 'lucide-react';
import { motion } from 'motion/react';

const Dashboard = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user?.role === 'CUSTOMER') return;
    const fetchData = async () => {
      try {
        const [pRes, tRes, aRes] = await Promise.all([
          fetch('/api/products'),
          fetch('/api/transactions'),
          fetch('/api/alerts?status=ACTIVE')
        ]);

        if (!pRes.ok || !tRes.ok || !aRes.ok) {
          throw new Error('One or more API requests failed');
        }

        const pData = await pRes.json();
        const tData = await tRes.json();
        const aData = await aRes.json();
        setProducts(pData);
        setTransactions(tData);
        setAlerts(aData);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const lowStockProducts = products.filter(p => p.current_stock <= p.min_stock && p.current_stock > 0);
  const outOfStockProducts = products.filter(p => p.current_stock === 0);
  const totalStockValue = products.reduce((acc, p) => acc + (p.current_stock * p.price), 0);
  const recentTransactions = transactions.slice(0, 5);

  const stats = [
    { 
      label: 'Total Products', 
      value: products.length, 
      icon: Package, 
      color: 'bg-blue-500',
      trend: '+2.5%',
      trendUp: true,
      roles: ['ADMIN', 'MANAGER', 'STAFF']
    },
    { 
      label: 'Active Alerts', 
      value: alerts.length, 
      icon: AlertTriangle, 
      color: 'bg-amber-500',
      trend: alerts.some(a => a.severity === 'HIGH') ? 'High Priority' : 'Normal',
      trendUp: false,
      roles: ['ADMIN', 'MANAGER', 'STAFF']
    },
    { 
      label: 'Total Stock Value', 
      value: `₹${totalStockValue.toLocaleString()}`, 
      icon: TrendingUp, 
      color: 'bg-emerald-500',
      trend: '+12.3%',
      trendUp: true,
      roles: ['ADMIN']
    },
    { 
      label: 'Monthly Sales', 
      value: '1,284', 
      icon: TrendingDown, 
      color: 'bg-purple-500',
      trend: '-4.1%',
      trendUp: false,
      roles: ['ADMIN']
    },
  ].filter(s => s.roles.includes(user?.role || ''));

  if (user?.role === 'CUSTOMER') {
    return <Navigate to="/shop" replace />;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">Welcome back, {user?.username}</h1>
        <p className="text-zinc-500 mt-1">Here's what's happening with your inventory today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`${stat.color} p-3 rounded-2xl text-white shadow-lg shadow-${stat.color.split('-')[1]}-200`}>
                <stat.icon size={24} />
              </div>
              <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${
                stat.trendUp ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
              }`}>
                {stat.trendUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                {stat.trend}
              </div>
            </div>
            <p className="text-zinc-500 text-sm font-medium">{stat.label}</p>
            <p className="text-2xl font-bold text-zinc-900 mt-1">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {user?.role !== 'STAFF' && (
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-zinc-50 flex items-center justify-between">
                <h2 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
                  <Clock size={20} className="text-zinc-400" />
                  Recent Transactions
                </h2>
                <button className="text-sm font-semibold text-emerald-600 hover:text-emerald-700">View all</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-zinc-50/50 text-zinc-500 text-xs uppercase tracking-wider font-bold">
                      <th className="px-6 py-4">Product</th>
                      <th className="px-6 py-4">Type</th>
                      <th className="px-6 py-4">Quantity</th>
                      <th className="px-6 py-4">User</th>
                      <th className="px-6 py-4">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-50">
                    {recentTransactions.map((t) => (
                      <tr key={t.id} className="hover:bg-zinc-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-semibold text-zinc-900">{t.product_name}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            t.type === 'IN' ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'
                          }`}>
                            {t.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-mono text-zinc-600">{t.quantity}</td>
                        <td className="px-6 py-4 text-zinc-600">{t.username}</td>
                        <td className="px-6 py-4 text-zinc-400 text-sm">
                          {new Date(t.timestamp).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        <div className={user?.role === 'STAFF' ? 'lg:col-span-3' : 'space-y-6'}>
          <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm p-6">
            <h2 className="text-xl font-bold text-zinc-900 mb-6 flex items-center gap-2">
              <AlertTriangle size={20} className="text-amber-500" />
              Active Alerts
            </h2>
            <div className="space-y-4">
              {alerts.length === 0 ? (
                <p className="text-zinc-500 text-sm italic">No active alerts. Great job!</p>
              ) : (
                alerts.slice(0, 5).map(alert => (
                  <div key={alert.id} className={`flex items-center gap-4 p-4 rounded-2xl border ${
                    alert.severity === 'HIGH' ? 'bg-red-50 border-red-100' : 
                    alert.severity === 'MEDIUM' ? 'bg-amber-50 border-amber-100' : 
                    'bg-blue-50 border-blue-100'
                  }`}>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold ${
                      alert.severity === 'HIGH' ? 'bg-red-500' : 
                      alert.severity === 'MEDIUM' ? 'bg-amber-500' : 
                      'bg-blue-500'
                    }`}>
                      {alert.severity === 'HIGH' ? <AlertCircle size={20} /> : 
                       alert.severity === 'MEDIUM' ? <AlertTriangle size={20} /> : 
                       <Info size={20} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-zinc-900 truncate">{alert.product_name}</p>
                      <p className={`text-xs truncate ${
                        alert.severity === 'HIGH' ? 'text-red-700' : 
                        alert.severity === 'MEDIUM' ? 'text-amber-700' : 
                        'text-blue-700'
                      }`}>{alert.message}</p>
                    </div>
                  </div>
                ))
              )}
              {alerts.length > 5 && (
                <button className="w-full py-2 text-sm font-semibold text-zinc-400 hover:text-zinc-600 transition-colors">
                  View {alerts.length - 5} more alerts
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
