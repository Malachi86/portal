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

export default function App() {
  const { user, loading } = useAuth();
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
    <div className="flex h-screen overflow-hidden">
      <SidebarNav currentView={currentView} onNavigate={setCurrentView} />
      <main className="flex-1 overflow-y-auto p-6 md:p-10 bg-[#f4f7f8]">
        {renderContent()}
      </main>
    </div>
  );
}
