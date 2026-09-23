
'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getLabsAction, getPcsAction, addLabRequestAction, getLabRequestsAction } from '@/app/actions/dbActions';
import { Lab, Pc, LabRequest } from '@/utils/storage';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Monitor, ShieldCheck, Clock, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

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
    window.addEventListener('sync_update', loadData);
    return () => window.removeEventListener('sync_update', loadData);
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
      setMyRequests(r.filter(req => req.studentId === user?.id));
    } finally {
      setLoading(false);
    }
  };

  const handleRequest = async () => {
    if (!selectedLab || (requestType === 'use' && !selectedPc)) {
      toast.error("Please complete the selection.");
      return;
    }
    setSubmitting(true);
    try {
      await addLabRequestAction({
        studentId: user!.id,
        studentName: user!.name,
        subjectId: 'Teacher Personal',
        labId: selectedLab,
        pcId: requestType === 'use' ? selectedPc : undefined,
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 3600000).toISOString(), // 1 hour default
        status: 'pending',
        requestType: requestType
      });
      toast.success("Request transmitted to Registry.");
      setSelectedPc('');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="space-y-10 max-w-5xl mx-auto">
      <div className="space-y-1">
        <h2 className="text-3xl font-black text-[#6D1B0A] uppercase tracking-tighter">Teacher Terminal</h2>
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Faculty infrastructure command</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <Card className="rounded-[2.5rem] border-none shadow-2xl bg-white p-10 space-y-8">
          <div className="space-y-4">
            <h3 className="font-black text-xl uppercase tracking-tight">Deployment Protocol</h3>
            <div className="flex gap-4">
              <button 
                onClick={() => setRequestType('use')}
                className={cn("flex-1 h-14 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all", requestType === 'use' ? "bg-primary text-white" : "bg-muted text-muted-foreground")}
              >
                Use PC
              </button>
              <button 
                onClick={() => setRequestType('handle')}
                className={cn("flex-1 h-14 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all", requestType === 'handle' ? "bg-primary text-white" : "bg-muted text-muted-foreground")}
              >
                Handle Lab
              </button>
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Select Laboratory</label>
              <select 
                value={selectedLab} 
                onChange={(e) => { setSelectedLab(e.target.value); setSelectedPc(''); }}
                className="w-full h-14 bg-muted/10 rounded-2xl px-6 font-bold"
              >
                <option value="">-- Choice --</option>
                {labs.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </div>

            {requestType === 'use' && selectedLab && (
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">PC Station</label>
                <div className="grid grid-cols-4 gap-2">
                  {pcs.filter(p => p.labId === selectedLab).map(pc => (
                    <button
                      key={pc.id}
                      disabled={pc.status === 'occupied'}
                      onClick={() => setSelectedPc(pc.id)}
                      className={cn(
                        "h-12 rounded-xl font-black text-xs transition-all",
                        pc.status === 'occupied' ? "bg-red-500/10 text-red-500 cursor-not-allowed" :
                        selectedPc === pc.id ? "bg-orange-500 text-white" : "bg-green-500/10 text-green-600 hover:bg-green-500/20"
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
              disabled={submitting}
              className="w-full h-16 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest text-xs"
            >
              {submitting ? <Loader2 className="animate-spin mr-2" /> : <ShieldCheck className="mr-2" />}
              {requestType === 'handle' ? 'REQUEST LAB HANDLE' : 'REQUEST STATION ACCESS'}
            </Button>
          </div>
        </Card>

        <div className="space-y-6">
          <h3 className="font-black text-xs uppercase tracking-widest text-muted-foreground ml-2">Signal Registry</h3>
          {myRequests.length === 0 ? (
            <div className="p-20 text-center bg-white rounded-[2.5rem] border-4 border-dashed border-primary/5">
              <p className="text-[10px] font-black text-muted-foreground/30 uppercase tracking-[0.4em]">Registry Clear</p>
            </div>
          ) : (
            <div className="space-y-4">
              {myRequests.map(req => (
                <div key={req.id} className="p-6 bg-white rounded-[1.5rem] shadow-xl flex items-center justify-between">
                  <div>
                    <p className="font-black text-sm uppercase text-primary">{req.requestType === 'handle' ? 'HANDLE' : 'USE'}: {labs.find(l => l.id === req.labId)?.name}</p>
                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
                      {req.pcId ? `STATION: PC-${req.pcId.split('-').pop()}` : 'FULL CONTROL'}
                    </p>
                  </div>
                  <Badge className={cn(
                    "px-3 py-1 rounded-lg font-black text-[8px] uppercase tracking-widest",
                    req.status === 'approved' ? "bg-green-500 text-white" : "bg-amber-500 text-white"
                  )}>
                    {req.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
