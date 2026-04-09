import React from 'react';
import { useAuth } from '../AuthContext';
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  History, 
  LogOut, 
  Menu, 
  X,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  UserCircle,
  ShoppingBag
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = React.useState(true);

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/', roles: ['ADMIN', 'MANAGER', 'STAFF'] },
    { icon: Package, label: 'Inventory', path: '/inventory', roles: ['ADMIN', 'MANAGER', 'STAFF'] },
    { icon: ShoppingBag, label: 'Orders', path: '/orders', roles: ['ADMIN', 'MANAGER', 'STAFF'] },
    { icon: UserCircle, label: 'Customers', path: '/customers', roles: ['ADMIN', 'MANAGER', 'STAFF'] },
    { icon: AlertTriangle, label: 'Alerts', path: '/alerts', roles: ['ADMIN', 'MANAGER', 'STAFF'] },
    { icon: History, label: 'Transactions', path: '/transactions', roles: ['ADMIN', 'MANAGER'] },
    { icon: Users, label: 'User Management', path: '/users', roles: ['ADMIN'] },
    { icon: ShoppingBag, label: 'Shop', path: '/shop', roles: ['CUSTOMER'] },
    { icon: History, label: 'My Orders', path: '/my-orders', roles: ['CUSTOMER'] },
  ];

  const filteredMenu = menuItems.filter(item => item.roles.includes(user?.role || ''));

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-md shadow-md"
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      <motion.aside
        initial={false}
        animate={{ width: isOpen ? 260 : 0, opacity: isOpen ? 1 : 0 }}
        className="fixed lg:static inset-y-0 left-0 z-40 bg-zinc-900 text-zinc-400 overflow-hidden flex flex-col border-r border-zinc-800"
      >
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">
            I
          </div>
          <span className="text-white font-bold text-xl tracking-tight">Inventra</span>
        </div>

        <nav className="flex-1 px-4 space-y-1 mt-4">
          {filteredMenu.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive 
                    ? 'bg-emerald-500/10 text-emerald-500 font-medium' 
                    : 'hover:bg-zinc-800 hover:text-zinc-200'
                }`}
              >
                <item.icon size={20} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-zinc-800">
          <div className="flex items-center gap-3 px-4 py-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-300 font-medium">
              {user?.username[0].toUpperCase()}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium text-white truncate">{user?.username}</p>
              <p className="text-xs text-zinc-500 truncate">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-500/10 hover:text-red-500 transition-all duration-200"
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </motion.aside>
    </>
  );
};

export default Sidebar;
