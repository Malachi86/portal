'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { User } from '../utils/storage';
import { 
    getUserByIdAction, 
    updateLastSeenAction
} from '@/app/actions/dbActions';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
  updateCurrentUser: (updates: Partial<User>) => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const logout = () => {
    localStorage.removeItem('currentUserId');
    localStorage.removeItem('cached_user_profile');
    setUser(null);
    window.location.href = '/';
  };

  useEffect(() => {
    const initializeAuth = async () => {
        const currentUserId = localStorage.getItem('currentUserId');
        
        if (currentUserId) {
            if (currentUserId === 'admin') {
                const admin: User = {
                  id: 'admin',
                  name: 'System Administrator',
                  email: 'admin@school.edu',
                  password: 'ADMIN@2026',
                  role: 'admin',
                  department: 'college'
                };
                setUser(admin);
            } else {
                try {
                    const currentUser = await getUserByIdAction(currentUserId);
                    if (currentUser) {
                        setUser(currentUser);
                        localStorage.setItem('cached_user_profile', JSON.stringify(currentUser));
                    } else {
                        const cached = localStorage.getItem('cached_user_profile');
                        if (cached) setUser(JSON.parse(cached));
                        else logout();
                    }
                } catch (e) {
                    const cached = localStorage.getItem('cached_user_profile');
                    if (cached) setUser(JSON.parse(cached));
                }
            }
        }
        setLoading(false);
    };
    initializeAuth();
  }, []);

  // Neural Sync Heartbeat
  useEffect(() => {
    if (!user || user.id === 'admin') return;

    const interval = setInterval(async () => {
      try {
          await updateLastSeenAction(user.id);
      } catch (e) {
          console.warn("Heartbeat delayed.");
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [user]);

  const login = (userToLogin: User) => {
    localStorage.setItem('currentUserId', userToLogin.id);
    localStorage.setItem('cached_user_profile', JSON.stringify(userToLogin));
    setUser(userToLogin);
  };

  const updateCurrentUser = (updates: Partial<User>) => {
    if (user) {
        const updatedUser = { ...user, ...updates };
        setUser(updatedUser);
        localStorage.setItem('cached_user_profile', JSON.stringify(updatedUser));
    }
  };

  const contextValue = useMemo(() => ({
    user, login, logout, updateCurrentUser, loading
  }), [user, loading]);

  return (
    <AuthContext.Provider value={contextValue}>
      {loading && !user ? (
        <div className="flex flex-col items-center justify-center min-h-screen bg-white p-4">
            <div className="animate-pulse flex flex-col items-center">
                <div className="w-16 h-16 bg-primary rounded-2xl mb-4 flex items-center justify-center shadow-lg">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m8 3 4 8 5-5 5 15H2L8 3z"/>
                  </svg>
                </div>
                <p className="text-muted-foreground font-black uppercase tracking-[0.2em] text-sm">AMS:AMACC</p>
                <p className="text-[8px] font-bold text-primary/40 mt-2 tracking-[0.3em] uppercase">Initializing Terminal...</p>
            </div>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
