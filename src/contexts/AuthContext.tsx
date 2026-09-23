
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { User } from '../utils/storage';
import { 
    getUserByIdAction, 
    updateLastSeenAction, 
    registerDeviceAction, 
    checkDeviceBanAction,
    banDeviceAction
} from '@/app/actions/dbActions';
import { getDeviceFingerprint, isAttackPatternDetected, recordMaliciousAttempt } from '@/utils/device';
import { toast } from 'sonner';
import { Lock, ShieldAlert } from 'lucide-react';

interface AuthContextType {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
  updateCurrentUser: (updates: Partial<User>) => void;
  loading: boolean;
  isDeviceBanned: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDeviceBanned, setIsDeviceBanned] = useState(false);

  const logout = () => {
    localStorage.removeItem('currentUserId');
    localStorage.removeItem('cached_user_profile');
    setUser(null);
    window.location.href = '/';
  };

  useEffect(() => {
    const initializeSecurity = async () => {
        const deviceId = getDeviceFingerprint();
        
        // 1. Check for local attack detection
        if (isAttackPatternDetected()) {
            await banDeviceAction(deviceId, "Heuristic Attack Pattern Detected");
            setIsDeviceBanned(true);
            return;
        }

        // 2. Check for server-side ban
        const isBanned = await checkDeviceBanAction(deviceId);
        if (isBanned) {
            setIsDeviceBanned(true);
            setLoading(false);
            return;
        }

        // 3. Register device visit
        const currentUserId = localStorage.getItem('currentUserId');
        await registerDeviceAction(deviceId, currentUserId || undefined);

        // 4. Identity logic
        if (currentUserId) {
            if (currentUserId === 'admin') {
                const admin = {
                  id: 'admin',
                  name: 'System Administrator',
                  email: 'admin@school.edu',
                  password: 'ADMIN@2026',
                  role: 'admin' as const,
                  department: 'college' as const
                };
                setUser(admin);
            } else {
                try {
                    const currentUser = await getUserByIdAction(currentUserId);
                    if (currentUser) {
                        if (currentUser.isBanned) {
                            toast.error("SECURITY PROTOCOL: Your account has been permanently terminated.");
                            logout();
                            return;
                        }
                        setUser(currentUser);
                        localStorage.setItem('cached_user_profile', JSON.stringify(currentUser));
                    } else {
                        const cached = localStorage.getItem('cached_user_profile');
                        if (cached) setUser(JSON.parse(cached));
                        else logout();
                    }
                } catch (e: any) {
                    const cached = localStorage.getItem('cached_user_profile');
                    if (cached) setUser(JSON.parse(cached));
                }
            }
        }
        setLoading(false);
    };
    initializeSecurity();
  }, []);

  // Neural Sync Heartbeat
  useEffect(() => {
    if (!user || user.id === 'admin') return;

    const interval = setInterval(async () => {
      try {
          await updateLastSeenAction(user.id);
      } catch (e: any) {
          console.warn("Heartbeat delayed.");
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [user]);

  const login = (userToLogin: User) => {
    if (userToLogin.isBanned) {
        toast.error("ACCESS DENIED: Account is blacklisted.");
        return;
    }
    const deviceId = getDeviceFingerprint();
    registerDeviceAction(deviceId, userToLogin.id);
    
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
    user, login, logout, updateCurrentUser, loading, isDeviceBanned
  }), [user, loading, isDeviceBanned]);

  if (isDeviceBanned) {
      return (
          <div className="min-h-screen flex items-center justify-center bg-black p-10">
              <Card className="max-w-md w-full p-10 bg-zinc-900 border-red-900/50 border-2 rounded-[3rem] shadow-2xl text-center space-y-8">
                  <div className="h-24 w-24 bg-red-600 rounded-[2rem] flex items-center justify-center mx-auto shadow-xl shadow-red-900/20 animate-pulse">
                      <Lock size={48} className="text-white" />
                  </div>
                  <div className="space-y-4">
                      <h1 className="text-3xl font-black text-white uppercase tracking-tighter">Device Terminated</h1>
                      <p className="text-red-500 font-bold text-xs uppercase tracking-[0.3em]">Protocol Code: BAN-403-IRONWALL</p>
                      <p className="text-zinc-500 text-sm leading-relaxed">
                          Your hardware signature has been blacklisted for unauthorized activity. 
                          All access to the AMS:AMACC infrastructure is permanently revoked.
                      </p>
                  </div>
                  <div className="p-4 bg-zinc-800 rounded-2xl border border-zinc-700">
                      <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Digital ID Trace</p>
                      <p className="text-[10px] text-zinc-500 font-mono mt-1 break-all">{getDeviceFingerprint()}</p>
                  </div>
              </Card>
          </div>
      );
  }

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
                <p className="text-[8px] font-bold text-primary/40 mt-2 tracking-[0.3em] uppercase">Neural Sync Initializing...</p>
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
