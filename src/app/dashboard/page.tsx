'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useUser, useFirestore, useCollection, useDoc } from '@/firebase';
import { collection, doc, addDoc, updateDoc, query, where, limit } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Monitor, Clock, LogOut, Laptop, User, AlertCircle, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { useAuth } from '@/firebase';

export default function UserDashboard() {
  const { user } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const router = useRouter();
  
  const { data: userData } = useDoc(user && firestore ? doc(firestore, 'users', user.uid) : null);
  const { data: labs } = useCollection(firestore ? collection(firestore, 'laboratories') : null);
  const [selectedLabId, setSelectedLabId] = useState<string | null>(null);
  
  const pcCollection = useMemo(() => 
    selectedLabId && firestore ? collection(firestore, 'laboratories', selectedLabId, 'pcs') : null,
    [selectedLabId, firestore]
  );
  const { data: pcs } = useCollection(pcCollection);

  const { data: currentSession } = useDoc(
    userData?.activeSessionId && firestore ? doc(firestore, 'requests', userData.activeSessionId) : null
  );

  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [showExtension, setShowExtension] = useState(false);

  useEffect(() => {
    if (currentSession?.status === 'Approved' && currentSession.expiresAt) {
      const interval = setInterval(() => {
        const remaining = new Date(currentSession.expiresAt).getTime() - Date.now();
        const seconds = Math.max(0, Math.floor(remaining / 1000));
        setTimeLeft(seconds);
        
        // 5-minute warning (300 seconds)
        if (seconds <= 300 && seconds > 0) {
          setShowExtension(true);
        } else if (seconds === 0) {
          handleSessionExpire();
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [currentSession]);

  const handleSessionExpire = () => {
    if (!firestore || !currentSession || !userData) return;
    
    updateDoc(doc(firestore, 'requests', userData.activeSessionId), {
      status: 'Expired'
    });

    updateDoc(doc(firestore, 'laboratories', currentSession.labId, 'pcs', currentSession.pcNumber), {
      status: 'Available',
      currentUserId: null,
      currentUserName: null,
      requestId: null
    });
  };

  const handleRequest = (pcNumber: string) => {
    if (!user || !selectedLabId || !firestore || !userData) return;
    const lab = labs?.find(l => l.id === selectedLabId);
    
    const requestData = {
      userId: user.uid,
      userName: userData.fullName,
      userRole: userData.role,
      labId: selectedLabId,
      labName: lab?.name || 'Unknown',
      pcNumber,
      durationMinutes: 60,
      status: 'Pending',
      createdAt: new Date().toISOString()
    };

    addDoc(collection(firestore, 'requests'), requestData).then((docRef) => {
      updateDoc(doc(firestore, 'laboratories', selectedLabId, 'pcs', pcNumber), {
        status: 'Pending',
        currentUserId: user.uid,
        currentUserName: userData.fullName,
        requestId: docRef.id
      });

      updateDoc(doc(firestore, 'users', user.uid), {
        activeSessionId: docRef.id
      });
      toast({ title: 'Request Sent', description: 'Waiting for authorization from instructor.' });
    });
  };

  const handleExtension = () => {
    if (!firestore || !currentSession || !userData) return;
    
    toast({ title: 'Extension Requested', description: 'Request for +30 mins sent to Admin.' });
    // In a real app, this would create a sub-request or alert the admin
  };

  const handleLogout = async () => {
    if (!auth) return;
    try {
      if (currentSession?.status === 'Approved' && currentSession.pcNumber) {
        updateDoc(doc(firestore!, 'laboratories', currentSession.labId, 'pcs', currentSession.pcNumber), {
          status: 'Available',
          currentUserId: null,
          currentUserName: null,
          requestId: null
        });
      }
      await signOut(auth);
      router.push('/login');
    } catch (e) {
      console.error(e);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl shadow-lg border-2 border-primary/5">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary/20">
            <User className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight uppercase">{userData?.fullName}</h1>
            <p className="text-xs text-muted-foreground uppercase tracking-[0.2em] font-black flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              {userData?.role} • {userData?.identifier}
            </p>
          </div>
        </div>
        <Button variant="ghost" className="text-destructive font-bold hover:bg-destructive/10 h-12 px-6 rounded-xl" onClick={handleLogout}>
          <LogOut className="h-4 w-4 mr-2" /> LOGOUT
        </Button>
      </div>

      {currentSession && currentSession.status !== 'Expired' ? (
        <Card className="border-none bg-primary text-primary-foreground shadow-2xl overflow-hidden rounded-[2.5rem]">
          <CardContent className="p-10">
            <div className="flex flex-col md:flex-row justify-between items-center gap-8">
              <div className="space-y-4 text-center md:text-left">
                <Badge variant="secondary" className="bg-white/20 text-white border-none font-black tracking-widest px-4 py-1">
                  {currentSession.status === 'Approved' ? 'LIVE SESSION' : 'PENDING APPROVAL'}
                </Badge>
                <div>
                  <h2 className="text-5xl font-black tracking-tighter">{currentSession.labName}</h2>
                  <p className="text-white/70 flex items-center justify-center md:justify-start gap-2 text-xl font-medium mt-2">
                    <Monitor className="h-6 w-6" /> WORKSTATION #{currentSession.pcNumber}
                  </p>
                </div>
              </div>

              {currentSession.status === 'Approved' ? (
                <div className="flex flex-col items-center gap-4">
                  <div className="bg-white/10 backdrop-blur-md p-8 rounded-[2rem] border border-white/20 text-center min-w-[240px]">
                    <div className="text-xs font-black text-white/50 mb-2 uppercase tracking-widest">Remaining Duration</div>
                    <div className={`text-6xl font-black font-mono tabular-nums ${timeLeft < 300 ? 'text-red-300 animate-pulse' : ''}`}>
                      {formatTime(timeLeft)}
                    </div>
                  </div>
                  {showExtension && (
                    <Button onClick={handleExtension} className="bg-white text-primary hover:bg-white/90 font-black h-12 w-full rounded-2xl gap-2">
                      <Sparkles className="h-5 w-5" /> REQUEST EXTENSION
                    </Button>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center gap-6 p-8 bg-white/5 rounded-3xl border border-white/10">
                  <div className="relative">
                    <div className="h-16 w-16 rounded-full border-4 border-white/20 border-t-white animate-spin"></div>
                    <Clock className="h-6 w-6 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                  </div>
                  <div className="text-center space-y-1">
                    <p className="text-xl font-black">Authorizing Access...</p>
                    <p className="text-sm text-white/60">Please wait for Admin verification.</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-1 border-none shadow-xl rounded-3xl h-fit">
            <CardHeader className="pb-4">
              <CardTitle className="text-2xl font-black tracking-tight">SESSION SETUP</CardTitle>
              <CardDescription className="text-base">Choose your laboratory to unlock a PC.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <label className="text-xs font-black text-muted-foreground uppercase tracking-widest">Laboratory Room</label>
                <Select onValueChange={setSelectedLabId}>
                  <SelectTrigger className="h-16 rounded-2xl text-lg font-bold border-2 border-primary/10">
                    <SelectValue placeholder="SELECT LABORATORY" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-2">
                    {labs?.map(lab => (
                      <SelectItem key={lab.id} value={lab.id} className="text-lg font-medium p-4">{lab.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="p-6 bg-muted/40 rounded-3xl space-y-4">
                <div className="flex justify-between text-xs font-black uppercase tracking-widest opacity-40">
                  <span>Workstation Legend</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 text-sm font-bold">
                    <div className="h-3 w-3 rounded-full bg-green-500 shadow-sm" /> Available
                  </div>
                  <div className="flex items-center gap-3 text-sm font-bold">
                    <div className="h-3 w-3 rounded-full bg-red-500 shadow-sm" /> Occupied
                  </div>
                  <div className="flex items-center gap-3 text-sm font-bold">
                    <div className="h-3 w-3 rounded-full bg-yellow-500 shadow-sm" /> Pending
                  </div>
                  <div className="flex items-center gap-3 text-sm font-bold">
                    <div className="h-3 w-3 rounded-full bg-slate-300 shadow-sm" /> Down
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2 border-none shadow-xl rounded-3xl overflow-hidden">
            <CardHeader className="bg-primary/5 border-b border-primary/5 p-8 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-black tracking-tight uppercase">Terminal Grid</CardTitle>
                <CardDescription className="text-base font-medium">Select an open PC to request authorization.</CardDescription>
              </div>
              {selectedLabId && <Badge className="h-8 px-4 text-sm font-black uppercase tracking-widest">{pcs?.length || 0} PC Nodes</Badge>}
            </CardHeader>
            <CardContent className="p-8">
              {!selectedLabId ? (
                <div className="flex flex-col items-center justify-center py-24 text-muted-foreground space-y-4">
                  <Laptop className="h-24 w-24 mb-4 opacity-10 animate-pulse" />
                  <p className="text-xl font-bold italic opacity-30">Select a room to scan available terminals</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {pcs?.map(pc => (
                    <Button
                      key={pc.id}
                      variant="outline"
                      className={`h-24 flex-col gap-1 rounded-2xl transition-all border-2 shadow-sm ${
                        pc.status === 'Available' ? 'hover:border-primary border-green-200 bg-green-50/20 hover:scale-[1.05]' : 
                        pc.status === 'Occupied' ? 'opacity-40 cursor-not-allowed border-red-200 bg-red-50' : 
                        'opacity-40 cursor-not-allowed border-yellow-200 bg-yellow-50'
                      }`}
                      disabled={pc.status !== 'Available'}
                      onClick={() => handleRequest(pc.pcNumber)}
                    >
                      <span className="text-[10px] font-black opacity-30 uppercase tracking-widest">Node</span>
                      <span className="text-2xl font-black tracking-tighter">{pc.pcNumber}</span>
                      <div className={`h-1.5 w-12 rounded-full mt-1 ${
                        pc.status === 'Available' ? 'bg-green-500' : 
                        pc.status === 'Occupied' ? 'bg-red-500' : 'bg-yellow-500'
                      }`} />
                    </Button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
