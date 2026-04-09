import React, { useEffect, useState } from 'react';
import { Alert, AlertType, Severity, AlertStatus } from '../types';
import { 
  AlertTriangle, 
  CheckCircle, 
  Filter, 
  Search,
  AlertCircle,
  Info,
  Clock,
  Check
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const Alerts = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    type: '',
    severity: '',
    status: 'ACTIVE',
    search: ''
  });

  const fetchAlerts = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.type) params.append('type', filters.type);
      if (filters.severity) params.append('severity', filters.severity);
      if (filters.status) params.append('status', filters.status);
      
      const res = await fetch(`/api/alerts?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch alerts');
      const data = await res.json();
      setAlerts(data);
    } catch (error) {
      toast.error('Failed to fetch alerts');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [filters.type, filters.severity, filters.status]);

  const handleResolve = async (id: number) => {
    try {
      const res = await fetch(`/api/alerts/${id}/resolve`, { method: 'PUT' });
      const result = await res.json();
      if (result.success) {
        toast.success('Alert resolved');
        fetchAlerts();
      }
    } catch (error) {
      toast.error('Failed to resolve alert');
    }
  };

  const getSeverityBadge = (severity: Severity) => {
    switch (severity) {
      case 'HIGH':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-100">
          <AlertCircle size={12} /> HIGH
        </span>;
      case 'MEDIUM':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-100">
          <AlertTriangle size={12} /> MEDIUM
        </span>;
      case 'LOW':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100">
          <Info size={12} /> LOW
        </span>;
    }
  };

  const filteredAlerts = alerts.filter(a => 
    a.product_name.toLowerCase().includes(filters.search.toLowerCase()) ||
    a.product_sku.toLowerCase().includes(filters.search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">System Alerts</h1>
          <p className="text-zinc-500 mt-1">Monitor and manage inventory warnings.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm space-y-6">
            <h2 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
              <Filter size={18} className="text-zinc-400" />
              Filters
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-zinc-700 mb-2">Search Product</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                  <input
                    type="text"
                    value={filters.search}
                    onChange={(e) => setFilters(f => ({ ...f, search: e.target.value }))}
                    className="w-full pl-10 pr-4 py-2 bg-zinc-50 border border-zinc-100 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                    placeholder="Name or SKU..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-zinc-700 mb-2">Alert Type</label>
                <select
                  value={filters.type}
                  onChange={(e) => setFilters(f => ({ ...f, type: e.target.value }))}
                  className="w-full px-4 py-2 bg-zinc-50 border border-zinc-100 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  <option value="">All Types</option>
                  <option value="LOW_STOCK">Low Stock</option>
                  <option value="OUT_OF_STOCK">Out of Stock</option>
                  <option value="EXPIRY_ALERT">Expiry Alert</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-zinc-700 mb-2">Severity</label>
                <select
                  value={filters.severity}
                  onChange={(e) => setFilters(f => ({ ...f, severity: e.target.value }))}
                  className="w-full px-4 py-2 bg-zinc-50 border border-zinc-100 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  <option value="">All Severities</option>
                  <option value="HIGH">High</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LOW">Low</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-zinc-700 mb-2">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters(f => ({ ...f, status: e.target.value }))}
                  className="w-full px-4 py-2 bg-zinc-50 border border-zinc-100 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  <option value="ACTIVE">Active Only</option>
                  <option value="RESOLVED">Resolved Only</option>
                  <option value="">All Statuses</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-zinc-50/50 text-zinc-500 text-xs uppercase tracking-wider font-bold">
                    <th className="px-6 py-4">Product</th>
                    <th className="px-6 py-4">Type</th>
                    <th className="px-6 py-4">Severity</th>
                    <th className="px-6 py-4">Message</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50">
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto"></div>
                      </td>
                    </tr>
                  ) : filteredAlerts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-zinc-500 italic">
                        No alerts found matching your filters.
                      </td>
                    </tr>
                  ) : (
                    filteredAlerts.map((alert) => (
                      <tr key={alert.id} className={`hover:bg-zinc-50/50 transition-colors ${alert.status === 'RESOLVED' ? 'opacity-60' : ''}`}>
                        <td className="px-6 py-4">
                          <p className="font-bold text-zinc-900">{alert.product_name}</p>
                          <p className="text-xs text-zinc-400 font-mono">{alert.product_sku}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs font-semibold text-zinc-600">
                            {alert.type.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {getSeverityBadge(alert.severity)}
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-zinc-600 max-w-xs">{alert.message}</p>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                            <Clock size={12} />
                            {new Date(alert.created_at).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {alert.status === 'ACTIVE' ? (
                            <button
                              onClick={() => handleResolve(alert.id)}
                              className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                              title="Mark as Resolved"
                            >
                              <Check size={18} />
                            </button>
                          ) : (
                            <span className="text-zinc-300">
                              <CheckCircle size={18} />
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Alerts;
