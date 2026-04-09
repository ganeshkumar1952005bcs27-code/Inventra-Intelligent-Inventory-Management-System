import React, { useEffect, useState } from 'react';
import { Order, Customer, Product } from '../types';
import { useAuth } from '../AuthContext';
import { 
  ShoppingBag, 
  Plus, 
  Search, 
  Eye, 
  User, 
  Package, 
  Calendar, 
  DollarSign,
  X,
  CheckCircle2
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import Modal from '../components/Modal';

const Orders = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // New Order State
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [cart, setCart] = useState<{product_id: number, quantity: number, name: string, price: number}[]>([]);

  const fetchData = async () => {
    try {
      const [oRes, cRes, pRes] = await Promise.all([
        fetch('/api/orders'),
        fetch('/api/customers'),
        fetch('/api/products')
      ]);
      const oData = await oRes.json();
      const cData = await cRes.json();
      const pData = await pRes.json();
      setOrders(oData);
      setCustomers(cData);
      setProducts(pData.filter((p: Product) => p.is_active));
    } catch (error) {
      toast.error('Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateOrder = async () => {
    if (!selectedCustomerId) return toast.error('Please select a customer');
    if (cart.length === 0) return toast.error('Cart is empty');

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: parseInt(selectedCustomerId),
          user_id: user?.id,
          items: cart.map(item => ({
            product_id: item.product_id,
            quantity: item.quantity
          }))
        }),
      });

      const result = await res.json();
      if (result.success) {
        toast.success('Order placed successfully');
        setIsOrderModalOpen(false);
        setCart([]);
        setSelectedCustomerId('');
        fetchData();
      } else {
        toast.error(result.message || 'Failed to place order');
      }
    } catch (error) {
      toast.error('Something went wrong');
    }
  };

  const addToCart = (product: Product) => {
    if (product.current_stock <= 0) return toast.error('Out of stock');
    
    const existing = cart.find(item => item.product_id === product.id);
    if (existing) {
      if (existing.quantity >= product.current_stock) return toast.error('Insufficient stock');
      setCart(cart.map(item => 
        item.product_id === product.id 
          ? { ...item, quantity: item.quantity + 1 } 
          : item
      ));
    } else {
      setCart([...cart, { 
        product_id: product.id, 
        quantity: 1, 
        name: product.name, 
        price: product.price 
      }]);
    }
  };

  const removeFromCart = (productId: number) => {
    setCart(cart.filter(item => item.product_id !== productId));
  };

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

  const totalAmount = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 tracking-tight text-left">Orders</h1>
          <p className="text-zinc-500 mt-1 text-left">Manage customer orders and sales.</p>
        </div>
        <button 
          onClick={() => setIsOrderModalOpen(true)}
          className="bg-zinc-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-zinc-800 transition-all flex items-center gap-2 shadow-lg shadow-zinc-200"
        >
          <Plus size={20} />
          New Order
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-zinc-50/50 text-zinc-500 text-xs uppercase tracking-wider font-bold">
                <th className="px-6 py-4">Order ID</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Total Amount</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {isLoading ? (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-zinc-400">Loading orders...</td></tr>
              ) : orders.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-zinc-400">No orders found.</td></tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="hover:bg-zinc-50/50 transition-colors">
                    <td className="px-6 py-4 text-zinc-400 font-mono text-xs">#{order.id}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs">
                          {order.customer_name[0].toUpperCase()}
                        </div>
                        <span className="font-bold text-zinc-900">{order.customer_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold text-zinc-900">₹{order.total_amount.toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        order.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700' : 
                        order.status === 'PENDING' ? 'bg-amber-50 text-amber-700' : 
                        'bg-red-50 text-red-700'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-zinc-400 text-sm">
                      {new Date(order.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => viewOrderDetails(order.id)}
                        className="p-2 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors"
                      >
                        <Eye size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Order Modal */}
      <Modal 
        isOpen={isOrderModalOpen} 
        onClose={() => setIsOrderModalOpen(false)}
        title="Place New Order"
        maxWidth="max-w-4xl"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-zinc-700 mb-2 text-left">Select Customer</label>
              <select 
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
              >
                <option value="">Choose a customer...</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-zinc-700 mb-2 text-left">Add Products</label>
              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                {products.map(p => (
                  <div key={p.id} className="p-3 bg-zinc-50 rounded-xl border border-zinc-100 flex items-center justify-between group">
                    <div>
                      <p className="font-bold text-zinc-900 text-sm text-left">{p.name}</p>
                      <p className="text-xs text-zinc-500 text-left">₹{p.price.toFixed(2)} • {p.current_stock} in stock</p>
                    </div>
                    <button 
                      onClick={() => addToCart(p)}
                      disabled={p.current_stock <= 0}
                      className="p-2 bg-white text-emerald-600 rounded-lg border border-zinc-200 hover:border-emerald-500 hover:bg-emerald-50 transition-all disabled:opacity-50"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-zinc-50 rounded-3xl p-6 flex flex-col h-full">
            <h3 className="text-lg font-bold text-zinc-900 mb-4 flex items-center gap-2">
              <ShoppingBag size={20} className="text-emerald-500" />
              Order Summary
            </h3>
            
            <div className="flex-1 space-y-3 overflow-y-auto mb-6">
              {cart.length === 0 ? (
                <p className="text-zinc-400 text-sm italic text-center py-8">Cart is empty</p>
              ) : (
                cart.map(item => (
                  <div key={item.product_id} className="flex items-center justify-between bg-white p-3 rounded-xl border border-zinc-100">
                    <div className="text-left">
                      <p className="font-bold text-zinc-900 text-sm">{item.name}</p>
                      <p className="text-xs text-zinc-500">{item.quantity} x ₹{item.price.toFixed(2)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-zinc-900 text-sm">₹{(item.price * item.quantity).toFixed(2)}</span>
                      <button 
                        onClick={() => removeFromCart(item.product_id)}
                        className="text-zinc-400 hover:text-red-500"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="border-t border-zinc-200 pt-4 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-zinc-500 font-medium">Total Amount</span>
                <span className="text-2xl font-bold text-zinc-900">₹{totalAmount.toFixed(2)}</span>
              </div>
              <button 
                onClick={handleCreateOrder}
                className="w-full py-4 bg-zinc-900 text-white rounded-2xl font-bold hover:bg-zinc-800 transition-all shadow-lg shadow-zinc-200"
              >
                Place Order
              </button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Order Detail Modal */}
      <Modal 
        isOpen={isDetailModalOpen} 
        onClose={() => setIsDetailModalOpen(false)}
        title={`Order Details #${selectedOrder?.id}`}
      >
        {selectedOrder && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1 text-left">Customer</p>
                <p className="font-bold text-zinc-900 text-left">{selectedOrder.customer_name}</p>
              </div>
              <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1 text-left">Status</p>
                <p className="font-bold text-emerald-600 text-left">{selectedOrder.status}</p>
              </div>
              <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1 text-left">Date</p>
                <p className="font-bold text-zinc-900 text-left">{new Date(selectedOrder.created_at).toLocaleString()}</p>
              </div>
              <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1 text-left">Processed By</p>
                <p className="font-bold text-zinc-900 text-left">{selectedOrder.username}</p>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-zinc-900 mb-3 flex items-center gap-2">
                <Package size={18} className="text-zinc-400" />
                Order Items
              </h4>
              <div className="bg-white border border-zinc-100 rounded-2xl overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-zinc-50">
                    <tr className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                      <th className="px-4 py-3">Product</th>
                      <th className="px-4 py-3">Qty</th>
                      <th className="px-4 py-3">Price</th>
                      <th className="px-4 py-3 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-50">
                    {selectedOrder.items?.map(item => (
                      <tr key={item.id}>
                        <td className="px-4 py-3">
                          <p className="font-bold text-zinc-900 text-sm">{item.product_name}</p>
                          <p className="text-[10px] text-zinc-400 font-mono">{item.product_sku}</p>
                        </td>
                        <td className="px-4 py-3 text-sm text-zinc-600">{item.quantity}</td>
                        <td className="px-4 py-3 text-sm text-zinc-600">₹{item.price_at_time.toFixed(2)}</td>
                        <td className="px-4 py-3 text-sm font-bold text-zinc-900 text-right">
                          ₹{(item.quantity * item.price_at_time).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-zinc-50/50">
                    <tr>
                      <td colSpan={3} className="px-4 py-3 text-right font-bold text-zinc-500">Total</td>
                      <td className="px-4 py-3 text-right font-bold text-zinc-900 text-lg">
                        ₹{selectedOrder.total_amount.toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            <button 
              onClick={() => setIsDetailModalOpen(false)}
              className="w-full py-3 bg-zinc-100 text-zinc-600 rounded-xl font-bold hover:bg-zinc-200 transition-all"
            >
              Close
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Orders;
