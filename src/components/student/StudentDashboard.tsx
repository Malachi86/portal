
'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getLabsAction, getPcsAction, addLabRequestAction, getLabRequestsAction } from '@/app/actions/dbActions';
import { Lab, Pc, LabRequest } from '@/utils/storage';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Monitor, Send, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [labs, setLabs] = useState<Lab[]>([]);
  const [pcs, setPcs] = useState<Pc[]>([]);
  const [myRequests, setMyRequests] = useState<LabRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [selectedLab, setSelectedLab] = useState<string>('');
  const [selectedPc, setSelectedPc] = useState<string>('');

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
    if (!selectedLab || !selectedPc) {
      toast.error("Please select a Lab and a PC.");
      return;
    }
    setSubmitting(true);
    try {
      await addLabRequestAction({
        studentId: user!.id,
        studentName: user!.name,
        subjectId: 'Academic Use',
        labId: selectedLab,
        pcId: selectedPc,
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 7200000).toISOString(), // 2 hours default
        status: 'pending',
        requestType: 'use'
      });
      toast.success("Request Sent! Awaiting authorization.");
      setSelectedPc('');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="space-y-10 max-w-5xl mx-auto animate-in fade-in duration-500">
      <div className="space-y-1">
        <h2 className="text-[3rem] font-black text-primary tracking-tighter uppercase leading-none">Student Terminal</h2>
        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.4em] mt-2">Request Station Entry</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <Card className="rounded-[3rem] border-none shadow-2xl bg-white p-10 space-y-10">
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Laboratory Selection</label>
              <select 
                value={selectedLab} 
                onChange={(e) => { setSelectedLab(e.target.value); setSelectedPc(''); }}
                className="w-full h-16 bg-muted/10 border-none rounded-2xl px-8 font-black text-sm uppercase tracking-tight shadow-inner"
              >
                <option value="">SELECT TARGET LAB</option>
                {labs.map(l => <option key={l.id} value={l.id}>{l.name.toUpperCase()}</option>)}
              </select>
            </div>

            {selectedLab && (
              <div className="space-y-4 animate-in slide-in-from-top-4 duration-500">
                <label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">Workstation Grid</label>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                  {pcs.filter(p => p.labId === selectedLab).map(pc => (
                    <button
                      key={pc.id}
                      disabled={pc.status === 'occupied'}
                      onClick={() => setSelectedPc(pc.id)}
                      className={cn(
                        "h-14 rounded-2xl font-black text-xs transition-all shadow-sm border-2",
                        pc.status === 'occupied' ? "bg-red-500/10 border-red-500/20 text-red-500 cursor-not-allowed grayscale" :
                        selectedPc === pc.id ? "bg-orange-500 border-orange-500 text-white shadow-xl scale-110" : "bg-white border-primary/5 text-primary hover:border-primary/20"
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
              className="w-full h-20 rounded-[1.5rem] bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-[0.2em] text-sm shadow-xl shadow-primary/20 transition-all active:scale-95 disabled:grayscale"
            >
              {submitting ? <Loader2 className="animate-spin mr-2" /> : <Send className="mr-2" size={20} />}
              TRANSMIT REQUEST
            </Button>
          </div>
        </Card>

        <div className="space-y-6">
          <div className="flex items-center gap-3 ml-2">
            <Monitor size={18} className="text-primary" />
            <h3 className="font-black text-xs uppercase tracking-widest text-muted-foreground">Personal Request History</h3>
          </div>
          {myRequests.length === 0 ? (
            <div className="p-20 text-center bg-white rounded-[3rem] border-4 border-dashed border-primary/5">
              <p className="text-[10px] font-black text-muted-foreground/30 uppercase tracking-[0.4em]">No active signals</p>
            </div>
          ) : (
            <div className="space-y-4">
              {myRequests.map(req => (
                <div key={req.id} className="p-8 bg-white rounded-[2rem] shadow-xl flex items-center justify-between group hover:shadow-2xl transition-all">
                  <div className="flex items-center gap-6">
                    <div className="h-12 w-12 rounded-2xl bg-primary/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                      <CheckCircle2 size={24} />
                    </div>
                    <div>
                      <p className="font-black text-sm uppercase text-slate-800">{labs.find(l => l.id === req.labId)?.name || 'Unknown Lab'}</p>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Station: PC-{req.pcId?.split('-').pop()}</p>
                    </div>
                  </div>
                  <Badge className={cn(
                    "px-4 py-2 rounded-full font-black text-[9px] uppercase tracking-widest border-none shadow-md",
                    req.status === 'approved' ? "bg-green-500 text-white" : req.status === 'declined' ? "bg-red-500 text-white" : "bg-amber-500 text-white"
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
