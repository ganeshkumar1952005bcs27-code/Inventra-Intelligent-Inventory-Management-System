import React, { useEffect, useState } from 'react';
import { Transaction } from '../types';
import { 
  History, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  Search,
  Calendar,
  Download
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const Transactions = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [products, setProducts] = useState<{id: number, name: string}[]>([]);
  const [users, setUsers] = useState<{id: number, username: string}[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    product_id: '',
    type: '',
    user_id: '',
    start_date: '',
    end_date: '',
    min_quantity: '',
    search: ''
  });

  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.product_id) params.append('product_id', filters.product_id);
      if (filters.type) params.append('type', filters.type);
      if (filters.user_id) params.append('user_id', filters.user_id);
      if (filters.start_date) params.append('start_date', filters.start_date);
      if (filters.end_date) params.append('end_date', filters.end_date);
      if (filters.min_quantity) params.append('min_quantity', filters.min_quantity);

      const res = await fetch(`/api/transactions?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch transactions');
      const data = await res.json();
      setTransactions(data);
    } catch (error) {
      toast.error('Failed to fetch transactions');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMetadata = async () => {
    try {
      const [pRes, uRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/users')
      ]);
      const pData = await pRes.json();
      const uData = await uRes.json();
      setProducts(pData);
      setUsers(uData);
    } catch (error) {
      console.error('Failed to fetch metadata');
    }
  };

  useEffect(() => {
    fetchMetadata();
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [filters.product_id, filters.type, filters.user_id, filters.start_date, filters.end_date, filters.min_quantity]);

  const filteredTransactions = transactions.filter(t => 
    t.product_name.toLowerCase().includes(filters.search.toLowerCase()) ||
    t.username.toLowerCase().includes(filters.search.toLowerCase())
  );

  const handleExport = () => {
    const headers = ['ID', 'Product', 'Type', 'Quantity', 'User', 'Date'];
    const csvData = filteredTransactions.map(t => [
      t.id,
      t.product_name,
      t.type,
      t.quantity,
      t.username,
      new Date(t.timestamp).toLocaleString()
    ]);
    
    const csvContent = [headers, ...csvData].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `transactions_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">Transaction History</h1>
          <p className="text-zinc-500 mt-1">Audit log of all stock movements.</p>
        </div>
        <button 
          onClick={handleExport}
          className="bg-zinc-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-zinc-800 transition-all flex items-center gap-2 shadow-lg shadow-zinc-200"
        >
          <Download size={20} />
          Export CSV
        </button>
      </div>

      {/* Filter Panel */}
      <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-zinc-900 font-bold mb-2">
          <History size={20} className="text-emerald-500" />
          Filter Transactions
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
              <input
                type="text"
                placeholder="Product or user..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="w-full pl-10 pr-4 py-2 bg-zinc-50 border border-zinc-100 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Product</label>
            <select
              value={filters.product_id}
              onChange={(e) => setFilters({ ...filters, product_id: e.target.value })}
              className="w-full px-4 py-2 bg-zinc-50 border border-zinc-100 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
            >
              <option value="">All Products</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Type</label>
            <select
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              className="w-full px-4 py-2 bg-zinc-50 border border-zinc-100 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
            >
              <option value="">All Types</option>
              <option value="STOCK_IN">Stock In</option>
              <option value="STOCK_OUT">Stock Out</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">User</label>
            <select
              value={filters.user_id}
              onChange={(e) => setFilters({ ...filters, user_id: e.target.value })}
              className="w-full px-4 py-2 bg-zinc-50 border border-zinc-100 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
            >
              <option value="">All Users</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.username}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Start Date</label>
            <input
              type="date"
              value={filters.start_date}
              onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
              className="w-full px-4 py-2 bg-zinc-50 border border-zinc-100 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">End Date</label>
            <input
              type="date"
              value={filters.end_date}
              onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
              className="w-full px-4 py-2 bg-zinc-50 border border-zinc-100 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Min Quantity</label>
            <input
              type="number"
              placeholder="Min qty..."
              value={filters.min_quantity}
              onChange={(e) => setFilters({ ...filters, min_quantity: e.target.value })}
              className="w-full px-4 py-2 bg-zinc-50 border border-zinc-100 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={() => setFilters({
                product_id: '',
                type: '',
                user_id: '',
                start_date: '',
                end_date: '',
                min_quantity: '',
                search: ''
              })}
              className="w-full px-4 py-2 bg-zinc-100 text-zinc-600 rounded-xl font-bold hover:bg-zinc-200 transition-all text-sm"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-zinc-50/50 text-zinc-500 text-xs uppercase tracking-wider font-bold">
                <th className="px-6 py-4">ID</th>
                <th className="px-6 py-4">Product</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Quantity</th>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-zinc-400">Loading transactions...</td>
                </tr>
              ) : filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-zinc-400">No transactions found matching your criteria.</td>
                </tr>
              ) : (
                filteredTransactions.map((t) => (
                  <tr key={t.id} className="hover:bg-zinc-50/50 transition-colors">
                    <td className="px-6 py-4 text-zinc-400 font-mono text-xs">#{t.id}</td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-zinc-900">{t.product_name}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                        t.type === 'STOCK_IN' ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'
                      }`}>
                        {t.type === 'STOCK_IN' ? <ArrowUpCircle size={14} /> : <ArrowDownCircle size={14} />}
                        {t.type === 'STOCK_IN' ? 'Stock In' : 'Stock Out'}
                      </div>
                    </td>
                    <td className={`px-6 py-4 font-mono font-bold ${t.quantity >= 50 ? 'text-red-600' : 'text-zinc-900'}`}>
                      {t.type === 'STOCK_IN' ? '+' : '-'}{t.quantity}
                      {t.quantity >= 50 && <span className="ml-2 text-[10px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded uppercase">Bulk</span>}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-zinc-100 flex items-center justify-center text-[10px] font-bold text-zinc-500">
                          {t.username[0].toUpperCase()}
                        </div>
                        <span className="text-zinc-600">{t.username}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-zinc-400 text-sm">
                      {new Date(t.timestamp).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Transactions;
