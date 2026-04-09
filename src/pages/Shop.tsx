import React, { useEffect, useState } from 'react';
import { Product } from '../types';
import { useAuth } from '../AuthContext';
import { 
  ShoppingBag, 
  Search, 
  ShoppingCart, 
  X, 
  CheckCircle2,
  Filter
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import Modal from '../components/Modal';

const Shop = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<{product_id: number, quantity: number, name: string, price: number}[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      setProducts(data.filter((p: Product) => p.is_active));
    } catch (error) {
      toast.error('Failed to fetch products');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const addToCart = (product: Product) => {
    if (product.current_stock <= 0) {
      toast.error('Out of stock');
      return;
    }
    
    const existing = cart.find(item => item.product_id === product.id);
    if (existing) {
      if (existing.quantity >= product.current_stock) {
        toast.error('Insufficient stock available');
        return;
      }
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
    toast.success(`${product.name} added to cart`);
  };

  const removeFromCart = (productId: number) => {
    setCart(cart.filter(item => item.product_id !== productId));
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;

    try {
      // For simplicity, we'll use a dummy customer ID for now or create one if needed.
      // In a real app, the 'user' would be linked to a 'customer' record.
      // Here we'll just use ID 1 as a placeholder or prompt for customer info.
      
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: 1, // Placeholder
          user_id: user?.id,
          items: cart.map(item => ({
            product_id: item.product_id,
            quantity: item.quantity
          }))
        }),
      });

      const result = await res.json();
      if (result.success) {
        toast.success('Order placed successfully!');
        setCart([]);
        setIsCartOpen(false);
        fetchProducts();
      } else {
        toast.error(result.message || 'Failed to place order');
      }
    } catch (error) {
      toast.error('Something went wrong');
    }
  };

  const totalAmount = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-extrabold text-zinc-900 tracking-tight text-left">Product Catalog</h1>
          <p className="text-zinc-500 mt-2 text-left text-lg">Browse and order high-quality products from Inventra.</p>
        </div>
        <button 
          onClick={() => setIsCartOpen(true)}
          className="relative bg-indigo-600 text-white px-8 py-4 rounded-2xl font-bold hover:bg-indigo-700 transition-all flex items-center gap-3 shadow-xl shadow-indigo-100"
        >
          <ShoppingCart size={24} />
          View Cart
          {cart.length > 0 && (
            <span className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 text-white text-xs rounded-full flex items-center justify-center border-4 border-white">
              {cart.reduce((acc, item) => acc + item.quantity, 0)}
            </span>
          )}
        </button>
      </div>

      <div className="relative group">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-indigo-500 transition-colors" size={24} />
        <input
          type="text"
          placeholder="Search products by name, category, or description..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-14 pr-6 py-5 bg-white border border-zinc-200 rounded-3xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-lg shadow-sm"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {isLoading ? (
          <div className="col-span-full py-20 text-center">
            <div className="animate-spin w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-zinc-400 text-lg">Loading catalog...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-white rounded-3xl border border-dashed border-zinc-200">
            <ShoppingBag size={48} className="mx-auto text-zinc-300 mb-4" />
            <p className="text-zinc-500 text-xl font-medium">No products found matching your search.</p>
          </div>
        ) : (
          filteredProducts.map((product) => (
            <div key={product.id} className="bg-white rounded-[2rem] border border-zinc-100 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col group">
              <div className="p-6 flex-1 flex flex-col">
                <div className="flex items-center gap-2 mb-4">
                  {product.current_stock <= 5 && product.current_stock > 0 && (
                    <div className="bg-amber-500 text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                      Low Stock
                    </div>
                  )}
                  {product.current_stock === 0 && (
                    <div className="bg-red-500 text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                      Out of Stock
                    </div>
                  )}
                </div>
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xl font-bold text-zinc-900 group-hover:text-indigo-600 transition-colors text-left">{product.name}</h3>
                  <span className="text-2xl font-black text-indigo-600">₹{product.price.toFixed(2)}</span>
                </div>
                
                <p className="text-zinc-500 text-sm line-clamp-2 mb-6 text-left flex-1">
                  {product.description || 'No description available for this premium Inventra product.'}
                </p>
                
                <div className="flex items-center justify-between mt-auto pt-4 border-t border-zinc-50">
                  <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
                    {product.current_stock} Available
                  </span>
                  <button 
                    onClick={() => addToCart(product)}
                    disabled={product.current_stock <= 0}
                    className="flex items-center gap-2 bg-zinc-900 text-white px-5 py-3 rounded-2xl font-bold hover:bg-indigo-600 disabled:bg-zinc-200 disabled:text-zinc-400 transition-all"
                  >
                    <ShoppingCart size={18} />
                    Add to Cart
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Cart Modal */}
      <Modal 
        isOpen={isCartOpen} 
        onClose={() => setIsCartOpen(false)}
        title="Your Shopping Cart"
        maxWidth="max-w-2xl"
      >
        <div className="space-y-6">
          <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2">
            {cart.length === 0 ? (
              <div className="py-12 text-center">
                <ShoppingCart size={48} className="mx-auto text-zinc-200 mb-4" />
                <p className="text-zinc-400 text-lg italic">Your cart is empty. Start shopping!</p>
              </div>
            ) : (
              cart.map(item => (
                <div key={item.product_id} className="flex items-center gap-4 bg-zinc-50 p-4 rounded-2xl border border-zinc-100 group">
                  <div className="flex-1 text-left">
                    <p className="font-bold text-zinc-900 text-lg">{item.name}</p>
                    <p className="text-sm text-zinc-500">{item.quantity} units x ₹{item.price.toFixed(2)}</p>
                  </div>
                  <div className="text-right flex flex-col items-end gap-2">
                    <span className="font-black text-indigo-600 text-xl">₹{(item.price * item.quantity).toFixed(2)}</span>
                    <button 
                      onClick={() => removeFromCart(item.product_id)}
                      className="text-zinc-400 hover:text-red-500 transition-colors"
                    >
                      <X size={20} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {cart.length > 0 && (
            <div className="border-t border-zinc-100 pt-6 space-y-6">
              <div className="flex justify-between items-center">
                <span className="text-zinc-500 text-lg font-medium">Total Order Value</span>
                <span className="text-4xl font-black text-zinc-900">₹{totalAmount.toFixed(2)}</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => setIsCartOpen(false)}
                  className="py-4 bg-zinc-100 text-zinc-600 rounded-2xl font-bold hover:bg-zinc-200 transition-all"
                >
                  Continue Shopping
                </button>
                <button 
                  onClick={handleCheckout}
                  className="py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2"
                >
                  <CheckCircle2 size={20} />
                  Place Order Now
                </button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default Shop;
