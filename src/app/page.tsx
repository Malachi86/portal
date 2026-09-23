'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import LoginPage from '@/components/auth/LoginPage';
import TeacherDashboard from '@/components/teacher/TeacherDashboard';
import StudentDashboard from '@/components/student/StudentDashboard';
import AdminDashboard from '@/components/admin/AdminDashboard';
import { SidebarNav } from '@/components/layout/sidebar-nav';
import LabManagement from '@/components/admin/LabManagement';
import MyRequests from '@/components/student/MyRequests';
import AllRequests from '@/components/admin/AllRequests';
import MakeRequest from '@/components/student/MakeRequest';
import ProfileView from '@/components/shared/ProfileView';
import Image from 'next/image';
import { Bell, HelpCircle, LogOut } from 'lucide-react';

export default function App() {
  const { user, loading, logout } = useAuth();
  const [currentView, setCurrentView] = useState('home');

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#1f363d]">
        <div className="animate-pulse flex flex-col items-center">
            <div className="h-12 w-12 bg-orange-500 rounded-xl mb-4" />
            <p className="text-white/20 font-black text-xs uppercase tracking-widest">Warp Drive Initializing...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  const renderContent = () => {
    switch (currentView) {
        case 'home':
            if (user.role === 'admin') return <AdminDashboard />;
            if (user.role === 'teacher') return <TeacherDashboard />;
            return <StudentDashboard />;
        case 'requests':
            if (user.role === 'admin') return <AllRequests />;
            return <MyRequests />;
        case 'make-request':
            return <MakeRequest />;
        case 'labs':
            return <LabManagement />;
        case 'profile':
            return <ProfileView onBack={() => setCurrentView('home')} />;
        default:
            return <StudentDashboard />;
    }
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#f4f7f8]">
      {/* AMA TOP HEADER - Enlarged to h-28 */}
      <header className="h-28 bg-[#6D1B0A] flex items-center justify-between px-8 md:px-12 shrink-0 shadow-xl z-50">
        <div className="flex items-center gap-6">
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
          <button className="text-white/70 hover:text-white transition-colors">
            <Bell size={28} />
          </button>
          <button className="hidden md:flex items-center gap-3 bg-[#f07148] hover:bg-[#d95d3a] text-white px-8 py-3 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl transition-all active:scale-95">
            <HelpCircle size={22} />
            Tutorial
          </button>
          <button 
            onClick={logout}
            className="text-white/70 hover:text-white transition-colors p-2"
          >
            <LogOut size={32} />
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Navigation - Fixed width w-80 */}
        <SidebarNav currentView={currentView} onNavigate={setCurrentView} />
        
        <main className="flex-1 overflow-y-auto p-6 md:p-14">
          <div className="max-w-[1400px] mx-auto">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
}
