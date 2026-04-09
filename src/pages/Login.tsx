import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Lock, User as UserIcon, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

type LoginForm = z.infer<typeof loginSchema>;

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      
      if (result.success) {
        login(result.user);
        toast.success('Welcome back!');
        navigate('/');
      } else {
        toast.error(result.message || 'Invalid credentials');
      }
    } catch (error) {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full"
      >
        <div className="bg-white rounded-3xl shadow-xl shadow-zinc-200/50 p-8 md:p-12 border border-zinc-100">
          <div className="flex flex-col items-center mb-10">
            <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg shadow-indigo-200">
              <Lock size={32} />
            </div>
            <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">Inventra</h1>
            <p className="text-zinc-500 mt-2">Professional Inventory Management</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-zinc-700 mb-2">Username</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-400">
                  <UserIcon size={18} />
                </div>
                <input
                  {...register('username')}
                  className={`w-full pl-11 pr-4 py-3 bg-zinc-50 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none ${
                    errors.username ? 'border-red-500 bg-red-50' : 'border-zinc-200'
                  }`}
                  placeholder="Enter your username"
                />
              </div>
              {errors.username && <p className="mt-1 text-xs text-red-500">{errors.username.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-zinc-700 mb-2">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-400">
                  <Lock size={18} />
                </div>
                <input
                  {...register('password')}
                  type="password"
                  className={`w-full pl-11 pr-4 py-3 bg-zinc-50 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none ${
                    errors.password ? 'border-red-500 bg-red-50' : 'border-zinc-200'
                  }`}
                  placeholder="••••••••"
                />
              </div>
              {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-zinc-900 text-white py-4 rounded-xl font-bold hover:bg-zinc-800 transition-all flex items-center justify-center gap-2 shadow-lg shadow-zinc-300 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : 'Sign In'}
            </button>
          </form>

          <div className="mt-10 pt-8 border-t border-zinc-100 text-center">
            <p className="text-xs text-zinc-400 uppercase tracking-widest font-semibold">Demo Credentials</p>
            <div className="mt-4 grid grid-cols-2 gap-2 text-[10px] font-mono text-zinc-500">
              <div className="bg-zinc-50 p-2 rounded-lg border border-zinc-100">
                <p className="font-bold text-zinc-700">Admin</p>
                <p>admin / admin123</p>
              </div>
              <div className="bg-zinc-50 p-2 rounded-lg border border-zinc-100">
                <p className="font-bold text-zinc-700">Manager</p>
                <p>manager / manager123</p>
              </div>
              <div className="bg-zinc-50 p-2 rounded-lg border border-zinc-100">
                <p className="font-bold text-zinc-700">Staff</p>
                <p>staff / staff123</p>
              </div>
              <div className="bg-zinc-50 p-2 rounded-lg border border-zinc-100">
                <p className="font-bold text-zinc-700">Customer</p>
                <p>customer / customer123</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
