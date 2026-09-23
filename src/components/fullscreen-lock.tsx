'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getLabRequestsAction } from '@/app/actions/dbActions';
import { Lock, Zap, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function FullscreenLock({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [isLocked, setIsLocked] = useState(false);
  const [booted, setBooted] = useState(false);

  const checkSession = useCallback(async () => {
    if (!user || user.role === 'admin') {
      setIsLocked(false);
      return;
    }

    try {
      const requests = await getLabRequestsAction();
      const now = new Date();
      
      const activeSession = requests.find(r => 
        r.studentId === user.id && 
        r.status === 'approved' &&
        new Date(r.startTime) <= now &&
        new Date(r.endTime) >= now
      );

      // 5-minute grace period check
      const recentlyEnded = requests.find(r => 
        r.studentId === user.id &&
        r.status === 'approved' &&
        now.getTime() - new Date(r.endTime).getTime() <= 300000 
      );

      setIsLocked(!activeSession && !recentlyEnded);
    } catch (e) {
      console.warn("Registry sync failed.");
    }
  }, [user]);

  useEffect(() => {
    if (!booted) return;
    checkSession();
    const interval = setInterval(checkSession, 5000);
    return () => clearInterval(interval);
  }, [booted, checkSession]);

  const handleBoot = () => {
    const docEl = document.documentElement;
    if (docEl.requestFullscreen) {
      docEl.requestFullscreen().catch(() => {});
    }
    setBooted(true);
  };

  if (!booted) {
    return (
      <div className="fixed inset-0 bg-[#1f363d] z-[9999] flex items-center justify-center p-10 overflow-hidden">
        <div className="max-w-md w-full text-center space-y-10">
          <div className="h-32 w-32 bg-orange-500 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-xl animate-pulse">
            <Zap size={64} className="text-white" />
          </div>
          <div className="space-y-4">
            <h1 className="text-4xl font-black text-white uppercase tracking-tighter">System Terminal</h1>
            <p className="text-white/40 font-bold text-xs uppercase tracking-[0.3em]">Initialize Terminal Hardware</p>
          </div>
          <Button 
            onClick={handleBoot}
            className="w-full h-20 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-black uppercase text-sm tracking-[0.2em] shadow-2xl transition-all active:scale-95"
          >
            INITIALIZE SYSTEM
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={cn("transition-all duration-700", isLocked ? "blur-3xl grayscale opacity-20 pointer-events-none" : "blur-0 grayscale-0 opacity-100")}>
        {children}
      </div>

      {isLocked && (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/60 backdrop-blur-xl">
          <div className="max-w-xl w-full p-12 bg-[#1f363d] rounded-[3.5rem] shadow-2xl border-t-8 border-red-600 text-center space-y-10 relative overflow-hidden">
             <div className="h-24 w-24 bg-red-600 rounded-[2rem] flex items-center justify-center mx-auto">
                <Lock size={48} className="text-white animate-pulse" />
             </div>
             <div className="space-y-4">
                <h3 className="text-3xl font-black text-white uppercase tracking-tighter">Station Restricted</h3>
                <p className="text-white/60 text-sm font-bold leading-relaxed px-6">
                  Terminal locked. Request access from the Registry Dashboard and wait for Administrator or Faculty Handler authorization.
                </p>
             </div>
             <div className="flex items-center justify-center gap-3 pt-6">
                <Loader2 className="animate-spin text-orange-500" size={24} />
                <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">Waiting for Registry Handshake...</span>
             </div>
          </div>
        </div>
      )}
    </>
  );
}