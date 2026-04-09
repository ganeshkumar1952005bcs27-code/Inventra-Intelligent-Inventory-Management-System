import React from 'react';
import { useAuth } from '../AuthContext';
import { Bell, Search, User as UserIcon } from 'lucide-react';

const TopBar = () => {
  const { user } = useAuth();

  return (
    <header className="h-16 border-b border-zinc-100 bg-white px-8 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-4 flex-1 max-w-xl">
        <div className="relative w-full hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
          <input 
            type="text" 
            placeholder="Search anything..." 
            className="w-full pl-10 pr-4 py-2 bg-zinc-50 border border-zinc-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button className="p-2 text-zinc-400 hover:bg-zinc-50 rounded-lg transition-colors relative">
          <Bell size={20} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>
        
        <div className="h-8 w-px bg-zinc-100 mx-2"></div>

        <div className="flex items-center gap-3 pl-2">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-zinc-900 leading-none">{user?.username}</p>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mt-1">{user?.role}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-zinc-900 flex items-center justify-center text-white shadow-lg shadow-zinc-200">
            <UserIcon size={20} />
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopBar;
