import React, { useEffect, useState } from 'react';
import { Customer } from '../types';
import { 
  Users, 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Mail, 
  Phone, 
  MapPin 
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import Modal from '../components/Modal';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const customerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
});

type CustomerForm = z.infer<typeof customerSchema>;

const Customers = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<CustomerForm>({
    resolver: zodResolver(customerSchema),
  });

  const fetchCustomers = async () => {
    try {
      const res = await fetch('/api/customers');
      const data = await res.json();
      setCustomers(data);
    } catch (error) {
      toast.error('Failed to fetch customers');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const onSubmit = async (data: CustomerForm) => {
    try {
      const url = editingCustomer ? `/api/customers/${editingCustomer.id}` : '/api/customers';
      const method = editingCustomer ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      const result = await res.json();
      if (result.success) {
        toast.success(editingCustomer ? 'Customer updated' : 'Customer added');
        setIsModalOpen(false);
        setEditingCustomer(null);
        reset();
        fetchCustomers();
      } else {
        toast.error(result.message || 'Operation failed');
      }
    } catch (error) {
      toast.error('Something went wrong');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this customer?')) return;
    try {
      const res = await fetch(`/api/customers/${id}`, { method: 'DELETE' });
      const result = await res.json();
      if (result.success) {
        toast.success('Customer deleted');
        fetchCustomers();
      }
    } catch (error) {
      toast.error('Failed to delete customer');
    }
  };

  const openEditModal = (customer: Customer) => {
    setEditingCustomer(customer);
    setValue('name', customer.name);
    setValue('email', customer.email || '');
    setValue('phone', customer.phone || '');
    setValue('address', customer.address || '');
    setIsModalOpen(true);
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.email && c.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 tracking-tight text-left">Customers</h1>
          <p className="text-zinc-500 mt-1 text-left">Manage your customer database.</p>
        </div>
        <button 
          onClick={() => {
            setEditingCustomer(null);
            reset();
            setIsModalOpen(true);
          }}
          className="bg-zinc-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-zinc-800 transition-all flex items-center gap-2 shadow-lg shadow-zinc-200"
        >
          <Plus size={20} />
          Add Customer
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={20} />
        <input
          type="text"
          placeholder="Search by name or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-white border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full py-12 text-center text-zinc-400">Loading customers...</div>
        ) : filteredCustomers.length === 0 ? (
          <div className="col-span-full py-12 text-center text-zinc-400">No customers found.</div>
        ) : (
          filteredCustomers.map((customer) => (
            <div key={customer.id} className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm hover:shadow-md transition-all group">
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xl">
                  {customer.name[0].toUpperCase()}
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => openEditModal(customer)}
                    className="p-2 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button 
                    onClick={() => handleDelete(customer.id)}
                    className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
              
              <h3 className="text-xl font-bold text-zinc-900 mb-4 text-left">{customer.name}</h3>
              
              <div className="space-y-2">
                <div className="flex items-center gap-3 text-zinc-500 text-sm">
                  <Mail size={16} />
                  <span className="truncate">{customer.email || 'No email'}</span>
                </div>
                <div className="flex items-center gap-3 text-zinc-500 text-sm">
                  <Phone size={16} />
                  <span>{customer.phone || 'No phone'}</span>
                </div>
                <div className="flex items-center gap-3 text-zinc-500 text-sm">
                  <MapPin size={16} />
                  <span className="truncate">{customer.address || 'No address'}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title={editingCustomer ? 'Edit Customer' : 'Add New Customer'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-zinc-700 mb-1 text-left">Full Name</label>
            <input
              {...register('name')}
              className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
              placeholder="John Doe"
            />
            {errors.name && <p className="text-xs text-red-500 mt-1 text-left">{errors.name.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-semibold text-zinc-700 mb-1 text-left">Email Address</label>
            <input
              {...register('email')}
              className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
              placeholder="john@example.com"
            />
            {errors.email && <p className="text-xs text-red-500 mt-1 text-left">{errors.email.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-semibold text-zinc-700 mb-1 text-left">Phone Number</label>
            <input
              {...register('phone')}
              className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
              placeholder="+1 234 567 890"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-zinc-700 mb-1 text-left">Address</label>
            <textarea
              {...register('address')}
              rows={3}
              className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
              placeholder="123 Street, City, Country"
            />
          </div>
          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="flex-1 px-4 py-3 bg-zinc-100 text-zinc-600 rounded-xl font-bold hover:bg-zinc-200 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-zinc-900 text-white rounded-xl font-bold hover:bg-zinc-800 transition-all"
            >
              {editingCustomer ? 'Update Customer' : 'Create Customer'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Customers;
