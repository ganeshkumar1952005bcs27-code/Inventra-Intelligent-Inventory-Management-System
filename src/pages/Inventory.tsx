import React, { useEffect, useState } from 'react';
import { useAuth } from '../AuthContext';
import { Product } from '../types';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  ArrowUpCircle, 
  ArrowDownCircle,
  Filter,
  MoreVertical,
  AlertCircle,
  Package
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import Modal from '../components/Modal';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const productSchema = z.object({
  sku: z.string().min(1, 'SKU is required'),
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  price: z.number().min(0.01, 'Price must be greater than 0'),
  min_stock: z.number().min(0, 'Minimum stock cannot be negative'),
  expiry_date: z.string().optional().nullable(),
  is_active: z.number(),
});

const stockSchema = z.object({
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  type: z.enum(['STOCK_IN', 'STOCK_OUT']),
});

type ProductForm = z.infer<typeof productSchema>;
type StockForm = z.infer<typeof stockSchema>;

const Inventory = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<ProductForm>({
    resolver: zodResolver(productSchema),
    defaultValues: { is_active: 1 }
  });

  const { register: registerStock, handleSubmit: handleSubmitStock, reset: resetStock, setValue: setValueStock, watch: watchStock, formState: { errors: stockErrors } } = useForm<StockForm>({
    resolver: zodResolver(stockSchema),
  });

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      setProducts(data);
    } catch (error) {
      toast.error('Failed to fetch products');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const onSubmitProduct = async (data: ProductForm) => {
    try {
      const url = editingProduct ? `/api/products/${editingProduct.id}` : '/api/products';
      const method = editingProduct ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      const result = await res.json();
      if (result.success) {
        toast.success(editingProduct ? 'Product updated' : 'Product added');
        setIsProductModalOpen(false);
        setEditingProduct(null);
        reset();
        fetchProducts();
      } else {
        toast.error(result.message || 'Operation failed');
      }
    } catch (error) {
      toast.error('Something went wrong');
    }
  };

  const onSubmitStock = async (data: StockForm) => {
    if (!selectedProduct) return;
    try {
      const res = await fetch('/api/stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          product_id: selectedProduct.id,
          user_id: user?.id
        }),
      });
      
      const result = await res.json();
      if (result.success) {
        toast.success(`Stock ${data.type.toLowerCase()} successful`);
        setIsStockModalOpen(false);
        resetStock();
        fetchProducts();
      } else {
        toast.error(result.message || 'Operation failed');
      }
    } catch (error) {
      toast.error('Something went wrong');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      const result = await res.json();
      if (result.success) {
        toast.success('Product deleted');
        fetchProducts();
      }
    } catch (error) {
      toast.error('Failed to delete product');
    }
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setValue('sku', product.sku);
    setValue('name', product.name);
    setValue('description', product.description);
    setValue('price', product.price);
    setValue('min_stock', product.min_stock);
    setValue('expiry_date', product.expiry_date);
    setValue('is_active', product.is_active);
    setIsProductModalOpen(true);
  };

  const openStockModal = (product: Product, type: 'STOCK_IN' | 'STOCK_OUT') => {
    setSelectedProduct(product);
    resetStock({ type });
    setIsStockModalOpen(true);
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">Inventory</h1>
          <p className="text-zinc-500 mt-1">Manage your products and stock levels.</p>
        </div>
        {user?.role !== 'STAFF' && (
          <button 
            onClick={() => { setEditingProduct(null); reset(); setIsProductModalOpen(true); }}
            className="bg-emerald-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-emerald-600 transition-all flex items-center gap-2 shadow-lg shadow-emerald-100"
          >
            <Plus size={20} />
            Add Product
          </button>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={20} />
          <input
            type="text"
            placeholder="Search by name or SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
          />
        </div>
        <button className="px-4 py-3 bg-white border border-zinc-200 rounded-2xl text-zinc-600 hover:bg-zinc-50 transition-all flex items-center gap-2">
          <Filter size={20} />
          Filters
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-zinc-50/50 text-zinc-500 text-xs uppercase tracking-wider font-bold">
                <th className="px-6 py-4">Product Info</th>
                <th className="px-6 py-4">SKU</th>
                <th className="px-6 py-4">Price</th>
                <th className="px-6 py-4">Stock Level</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {filteredProducts.map((p) => {
                const isLowStock = p.current_stock <= p.min_stock;
                return (
                  <tr key={p.id} className="hover:bg-zinc-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-zinc-100 rounded-xl flex items-center justify-center text-zinc-400">
                          <Package size={20} />
                        </div>
                        <div>
                          <p className="font-bold text-zinc-900">{p.name}</p>
                          <p className="text-xs text-zinc-500 truncate max-w-[200px]">{p.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-sm text-zinc-600">{p.sku}</td>
                    <td className="px-6 py-4 font-semibold text-zinc-900">₹{p.price.toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className={`text-lg font-bold ${isLowStock ? 'text-amber-600' : 'text-zinc-900'}`}>
                          {p.current_stock}
                        </span>
                        <span className="text-xs text-zinc-400">/ min {p.min_stock}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        {p.is_active === 0 ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-zinc-100 text-zinc-500">
                            Inactive
                          </span>
                        ) : p.current_stock === 0 ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-50 text-red-700">
                            <AlertCircle size={12} />
                            Out of Stock
                          </span>
                        ) : isLowStock ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700">
                            <AlertCircle size={12} />
                            Low Stock
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700">
                            In Stock
                          </span>
                        )}
                        {p.expiry_date && (
                          <span className="text-[10px] text-zinc-400">
                            Exp: {new Date(p.expiry_date).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => openStockModal(p, 'STOCK_IN')}
                          title="Stock In"
                          className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                        >
                          <ArrowUpCircle size={20} />
                        </button>
                        <button 
                          onClick={() => openStockModal(p, 'STOCK_OUT')}
                          title="Stock Out"
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <ArrowDownCircle size={20} />
                        </button>
                        {user?.role !== 'STAFF' && (
                          <>
                            <button 
                              onClick={() => openEditModal(p)}
                              className="p-2 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors"
                            >
                              <Edit2 size={18} />
                            </button>
                            {user?.role === 'ADMIN' && (
                              <button 
                                onClick={() => handleDelete(p.id)}
                                className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <Trash2 size={18} />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Product Modal */}
      <Modal 
        isOpen={isProductModalOpen} 
        onClose={() => setIsProductModalOpen(false)}
        title={editingProduct ? 'Edit Product' : 'Add New Product'}
      >
        <form onSubmit={handleSubmit(onSubmitProduct)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-semibold text-zinc-700 mb-1">Product Name</label>
              <input
                {...register('name')}
                className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                placeholder="e.g. Wireless Mouse"
              />
              {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-zinc-700 mb-1">SKU</label>
              <input
                {...register('sku')}
                disabled={!!editingProduct}
                className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none disabled:opacity-50"
                placeholder="SKU-001"
              />
              {errors.sku && <p className="text-xs text-red-500 mt-1">{errors.sku.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-zinc-700 mb-1">Price (₹)</label>
              <input
                type="number"
                step="0.01"
                {...register('price', { valueAsNumber: true })}
                className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
              />
              {errors.price && <p className="text-xs text-red-500 mt-1">{errors.price.message}</p>}
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-semibold text-zinc-700 mb-1">Description</label>
              <textarea
                {...register('description')}
                rows={3}
                className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-semibold text-zinc-700 mb-1">Minimum Stock Alert Level</label>
              <input
                type="number"
                {...register('min_stock', { valueAsNumber: true })}
                className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
              />
              {errors.min_stock && <p className="text-xs text-red-500 mt-1">{errors.min_stock.message}</p>}
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-semibold text-zinc-700 mb-1">Expiry Date (Optional)</label>
              <input
                type="date"
                {...register('expiry_date')}
                className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
            <div className="col-span-2 flex items-center gap-2">
              <input
                type="checkbox"
                id="is_active"
                checked={watch('is_active') === 1}
                onChange={(e) => setValue('is_active', e.target.checked ? 1 : 0)}
                className="w-4 h-4 text-emerald-600 bg-zinc-100 border-zinc-300 rounded focus:ring-emerald-500"
              />
              <label htmlFor="is_active" className="text-sm font-semibold text-zinc-700">Product is Active</label>
            </div>
          </div>
          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={() => setIsProductModalOpen(false)}
              className="flex-1 px-4 py-3 bg-zinc-100 text-zinc-600 rounded-xl font-bold hover:bg-zinc-200 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-zinc-900 text-white rounded-xl font-bold hover:bg-zinc-800 transition-all"
            >
              {editingProduct ? 'Update Product' : 'Create Product'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Stock Modal */}
      <Modal
        isOpen={isStockModalOpen}
        onClose={() => setIsStockModalOpen(false)}
        title={`Stock ${selectedProduct?.name}`}
      >
        <form onSubmit={handleSubmitStock(onSubmitStock)} className="space-y-6">
          <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100 flex items-center justify-between">
            <span className="text-sm text-zinc-500">Current Stock:</span>
            <span className="text-xl font-bold text-zinc-900">{selectedProduct?.current_stock}</span>
          </div>

          <div>
            <label className="block text-sm font-semibold text-zinc-700 mb-2">Operation Type</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setValueStock('type', 'STOCK_IN')}
                className={`py-3 rounded-xl font-bold border-2 transition-all flex items-center justify-center gap-2 ${
                  watchStock('type') === 'STOCK_IN'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                    : 'border-zinc-100 bg-white text-zinc-400 hover:border-zinc-200'
                }`}
              >
                <ArrowUpCircle size={20} />
                Stock In
              </button>
              <button
                type="button"
                onClick={() => setValueStock('type', 'STOCK_OUT')}
                className={`py-3 rounded-xl font-bold border-2 transition-all flex items-center justify-center gap-2 ${
                  watchStock('type') === 'STOCK_OUT'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-zinc-100 bg-white text-zinc-400 hover:border-zinc-200'
                }`}
              >
                <ArrowDownCircle size={20} />
                Stock Out
              </button>
            </div>
            <input type="hidden" {...registerStock('type')} />
          </div>

          <div>
            <label className="block text-sm font-semibold text-zinc-700 mb-2">Quantity</label>
            <input
              type="number"
              {...registerStock('quantity', { valueAsNumber: true })}
              className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-center text-2xl font-bold"
            />
            {stockErrors.quantity && <p className="text-xs text-red-500 mt-1">{stockErrors.quantity.message}</p>}
          </div>

          <button
            type="submit"
            className="w-full py-4 bg-zinc-900 text-white rounded-xl font-bold hover:bg-zinc-800 transition-all shadow-lg shadow-zinc-200"
          >
            Confirm Operation
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default Inventory;
