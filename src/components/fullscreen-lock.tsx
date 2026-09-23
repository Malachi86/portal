'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useUser, useFirestore, useDoc } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Lock, Maximize, ShieldAlert, Clock, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function FullscreenLock({ children }: { children: React.ReactNode }) {
  const { user: currentUser } = useUser();
  const firestore = useFirestore();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [graceTimeLeft, setGraceTimeLeft] = useState<number | null>(null);

  const { data: userData } = useDoc(currentUser && firestore ? doc(firestore, 'users', currentUser.uid) : null);
  const { data: sessionData } = useDoc(
    userData?.activeSessionId && firestore ? doc(firestore, 'requests', userData.activeSessionId) : null
  );

  const checkFullscreen = useCallback(() => {
    setIsFullscreen(!!document.fullscreenElement);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsFullscreen(!!document.fullscreenElement);
      document.addEventListener('fullscreenchange', checkFullscreen);
      window.addEventListener('resize', checkFullscreen);
    }
    return () => {
      if (typeof window !== 'undefined') {
        document.removeEventListener('fullscreenchange', checkFullscreen);
        window.removeEventListener('resize', checkFullscreen);
      }
    };
  }, [checkFullscreen]);

  useEffect(() => {
    if (sessionData?.status === 'Expired' && sessionData?.expiresAt) {
      const expiryTime = new Date(sessionData.expiresAt).getTime();
      const graceEndTime = expiryTime + 5 * 60 * 1000;

      const interval = setInterval(() => {
        const remaining = Math.max(0, Math.floor((graceEndTime - Date.now()) / 1000));
        setGraceTimeLeft(remaining);
        if (remaining <= 0) clearInterval(interval);
      }, 1000);

      return () => clearInterval(interval);
    } else {
      setGraceTimeLeft(null);
    }
  }, [sessionData]);

  const requestFullscreen = () => {
    if (typeof window !== 'undefined') {
      document.documentElement.requestFullscreen().catch((e) => {
        console.error('Fullscreen request failed:', e);
      });
    }
  };

  // KIOSK BOOT OVERLAY (Required because browser blocks auto-fullscreen)
  if (!isFullscreen) {
    return (
      <div className="fixed inset-0 z-[9999] sidebar-gradient flex flex-col items-center justify-center p-6 text-center text-white">
        <div className="max-w-xl w-full space-y-10 animate-in zoom-in-95 duration-500">
          <div className="flex justify-center flex-col items-center gap-4">
            <div className="h-32 w-32 bg-accent/20 rounded-[2.5rem] flex items-center justify-center border-4 border-accent animate-pulse">
              <ShieldAlert className="h-16 w-16 text-accent" />
            </div>
            <div className="flex flex-col items-center">
               <h1 className="text-5xl font-black italic tracking-tighter leading-none">AMA</h1>
               <span className="text-sm font-bold text-accent uppercase tracking-[0.4em] mt-2">Nexus Secure Node</span>
            </div>
          </div>
          
          <div className="space-y-4">
            <h2 className="text-3xl font-black text-white/90">TERMINAL LOCKED</h2>
            <p className="text-white/40 font-medium max-w-sm mx-auto">
              Unauthorized access detected. This workstation requires active system engagement.
            </p>
          </div>

          <Button 
            size="lg" 
            onClick={requestFullscreen} 
            className="w-full h-24 text-2xl font-black gap-4 bg-accent hover:bg-accent/90 text-white rounded-[2rem] shadow-[0_20px_50px_rgba(240,113,72,0.3)] transition-all hover:scale-[1.02]"
          >
            <Maximize className="h-8 w-8" /> INITIALIZE SYSTEM
          </Button>

          <div className="pt-10 flex items-center justify-center gap-4 text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">
            <span className="w-12 h-[1px] bg-white/10" />
            SECURE ACCESS PROTOCOL V4.2
            <span className="w-12 h-[1px] bg-white/10" />
          </div>
        </div>
      </div>
    );
  }

  if (!currentUser) return <>{children}</>;
  if (userData?.role === 'admin') return <>{children}</>;

  if (sessionData?.status === 'Pending') {
    return (
      <div className="fixed inset-0 z-[9999] sidebar-gradient flex flex-col items-center justify-center p-6 text-center text-white">
        <div className="max-w-xl w-full space-y-8 bg-black/20 p-16 rounded-[4rem] border border-white/10 shadow-2xl backdrop-blur-xl">
          <div className="relative flex justify-center">
            <Clock className="h-32 w-32 text-accent animate-spin [animation-duration:15s]" />
            <Lock className="h-10 w-10 text-accent absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <div className="space-y-4">
            <h2 className="text-4xl font-black text-accent tracking-tighter uppercase">Waiting for Admin</h2>
            <p className="text-white/50 text-lg font-medium">Workstation PC-{sessionData.pcNumber} is currently restricted.</p>
          </div>
          <div className="p-6 bg-white/5 rounded-3xl border border-white/10 text-xs font-black uppercase tracking-widest text-white/30">
            Secure Queue: Active Room {sessionData.labName}
          </div>
        </div>
      </div>
    );
  }

  if (sessionData?.status === 'Expired') {
    if (graceTimeLeft !== null && graceTimeLeft > 0) {
      return (
        <>
          <div className="bg-accent text-white text-center py-3 px-4 text-xs font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 animate-pulse sticky top-0 z-[100] shadow-xl">
            <AlertTriangle className="h-5 w-5" />
            GRACE PERIOD: {Math.floor(graceTimeLeft / 60)}:{(graceTimeLeft % 60).toString().padStart(2, '0')} remaining to request extension
          </div>
          {children}
        </>
      );
    } else {
      return (
        <div className="fixed inset-0 z-[9999] bg-[#7b221a] flex flex-col items-center justify-center p-6 text-center text-white">
          <div className="max-w-md w-full space-y-8 animate-in slide-in-from-bottom-10 duration-500">
            <ShieldAlert className="h-32 w-32 text-white/20 mx-auto" />
            <h2 className="text-5xl font-black tracking-tighter italic">ACCESS REVOKED</h2>
            <p className="text-white/60 text-lg font-medium">Your session and grace period have expired.</p>
            <div className="p-8 bg-black/20 rounded-[3rem] border border-white/10">
              <p className="text-xs font-black text-white/40 uppercase tracking-widest">Please vacate the terminal immediately.</p>
            </div>
            {children}
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
}
