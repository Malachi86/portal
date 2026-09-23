'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getLabsAction, getPcsAction, addLabRequestAction, getLabRequestsAction } from '@/app/actions/dbActions';
import { Lab, Pc, LabRequest } from '@/utils/storage';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Monitor, ShieldCheck, Zap, Send, Loader2, CheckCircle2, History, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

export default function TeacherDashboard() {
  const { user } = useAuth();
  const [labs, setLabs] = useState<Lab[]>([]);
  const [pcs, setPcs] = useState<Pc[]>([]);
  const [myRequests, setMyRequests] = useState<LabRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [selectedLab, setSelectedLab] = useState<string>('');
  const [selectedPc, setSelectedPc] = useState<string>('');
  const [requestType, setRequestType] = useState<'use' | 'handle'>('use');

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [l, p, r] = await Promise.all([
        getLabsAction(),
        getPcsAction(),
        getLabRequestsAction()
      ]);
      setLabs(l);
      setPcs(p);
      setMyRequests(r.filter(req => req.studentId === user?.id).sort((a,b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()));
    } finally {
      setLoading(false);
    }
  };

  const handleRequest = async () => {
    if (!selectedLab || !selectedPc) {
      toast.error("Registry Error: Please select a Target Lab and Station Unit.");
      return;
    }
    setSubmitting(true);
    try {
      await addLabRequestAction({
        studentId: user!.id,
        studentName: user!.name,
        subjectId: 'Teacher Personal',
        labId: selectedLab,
        pcId: selectedPc,
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 7200000).toISOString(), // 2 hours default for teachers
        status: 'pending',
        requestType: requestType
      });
      toast.success("Signal Transmitted!", { description: "Awaiting administrative handshake." });
      setSelectedPc('');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && labs.length === 0) return (
    <div className="flex flex-col items-center justify-center p-32 space-y-4">
      <Loader2 className="animate-spin h-14 w-14 text-primary" strokeWidth={3} />
      <p className="font-black uppercase text-[10px] tracking-[0.4em] text-muted-foreground animate-pulse">Syncing Facility Matrix...</p>
    </div>
  );

  return (
    <div className="space-y-12 max-w-[1400px] mx-auto animate-in fade-in duration-500 pb-24">
      <div className="flex flex-col gap-1">
        <h2 className="text-[3.5rem] font-black text-primary tracking-tighter uppercase leading-none italic">Faculty Terminal</h2>
        <p className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.4em] mt-2 ml-1">Secure Infrastructure Control Hub</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-12 items-start">
        {/* REQUEST SECTION */}
        <div className="xl:col-span-7">
          <Card className="rounded-[4rem] border-none shadow-[0_50px_100px_-20px_rgba(0,0,0,0.15)] bg-white p-12 md:p-20 space-y-12 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none group-hover:scale-110 transition-transform">
              <Monitor size={250} fill="currentColor" className="text-primary" />
            </div>

            <div className="space-y-8 relative z-10">
              <div className="space-y-4">
                <h3 className="font-black text-2xl uppercase tracking-tighter ml-1">Protocol Selection</h3>
                <div className="flex gap-5">
                  <button 
                    onClick={() => setRequestType('use')}
                    className={cn(
                      "flex-1 h-24 rounded-3xl font-black flex flex-col items-center justify-center gap-2 transition-all border-2", 
                      requestType === 'use' ? "bg-primary text-white border-primary shadow-2xl scale-[1.03]" : "bg-muted/30 border-transparent text-muted-foreground hover:bg-muted/50"
                    )}
                  >
                    <Monitor size={24} />
                    <span className="text-[10px] uppercase tracking-[0.3em]">Personal Station</span>
                  </button>
                  <button 
                    onClick={() => setRequestType('handle')}
                    className={cn(
                      "flex-1 h-24 rounded-3xl font-black flex flex-col items-center justify-center gap-2 transition-all border-2", 
                      requestType === 'handle' ? "bg-primary text-white border-primary shadow-2xl scale-[1.03]" : "bg-muted/30 border-transparent text-muted-foreground hover:bg-muted/50"
                    )}
                  >
                    <ShieldCheck size={24} />
                    <span className="text-[10px] uppercase tracking-[0.3em]">Facility Handle</span>
                  </button>
                </div>
              </div>

              <div className="space-y-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/40 ml-2">Target Laboratory</label>
                  <select 
                    value={selectedLab} 
                    onChange={(e) => { setSelectedLab(e.target.value); setSelectedPc(''); }}
                    className="w-full h-20 bg-muted/20 border-none rounded-[1.5rem] px-10 font-black text-lg uppercase tracking-tight shadow-inner appearance-none cursor-pointer focus:ring-4 focus:ring-primary/10 transition-all"
                  >
                    <option value="">SELECT FACILITY</option>
                    {labs.map(l => <option key={l.id} value={l.id}>{l.name.toUpperCase()}</option>)}
                  </select>
                </div>

                {selectedLab && (
                  <div className="space-y-6 animate-in slide-in-from-top-4 duration-500">
                    <div className="flex items-center justify-between px-2">
                        <label className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Station Grid Assignment</label>
                        <Badge className="bg-primary/5 text-primary border-none font-black text-[9px] px-3">{pcs.filter(p => p.labId === selectedLab && p.status === 'available').length} Available</Badge>
                    </div>
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                      {pcs.filter(p => p.labId === selectedLab).map(pc => (
                        <button
                          key={pc.id}
                          disabled={pc.status === 'occupied'}
                          onClick={() => setSelectedPc(pc.id)}
                          className={cn(
                            "h-16 rounded-2xl font-black text-xs transition-all shadow-md border-2",
                            pc.status === 'occupied' ? "bg-red-500/10 border-red-500/20 text-red-500 cursor-not-allowed grayscale opacity-30" :
                            selectedPc === pc.id ? "bg-orange-500 border-orange-500 text-white shadow-2xl scale-110" : "bg-white border-primary/5 text-primary hover:border-primary/20 hover:bg-slate-50"
                          )}
                        >
                          {pc.pcNumber}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <Button 
                  onClick={handleRequest} 
                  disabled={submitting || !selectedPc}
                  className="w-full h-24 rounded-[2rem] bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-[0.4em] text-sm shadow-[0_30px_60px_-15px_rgba(109,27,10,0.4)] transition-all active:scale-95 disabled:grayscale"
                >
                  {submitting ? <Loader2 className="animate-spin h-8 w-8" /> : <Send size={28} className="mr-2" />}
                  {requestType === 'handle' ? 'REQUEST FACILITY LEASE' : 'DEPLOY STATION SIGNAL'}
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* REGISTRY SIDEBAR */}
        <div className="xl:col-span-5 space-y-10">
          <div className="flex items-center gap-4 ml-4">
            <History size={24} className="text-primary" />
            <h3 className="font-black text-xl uppercase tracking-tighter text-slate-800">Transmission Log</h3>
          </div>
          
          {myRequests.length === 0 ? (
            <div className="p-32 text-center bg-white rounded-[4rem] border-4 border-dashed border-primary/5 flex flex-col items-center justify-center gap-6">
              <Zap size={64} className="text-primary/10" />
              <p className="text-[10px] font-black text-muted-foreground/30 uppercase tracking-[0.5em]">No Active Signals</p>
            </div>
          ) : (
            <div className="space-y-6 max-h-[800px] overflow-y-auto no-scrollbar pr-2">
              {myRequests.map(req => (
                <Card key={req.id} className="rounded-[2.5rem] border-none shadow-xl bg-white overflow-hidden group hover:shadow-2xl transition-all">
                  <div className="p-10 flex items-center justify-between">
                    <div className="flex items-center gap-8">
                      <div className={cn(
                        "h-16 w-16 rounded-[1.25rem] flex items-center justify-center shadow-inner transition-colors",
                        req.status === 'approved' ? "bg-green-500 text-white" : "bg-primary/5 text-primary group-hover:bg-primary group-hover:text-white"
                      )}>
                        {req.requestType === 'handle' ? <ShieldCheck size={28} /> : <Monitor size={28} />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1.5">
                            <span className="text-[9px] font-black uppercase tracking-widest text-primary/40">{req.requestType === 'handle' ? 'Facility Handle' : 'Station Access'}</span>
                        </div>
                        <h4 className="font-black text-xl uppercase text-slate-800 tracking-tight leading-none">{labs.find(l => l.id === req.labId)?.name || 'Unit Signal'}</h4>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-2">
                          Station Node: PC-{req.pcId?.split('-').pop() || 'Full'}
                        </p>
                      </div>
                    </div>
                    <Badge className={cn(
                      "px-5 py-2.5 rounded-full font-black text-[9px] uppercase tracking-widest border-none shadow-lg",
                      req.status === 'approved' ? "bg-green-500 text-white shadow-green-500/20" : 
                      req.status === 'declined' ? "bg-red-500 text-white shadow-red-500/20" : 
                      "bg-amber-500 text-white animate-pulse"
                    )}>
                      {req.status}
                    </Badge>
                  </div>
                </Card>
              ))}
            </div>
          )}

          <div className="p-10 bg-[#E5EAEB] rounded-[3rem] border-2 border-primary/5 flex items-start gap-8 shadow-inner">
            <div className="h-14 w-14 rounded-2xl bg-white flex items-center justify-center text-primary shadow-lg border border-primary/5 shrink-0">
                <AlertTriangle size={32} />
            </div>
            <div>
              <h4 className="font-black uppercase tracking-tight text-primary text-xl">Faculty Protocol</h4>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest leading-relaxed mt-2">
                "Facility Handle" grants temporary administrative control over a lab. Use this during class sessions to supervise workstation nodes.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}