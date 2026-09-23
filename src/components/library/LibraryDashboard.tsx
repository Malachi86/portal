'use client';

import React, { useState, useEffect } from 'react';
import Layout from '../shared/Layout';
import { BookOpen, FileText, Loader2 } from 'lucide-react';
import ManageBooks from './ManageBooks';
import BorrowRequests from './BorrowRequests';
import BorrowRecords from './BorrowRecords';
import ScanLend from './ScanLend';
import ProfileView from '../shared/ProfileView';
import { getBooksAction, getBorrowRequestsAction } from '@/app/actions/dbActions';
import { Card } from '../ui/card';

function StatCard({ icon, label, value, onClick }: { icon: React.ReactNode, label: string, value: number | string, onClick?: () => void }) {
  return (
    <Card
      className="p-6 cursor-pointer hover:shadow-xl transition-shadow"
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-4">
        {icon}
      </div>
      <p className="text-gray-600 text-sm mb-2">{label}</p>
      <p className="text-3xl font-semibold">{value}</p>
    </Card>
  );
}

export default function LibraryDashboard() {
  const [currentView, setCurrentView] = useState('home');
  const [loadingStats, setLoadingStats] = useState(true);
  const [stats, setStats] = useState({
    totalBooks: 0,
    available: 0,
    borrowed: 0,
    pendingRequests: 0
  });

  useEffect(() => {
    if (currentView === 'home') {
      loadStats();
    }
  }, [currentView]);

  const loadStats = async () => {
    setLoadingStats(true);
    try {
        const books = await getBooksAction();
        const requests = await getBorrowRequestsAction();

        setStats({
        totalBooks: books.length,
        available: books.filter((b: any) => b.status === 'available').length,
        borrowed: books.filter((b: any) => b.status === 'borrowed').length,
        pendingRequests: requests.filter((r: any) => r.status === 'pending').length
        });
    } catch(e) {
        console.error("Failed to load stats", e);
    } finally {
        setLoadingStats(false);
    }
  };

  const renderHome = () => (
    <div>
      <h2 className="text-3xl mb-2">Library Dashboard</h2>
      <p className="text-gray-600 mb-8">Library management overview</p>

      {loadingStats ? <div className="flex justify-center p-12"><Loader2 className="animate-spin text-primary" size={32}/></div> :
        <div className="grid md:grid-cols-4 gap-6">
          <StatCard
            icon={<BookOpen className="text-primary" size={32} />}
            label="Total Books"
            value={stats.totalBooks}
            onClick={() => setCurrentView('books')}
          />
          <StatCard
            icon={<BookOpen className="text-green-600" size={32} />}
            label="Available"
            value={stats.available}
            onClick={() => setCurrentView('books')}
          />
          <StatCard
            icon={<BookOpen className="text-blue-600" size={32} />}
            label="Borrowed"
            value={stats.borrowed}
            onClick={() => setCurrentView('borrow-records')}
          />
          <StatCard
            icon={<FileText className="text-orange-600" size={32} />}
            label="Pending Requests"
            value={stats.pendingRequests}
            onClick={() => setCurrentView('borrow-requests')}
          />
        </div>
      }
    </div>
  );

  const renderContent = () => {
    switch (currentView) {
      case 'home':
        return renderHome();
      case 'books':
        return <ManageBooks />;
      case 'scan-lend':
        return <ScanLend />;
      case 'borrow-requests':
        return <BorrowRequests />;
      case 'borrow-records':
        return <BorrowRecords />;
      case 'profile':
        return <ProfileView />;
      default:
        return renderHome();
    }
  };

  return (
    <Layout currentView={currentView} onNavigate={setCurrentView}>
      {renderContent()}
    </Layout>
  );
}
