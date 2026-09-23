
'use client';

import React from 'react';
import { Home, FileText, Monitor, LogOut, UserCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

export function SidebarNav({ currentView, onNavigate }: { currentView: string, onNavigate: (v: string) => void }) {
  const { user, logout } = useAuth();

  const menuItems = [
    { id: 'home', label: 'Dashboard', icon: Home },
    { id: 'requests', label: 'Lab Requests', icon: FileText },
  ];

  if (user?.role === 'admin') {
    menuItems.push({ id: 'labs', label: 'Lab Setup', icon: Monitor });
  }

  return (
    <div className="flex flex-col h-full bg-[#1f363d] text-white w-64 p-6">
      <div className="mb-10 px-2">
        <h1 className="text-xl font-black tracking-tighter text-orange-500 uppercase">AMA PORTAL</h1>
        <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest">Nexus Engine v1.0</p>
      </div>

      <nav className="flex-1 space-y-1">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={cn(
              "w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all text-xs font-black uppercase tracking-widest",
              currentView === item.id ? "bg-orange-500 text-white shadow-lg" : "text-white/40 hover:bg-white/5 hover:text-white"
            )}
          >
            <item.icon size={18} />
            {item.label}
          </button>
        ))}
      </nav>

      <div className="pt-6 border-t border-white/5 space-y-4">
        <div className="flex items-center gap-3 px-2">
          <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
            <UserCircle size={24} />
          </div>
          <div className="overflow-hidden">
            <p className="text-[10px] font-black truncate uppercase">{user?.name}</p>
            <p className="text-[8px] font-bold text-white/30 uppercase">{user?.role}</p>
          </div>
        </div>
        <button 
          onClick={logout}
          className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-all text-xs font-black uppercase tracking-widest"
        >
          <LogOut size={18} />
          Sign Out
        </button>
      </div>
    </div>
  );
}
