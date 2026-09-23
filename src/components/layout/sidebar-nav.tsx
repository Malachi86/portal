'use client';

import React from 'react';
import { Home, FileText, Monitor, LogOut, UserCircle, PlusCircle, Zap } from 'lucide-react';
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
    <div className="flex flex-col h-full bg-[#1f363d] text-white w-80 p-8 shrink-0 border-r border-white/5 shadow-2xl relative z-40 overflow-hidden">
      <div className="absolute -top-20 -left-20 p-1 opacity-5 pointer-events-none">
        <Zap size={200} fill="currentColor" className="text-orange-500" />
      </div>

      {/* Sidebar Header */}
      <div className="mb-14 px-2 relative z-10">
        <h1 className="text-[2.2rem] font-black tracking-tighter text-orange-500 uppercase leading-none italic">AMA PORTAL</h1>
        <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em] mt-3">Registry Terminal</p>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 space-y-4 relative z-10">
        <div className="space-y-2">
            <p className="text-[9px] font-black uppercase text-white/20 tracking-[0.3em] mb-4 ml-2">Primary Protocol</p>
            {menuItems.map((item) => (
            <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={cn(
                "w-full flex items-center gap-6 px-7 py-6 rounded-[1.5rem] transition-all text-sm font-black uppercase tracking-[0.2em] text-left active:scale-95 group",
                currentView === item.id 
                    ? "bg-orange-500 text-white shadow-[0_20px_40px_rgba(249,115,22,0.3)] scale-105" 
                    : "text-white/40 hover:bg-white/5 hover:text-white"
                )}
            >
                <item.icon size={28} strokeWidth={3} className={cn("transition-transform group-hover:scale-110", currentView === item.id ? "text-white" : "opacity-30")} />
                {item.label}
            </button>
            ))}
        </div>
      </nav>

      {/* Bottom Identity & Sign Out */}
      <div className="pt-8 border-t border-white/10 space-y-6 relative z-10">
        <button 
          onClick={() => onNavigate('profile')}
          className={cn(
            "w-full flex items-center gap-5 px-5 py-5 rounded-2xl transition-all group active:scale-95",
            currentView === 'profile' ? "bg-white/10" : "hover:bg-white/5"
          )}
        >
          <div className="h-16 w-16 rounded-2xl bg-orange-500/20 flex items-center justify-center text-orange-500 border-2 border-orange-500/20 shadow-inner group-hover:border-orange-500/40 transition-colors shrink-0 overflow-hidden">
            {user?.profilePic ? (
              <img src={user.profilePic} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              <UserCircle size={40} strokeWidth={2} />
            )}
          </div>
          <div className="overflow-hidden text-left space-y-1">
            <p className="text-sm font-black truncate uppercase text-white tracking-tight leading-none">{user?.name || 'Identity'}</p>
            <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest">{user?.role || 'Guest'}</p>
          </div>
        </button>

        <button 
          onClick={logout}
          className="w-full flex items-center gap-6 px-8 py-5 rounded-2xl text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-all text-[10px] font-black uppercase tracking-[0.2em] active:scale-95"
        >
          <div className="h-12 w-12 rounded-full bg-black/40 flex items-center justify-center border border-white/5 shrink-0">
            <LogOut size={24} strokeWidth={3} />
          </div>
          End Session
        </button>
      </div>
    </div>
  );
}
