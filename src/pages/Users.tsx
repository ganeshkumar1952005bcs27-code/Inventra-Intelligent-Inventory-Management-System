import React, { useEffect, useState } from 'react';
import { User, Role } from '../types';
import { 
  Users, 
  Plus, 
  Shield, 
  Trash2, 
  UserPlus,
  ShieldCheck,
  ShieldAlert,
  User as UserIcon
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import Modal from '../components/Modal';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const userSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['ADMIN', 'MANAGER', 'STAFF']),
});

type UserForm = z.infer<typeof userSchema>;

const UserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<UserForm>({
    resolver: zodResolver(userSchema),
    defaultValues: { role: 'STAFF' }
  });

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      setUsers(data);
    } catch (error) {
      toast.error('Failed to fetch users');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const onSubmit = async (data: UserForm) => {
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (result.success) {
        toast.success('User created successfully');
        setIsModalOpen(false);
        reset();
        fetchUsers();
      } else {
        toast.error(result.message || 'Failed to create user');
      }
    } catch (error) {
      toast.error('Something went wrong');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
      const result = await res.json();
      if (result.success) {
        toast.success('User deleted');
        fetchUsers();
      }
    } catch (error) {
      toast.error('Failed to delete user');
    }
  };

  const getRoleIcon = (role: Role) => {
    switch (role) {
      case 'ADMIN': return <ShieldCheck className="text-red-500" size={18} />;
      case 'MANAGER': return <ShieldAlert className="text-amber-500" size={18} />;
      default: return <UserIcon className="text-blue-500" size={18} />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">User Management</h1>
          <p className="text-zinc-500 mt-1">Manage system access and permissions.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-zinc-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-zinc-800 transition-all flex items-center gap-2 shadow-lg shadow-zinc-200"
        >
          <UserPlus size={20} />
          Add User
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.map((user) => (
          <div key={user.id} className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm hover:shadow-md transition-all group">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-zinc-50 rounded-2xl flex items-center justify-center text-zinc-400 group-hover:bg-zinc-900 group-hover:text-white transition-colors">
                <UserIcon size={24} />
              </div>
              <div className="flex items-center gap-1 px-3 py-1 bg-zinc-50 rounded-full text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                {getRoleIcon(user.role)}
                {user.role}
              </div>
            </div>
            <h3 className="text-xl font-bold text-zinc-900">{user.username}</h3>
            <p className="text-sm text-zinc-500 mt-1 capitalize">System {user.role.toLowerCase()}</p>
            
            <div className="mt-6 pt-6 border-t border-zinc-50 flex items-center justify-between">
              <span className="text-xs text-zinc-400 font-mono">ID: #{user.id}</span>
              {user.username !== 'admin' && (
                <button 
                  onClick={() => handleDelete(user.id)}
                  className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New User">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-zinc-700 mb-1">Username</label>
            <input
              {...register('username')}
              className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
              placeholder="Enter username"
            />
            {errors.username && <p className="text-xs text-red-500 mt-1">{errors.username.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-semibold text-zinc-700 mb-1">Password</label>
            <input
              type="password"
              {...register('password')}
              className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
              placeholder="••••••••"
            />
            {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-semibold text-zinc-700 mb-1">Role</label>
            <select
              {...register('role')}
              className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
            >
              <option value="STAFF">Staff</option>
              <option value="MANAGER">Manager</option>
              <option value="ADMIN">Admin</option>
            </select>
            {errors.role && <p className="text-xs text-red-500 mt-1">{errors.role.message}</p>}
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
              Create User
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default UserManagement;
