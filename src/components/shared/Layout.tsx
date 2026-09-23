'use client';

import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  Home, Book, FileText, Menu, X, Monitor, LogOut, PlusCircle, HelpCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import UserGuide from './UserGuide';

interface LayoutProps {
  children: React.ReactNode;
  currentView: string;
  onNavigate: (view: string) => void;
}

export default function Layout({ children, currentView, onNavigate }: LayoutProps) {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);

  const getMenuItems = () => {
    if (!user) return [];
    
    const baseItems = [
      { id: 'home', label: 'Dashboard', icon: Home },
      { id: 'requests', label: 'Registry Logs', icon: FileText },
    ];

    if (user.role === 'student' || user.role === 'teacher') {
      baseItems.push({ id: 'make-request', label: 'New Request', icon: PlusCircle });
    }

    if (user.role === 'admin') {
      baseItems.push({ id: 'labs', label: 'Infrastructure', icon: Monitor });
    }

    return baseItems;
  };

  const menuItems = getMenuItems();

  const handleNav = (id: string) => {
    onNavigate(id);
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f7f8] flex flex-col font-sans">
      <header className="bg-[#6D1B0A] text-white h-28 flex items-center justify-between px-8 sticky top-0 z-50 shadow-xl">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-white/10 rounded-lg lg:hidden"
          >
            {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <Image 
            src="/logo.png" 
            alt="AMA Student Portal" 
            width={320} 
            height={80} 
            className="h-20 w-auto object-contain"
            priority
          />
        </div>
        
        <div className="flex items-center gap-8">
          <button 
            onClick={() => setGuideOpen(true)}
            className="hidden md:flex items-center gap-3 bg-[#f07148] hover:bg-[#d95d3a] text-white px-8 py-3 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl transition-all active:scale-95"
          >
            <HelpCircle size={22} />
            Tutorial
          </button>
          <button 
            onClick={logout}
            className="text-white/70 hover:text-white transition-colors"
          >
            <LogOut size={32} />
          </button>
        </div>
      </header>

      <div className="flex flex-1 relative overflow-hidden">
        <aside className={cn(
          "fixed inset-y-0 left-0 z-40 lg:z-30 lg:static lg:h-[calc(100vh-7rem)] bg-[#1f363d] w-80 flex flex-col transition-transform duration-300 ease-in-out shadow-2xl p-8 border-r border-white/5",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}>
          <div className="mb-14 px-2">
            <h1 className="text-[2.2rem] font-black tracking-tighter text-[#f07148] uppercase leading-none italic">AMA PORTAL</h1>
            <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em] mt-3">Registry Terminal</p>
          </div>

          <nav className="flex-1 space-y-2">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                className={cn(
                  "w-full flex items-center gap-6 px-7 py-6 rounded-[1.5rem] transition-all text-xs font-black uppercase tracking-[0.2em] text-left active:scale-95 group",
                  currentView === item.id 
                    ? "bg-[#f07148] text-white shadow-[0_20px_40px_rgba(240,113,72,0.3)] scale-105" 
                    : "text-white/40 hover:bg-white/5 hover:text-white"
                )}
              >
                <item.icon size={28} strokeWidth={3} className={cn("transition-transform group-hover:scale-110", currentView === item.id ? "text-white" : "opacity-30")} />
                {item.label}
              </button>
            ))}
          </nav>

          <div className="pt-8 border-t border-white/10">
            <div className="flex items-center gap-5 p-5 bg-white/5 rounded-2xl">
              <div className="h-16 w-16 rounded-2xl bg-[#f07148]/20 flex items-center justify-center text-[#f07148] font-black text-xl border-2 border-[#f07148]/20">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-black truncate uppercase text-white tracking-tight">{user?.name || 'Identity'}</p>
                <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest">{user?.role || 'Guest'}</p>
              </div>
            </div>
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto p-14 bg-[#f4f7f8]">
          <div className="max-w-[1400px] mx-auto">
            {children}
          </div>
        </main>
      </div>

      <UserGuide open={guideOpen} onOpenChange={setGuideOpen} />
    </div>
  );
}
