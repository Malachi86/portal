'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useUser, useFirestore, useDoc } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Lock, Maximize, ShieldAlert, AlertTriangle, Clock, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function FullscreenLock({ children }: { children: React.ReactNode }) {
  const { user } = () => {
    // Client-safe retrieval of state
    const res = useUser();
    return res || { user: null, loading: false };
  };
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

  // Grace period countdown logic (5 minutes = 300 seconds after session expires)
  useEffect(() => {
    if (sessionData?.status === 'Expired' && sessionData?.expiresAt) {
      const expiryTime = new Date(sessionData.expiresAt).getTime();
      const graceEndTime = expiryTime + 5 * 60 * 1000; // 5 minutes grace period

      const interval = setInterval(() => {
        const remaining = Math.max(0, Math.floor((graceEndTime - Date.now()) / 1000));
        if (remaining > 0) {
          setGraceTimeLeft(remaining);
        } else {
          setGraceTimeLeft(0);
          clearInterval(interval);
        }
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

  // 1. If not in fullscreen, force them to enter fullscreen immediately (Kiosk Restriction)
  if (!isFullscreen) {
    return (
      <div className="fixed inset-0 z-[9999] bg-slate-950 flex flex-col items-center justify-center p-6 text-center select-none text-white">
        <div className="max-w-md w-full space-y-6 bg-slate-900/80 p-8 rounded-[2rem] border border-slate-800 shadow-2xl">
          <div className="flex justify-center">
            <ShieldAlert className="h-20 w-20 text-primary animate-bounce" />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-black tracking-tight text-white">KIOSK MODE REQUIRED</h1>
            <p className="text-sm text-slate-400">
              This Nexus Secure Terminal is strictly locked. You must enter Fullscreen mode to interact with the device.
            </p>
          </div>
          <Button size="lg" onClick={requestFullscreen} className="w-full h-14 text-lg font-black gap-2 bg-primary hover:bg-primary/90 text-white rounded-xl shadow-lg">
            <Maximize className="h-5 w-5" /> ENTER FULLSCREEN SECURE MODE
          </Button>
          <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
            Nexus Engine Secure Kiosk Terminal v2.0
          </div>
        </div>
      </div>
    );
  }

  // 2. If not logged in, let them see the login panel, but inside fullscreen
  if (!currentUser) {
    return <>{children}</>;
  }

  // 3. Admin has total freedom
  if (userData?.role === 'admin') {
    return <>{children}</>;
  }

  // 4. If request is pending approval, lock them in a restricted overlay
  if (sessionData?.status === 'Pending') {
    return (
      <div className="fixed inset-0 z-[9999] bg-slate-950 flex flex-col items-center justify-center p-6 text-center text-white">
        <div className="max-w-lg w-full space-y-6 bg-slate-900 p-10 rounded-[2.5rem] border-2 border-amber-500/30 shadow-2xl">
          <div className="flex justify-center">
            <div className="relative">
              <Clock className="h-24 w-24 text-amber-500 animate-spin [animation-duration:10s]" />
              <Lock className="h-8 w-8 text-amber-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-black tracking-tight uppercase text-amber-500">AUTHORIZATION PENDING</h2>
            <p className="text-slate-300 font-medium">
              Workstation <span className="font-mono text-white bg-slate-800 px-2 py-1 rounded">PC-{sessionData.pcNumber}</span> is locked.
            </p>
            <p className="text-sm text-slate-400 max-w-sm mx-auto mt-2">
              Waiting for the laboratory handler or administrator to approve your request. Do not close or minimize.
            </p>
          </div>
          <div className="pt-4 border-t border-slate-800 flex flex-col gap-2">
            <div className="text-xs font-mono text-slate-500 uppercase">
              Room: {sessionData.labName} • Duration: {sessionData.durationMinutes} mins
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 5. If session is expired, check the 5-minute grace period
  if (sessionData?.status === 'Expired') {
    if (graceTimeLeft !== null && graceTimeLeft > 0) {
      // Within 5 minutes grace period, allow them inside the dashboard to submit another request
      return (
        <>
          <div className="bg-amber-600 text-white text-center py-2 px-4 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 animate-pulse sticky top-0 z-50">
            <AlertTriangle className="h-4 w-4" />
            GRACE PERIOD ACTIVE: {Math.floor(graceTimeLeft / 60)}:{(graceTimeLeft % 60).toString().padStart(2, '0')} remaining to request another PC session before lockout!
          </div>
          {children}
        </>
      );
    } else {
      // Grace period has ended or not initialized yet, hard lock back to kiosk setup
      return (
        <div className="fixed inset-0 z-[9999] bg-slate-950 flex flex-col items-center justify-center p-6 text-center text-white">
          <div className="max-w-md w-full space-y-6 bg-slate-900 p-8 rounded-[2rem] border border-red-500/30 shadow-2xl">
            <div className="flex justify-center">
              <ShieldAlert className="h-20 w-20 text-red-500" />
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-black tracking-tight uppercase text-red-500">SESSION EXPIRED</h2>
              <p className="text-sm text-slate-400">
                Your allowed laboratory usage and 5-minute grace period have ended. Access has been revoked.
              </p>
            </div>
            <div className="p-4 bg-slate-950 rounded-xl font-mono text-xs text-slate-400 border border-slate-800">
              Please release the terminal for the next student or log out.
            </div>
            <div className="pt-2">
              {children}
            </div>
          </div>
        </div>
      );
    }
  }

  // 6. Otherwise (Approved session or standard state), render normally inside fullscreen kiosk
  return <>{children}</>;
}
