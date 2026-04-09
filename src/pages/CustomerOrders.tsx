import React, { useEffect, useState } from 'react';
import { Order } from '../types';
import { useAuth } from '../AuthContext';
import { 
  History, 
  Package, 
  Calendar, 
  DollarSign,
  Eye,
  CheckCircle2,
  Clock,
  XCircle
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import Modal from '../components/Modal';

const CustomerOrders = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/orders');
      const data = await res.json();
      // In a real app, we'd filter by the logged-in user's customer ID.
      // For this demo, we'll show all orders but label them as "My Orders".
      setOrders(data);
    } catch (error) {
      toast.error('Failed to fetch orders');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const viewOrderDetails = async (orderId: number) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`);
      const data = await res.json();
      setSelectedOrder(data);
      setIsDetailModalOpen(true);
    } catch (error) {
      toast.error('Failed to fetch order details');
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-extrabold text-zinc-900 tracking-tight text-left">My Order History</h1>
        <p className="text-zinc-500 mt-2 text-left text-lg">Track and review your past purchases from Inventra.</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {isLoading ? (
          <div className="py-20 text-center bg-white rounded-3xl border border-zinc-100">
            <div className="animate-spin w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-zinc-400 text-lg">Loading your history...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="py-20 text-center bg-white rounded-3xl border border-dashed border-zinc-200">
            <History size={48} className="mx-auto text-zinc-300 mb-4" />
            <p className="text-zinc-500 text-xl font-medium">You haven't placed any orders yet.</p>
          </div>
        ) : (
          orders.map((order) => (
            <div key={order.id} className="bg-white p-8 rounded-[2rem] border border-zinc-100 shadow-sm hover:shadow-xl transition-all group flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-6">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
                  order.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600' : 
                  order.status === 'PENDING' ? 'bg-amber-50 text-amber-600' : 
                  'bg-red-50 text-red-600'
                }`}>
                  <Package size={32} />
                </div>
                <div className="text-left">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Order #{order.id}</span>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      order.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' : 
                      order.status === 'PENDING' ? 'bg-amber-100 text-amber-700' : 
                      'bg-red-100 text-red-700'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                  <h3 className="text-2xl font-black text-zinc-900">₹{order.total_amount.toFixed(2)}</h3>
                  <div className="flex items-center gap-4 mt-2 text-zinc-500 text-sm">
                    <span className="flex items-center gap-1.5">
                      <Calendar size={14} />
                      {new Date(order.created_at).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock size={14} />
                      {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <button 
                  onClick={() => viewOrderDetails(order.id)}
                  className="px-6 py-3 bg-zinc-900 text-white rounded-xl font-bold hover:bg-indigo-600 transition-all flex items-center gap-2 shadow-lg shadow-zinc-100"
                >
                  <Eye size={18} />
                  View Details
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Order Detail Modal */}
      <Modal 
        isOpen={isDetailModalOpen} 
        onClose={() => setIsDetailModalOpen(false)}
        title={`Order Summary #${selectedOrder?.id}`}
        maxWidth="max-w-2xl"
      >
        {selectedOrder && (
          <div className="space-y-8">
            <div className="grid grid-cols-2 gap-6">
              <div className="p-6 bg-zinc-50 rounded-3xl border border-zinc-100">
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 text-left">Status</p>
                <div className="flex items-center gap-2">
                  {selectedOrder.status === 'COMPLETED' ? <CheckCircle2 className="text-emerald-500" size={20} /> : <Clock className="text-amber-500" size={20} />}
                  <span className="font-black text-zinc-900 text-lg uppercase">{selectedOrder.status}</span>
                </div>
              </div>
              <div className="p-6 bg-zinc-50 rounded-3xl border border-zinc-100">
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 text-left">Total Paid</p>
                <p className="font-black text-indigo-600 text-2xl">₹{selectedOrder.total_amount.toFixed(2)}</p>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-bold text-zinc-900 flex items-center gap-2 text-lg">
                <Package size={20} className="text-indigo-500" />
                Items Purchased
              </h4>
              <div className="bg-white border border-zinc-100 rounded-[2rem] overflow-hidden shadow-sm">
                <table className="w-full text-left">
                  <thead className="bg-zinc-50/50">
                    <tr className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                      <th className="px-6 py-4">Product</th>
                      <th className="px-6 py-4">Qty</th>
                      <th className="px-6 py-4 text-right">Price</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-50">
                    {selectedOrder.items?.map(item => (
                      <tr key={item.id} className="group">
                        <td className="px-6 py-4">
                          <p className="font-bold text-zinc-900 group-hover:text-indigo-600 transition-colors">{item.product_name}</p>
                          <p className="text-[10px] text-zinc-400 font-mono mt-0.5">{item.product_sku}</p>
                        </td>
                        <td className="px-6 py-4 text-zinc-600 font-medium">{item.quantity}</td>
                        <td className="px-6 py-4 text-right font-black text-zinc-900">
                          ₹{(item.quantity * item.price_at_time).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-zinc-50/30">
                    <tr>
                      <td colSpan={2} className="px-6 py-6 text-right font-bold text-zinc-400 uppercase tracking-widest">Total Amount</td>
                      <td className="px-6 py-6 text-right font-black text-zinc-900 text-2xl">
                        ₹{selectedOrder.total_amount.toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            <button 
              onClick={() => setIsDetailModalOpen(false)}
              className="w-full py-5 bg-zinc-900 text-white rounded-2xl font-bold hover:bg-indigo-600 transition-all shadow-xl shadow-zinc-100"
            >
              Close Summary
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default CustomerOrders;
