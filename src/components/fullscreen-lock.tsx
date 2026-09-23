'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useUser, useFirestore, useDoc } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Lock, Maximize, ShieldAlert, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function FullscreenLock({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  const firestore = useFirestore();
  const [isLocked, setIsLocked] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const { data: userData } = useDoc(user && firestore ? doc(firestore, 'users', user.uid) : null);
  const { data: sessionData } = useDoc(
    userData?.activeSessionId && firestore ? doc(firestore, 'requests', userData.activeSessionId) : null
  );

  const checkFullscreen = useCallback(() => {
    setIsFullscreen(!!document.fullscreenElement);
  }, []);

  useEffect(() => {
    document.addEventListener('fullscreenchange', checkFullscreen);
    window.addEventListener('resize', checkFullscreen);
    return () => {
      document.removeEventListener('fullscreenchange', checkFullscreen);
      window.removeEventListener('resize', checkFullscreen);
    };
  }, [checkFullscreen]);

  useEffect(() => {
    if (userData?.role === 'admin') {
      setIsLocked(false);
      return;
    }

    const isApproved = sessionData?.status === 'Approved';
    const isExpired = sessionData?.status === 'Expired';
    
    // Lock if no user, if session is pending, or if session is expired
    setIsLocked(!isApproved || isExpired);
  }, [userData, sessionData]);

  const requestFullscreen = () => {
    document.documentElement.requestFullscreen().catch((e) => {
      console.error('Fullscreen request failed:', e);
    });
  };

  // Aggressively re-request fullscreen if locked
  useEffect(() => {
    if (isLocked && !isFullscreen) {
      const timer = setInterval(() => {
        // We can't force it without user gesture, but we can nudge
      }, 2000);
      return () => clearInterval(timer);
    }
  }, [isLocked, isFullscreen]);

  if (!isLocked && isFullscreen) {
    return <>{children}</>;
  }

  return (
    <div className="fixed inset-0 z-[9999] bg-background flex flex-col items-center justify-center p-6 text-center select-none overflow-hidden touch-none">
      <div className="max-w-lg w-full space-y-8 animate-in fade-in zoom-in duration-500">
        <div className="flex justify-center">
          <div className="relative">
            <ShieldAlert className="h-28 w-28 text-primary animate-pulse" />
            <div className="absolute -bottom-2 -right-2 bg-destructive text-white p-2 rounded-full shadow-lg border-4 border-background">
              <Lock className="h-6 w-6" />
            </div>
          </div>
        </div>
        
        <div className="space-y-4">
          <h1 className="text-5xl font-black tracking-tighter text-primary">
            TERMINAL RESTRICTED
          </h1>
          <p className="text-xl text-muted-foreground font-medium max-w-md mx-auto">
            Unauthorized access detected. This workstation is strictly managed.
          </p>
        </div>

        {!isFullscreen ? (
          <div className="p-8 bg-primary/5 rounded-3xl border-2 border-primary/20 shadow-2xl space-y-6">
            <div className="flex items-center gap-3 justify-center text-primary">
              <AlertTriangle className="h-6 w-6" />
              <span className="text-lg font-bold">Action Required: Enable Kiosk Mode</span>
            </div>
            <Button size="lg" onClick={requestFullscreen} className="w-full h-16 text-xl font-black gap-3 shadow-xl hover:scale-[1.02] transition-transform">
              <Maximize className="h-6 w-6" /> ENTER FULLSCREEN
            </Button>
            <p className="text-sm text-muted-foreground italic">
              Terminal must be in fullscreen to allow login or session usage.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="p-6 bg-muted/50 rounded-2xl border border-dashed border-muted-foreground/30">
              <p className="text-lg font-bold text-muted-foreground flex items-center justify-center gap-3">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-500"></span>
                </span>
                Waiting for Administrator Authorization...
              </p>
            </div>
            <div className="pt-4 opacity-100">
              {children}
            </div>
          </div>
        )}
      </div>
      
      <div className="fixed bottom-6 text-xs text-muted-foreground/40 font-mono uppercase tracking-[0.2em]">
        Nexus Engine Secure Kiosk Terminal v2.0
      </div>
    </div>
  );
}
