'use client';

import React from 'react';
import { Home, FileText, Monitor, LogOut, UserCircle, PlusCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

export function SidebarNav({ currentView, onNavigate }: { currentView: string, onNavigate: (v: string) => void }) {
  const { user, logout } = useAuth();

  const menuItems = [
    { id: 'home', label: 'Dashboard', icon: Home },
    { id: 'requests', label: 'Registry Logs', icon: FileText },
  ];

  if (user?.role === 'student' || user?.role === 'teacher') {
    menuItems.push({ id: 'make-request', label: 'New Request', icon: PlusCircle });
  }

  if (user?.role === 'admin') {
    menuItems.push({ id: 'labs', label: 'Infrastructure', icon: Monitor });
  }

  return (
    <div className="flex flex-col h-full bg-[#1f363d] text-white w-80 p-8 shrink-0 border-r border-white/5 shadow-2xl">
      {/* Sidebar Header */}
      <div className="mb-14 px-2">
        <h1 className="text-3xl font-black tracking-tighter text-orange-500 uppercase leading-none">AMA PORTAL</h1>
        <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em] mt-2">Infrastructure Control</p>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 space-y-3">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={cn(
              "w-full flex items-center gap-5 px-6 py-5 rounded-2xl transition-all text-sm font-black uppercase tracking-widest text-left active:scale-95",
              currentView === item.id 
                ? "bg-orange-500 text-white shadow-[0_10px_30px_rgba(249,115,22,0.3)] scale-105" 
                : "text-white/40 hover:bg-white/5 hover:text-white"
            )}
          >
            <item.icon size={24} strokeWidth={3} className={cn(currentView === item.id ? "text-white" : "opacity-40")} />
            {item.label}
          </button>
        ))}
      </nav>

      {/* Bottom Identity & Sign Out */}
      <div className="pt-8 border-t border-white/10 space-y-6">
        <button 
          onClick={() => onNavigate('profile')}
          className={cn(
            "w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all group active:scale-95",
            currentView === 'profile' ? "bg-white/10" : "hover:bg-white/5"
          )}
        >
          <div className="h-14 w-14 rounded-2xl bg-primary/20 flex items-center justify-center text-primary border-2 border-primary/20 shadow-inner group-hover:border-primary/40 transition-colors">
            {user?.profilePic ? (
              <img src={user.profilePic} alt="avatar" className="w-full h-full object-cover rounded-2xl" />
            ) : (
              <UserCircle size={32} strokeWidth={2} />
            )}
          </div>
          <div className="overflow-hidden text-left space-y-0.5">
            <p className="text-xs font-black truncate uppercase text-white tracking-tight">{user?.name || 'Identity'}</p>
            <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest">{user?.role || 'Guest'}</p>
          </div>
        </button>

        <button 
          onClick={logout}
          className="w-full flex items-center gap-5 px-6 py-5 rounded-2xl text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-all text-xs font-black uppercase tracking-widest active:scale-95"
        >
          <div className="h-10 w-10 rounded-full bg-black/40 flex items-center justify-center border border-white/5">
            <LogOut size={20} strokeWidth={3} />
          </div>
          Sign Out
        </button>
      </div>
    </div>
  );
}
