'use client';

import React, { useState, useEffect } from 'react';
import { getLabRequestsAction, updateLabRequestAction, getLabsAction, getPcsAction, updatePcAction } from '@/app/actions/dbActions';
import { LabRequest, Lab, Pc } from '@/utils/storage';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Activity, Monitor, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function AdminDashboard() {
  const [requests, setRequests] = useState<LabRequest[]>([]);
  const [labs, setLabs] = useState<Lab[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    window.addEventListener('sync_update', loadData);
    return () => window.removeEventListener('sync_update', loadData);
  }, []);

  const loadData = async () => {
    try {
      const [r, l] = await Promise.all([
        getLabRequestsAction(),
        getLabsAction()
      ]);
      setRequests(r.sort((a,b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()));
      setLabs(l);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (req: LabRequest, status: 'approved' | 'declined') => {
    try {
      await updateLabRequestAction(req.id, { status });
      if (status === 'approved' && req.pcId) {
        await updatePcAction(req.pcId, { status: 'occupied' });
      }
      toast.success(`Request ${status}.`);
      loadData();
    } catch (e) {
      toast.error("Process failed.");
    }
  };

  if (loading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="space-y-10 max-w-7xl mx-auto pb-24">
      <div className="flex flex-col gap-1">
        <h2 className="text-[3.5rem] font-black text-primary tracking-tighter uppercase leading-none">Registry Control</h2>
        <p className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.4em] mt-2">Central Authorization Hub</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-8 rounded-[2.5rem] bg-white border-none shadow-xl flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Pending Requests</p>
            <p className="text-5xl font-black text-orange-600 mt-2">{requests.filter(r => r.status === 'pending').length}</p>
          </div>
          <Activity size={48} className="text-orange-100" />
        </Card>
        <Card className="p-8 rounded-[2.5rem] bg-white border-none shadow-xl flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Active Sessions</p>
            <p className="text-5xl font-black text-green-600 mt-2">{requests.filter(r => r.status === 'approved').length}</p>
          </div>
          <Monitor size={48} className="text-green-100" />
        </Card>
        <Card className="p-8 rounded-[2.5rem] bg-primary text-white border-none shadow-xl flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase opacity-60 tracking-widest">Faculty Handlers</p>
            <p className="text-5xl font-black mt-2">{requests.filter(r => r.requestType === 'handle' && r.status === 'approved').length}</p>
          </div>
          <ShieldAlert size={48} className="opacity-20" />
        </Card>
      </div>

      <Card className="rounded-[3rem] border-none shadow-2xl bg-white overflow-hidden">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-sm">
            <thead className="bg-primary/5 border-b border-primary/5">
              <tr>
                <th className="px-10 py-6 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground">Identity</th>
                <th className="px-6 py-6 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground">Facility Load</th>
                <th className="px-6 py-6 text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground">Protocol</th>
                <th className="px-10 py-6 text-right text-[10px] font-black uppercase tracking-widest text-muted-foreground">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primary/5">
              {requests.map(req => (
                <tr key={req.id} className="hover:bg-primary/[0.01] transition-colors group">
                  <td className="px-10 py-8">
                    <p className="font-black text-primary uppercase text-sm">{req.studentName}</p>
                    <p className="text-[10px] font-bold text-muted-foreground mt-1">{req.studentId}</p>
                  </td>
                  <td className="px-6 py-8">
                    <p className="font-black text-slate-700 uppercase text-xs">{labs.find(l => l.id === req.labId)?.name || req.labId}</p>
                    <p className="text-[9px] font-bold text-muted-foreground uppercase mt-1">{req.pcId ? `STATION: PC-${req.pcId.split('-').pop()}` : 'FULL CONTROL'}</p>
                  </td>
                  <td className="px-6 py-8 text-center">
                    <Badge className={cn("px-4 py-1.5 rounded-full font-black text-[9px] uppercase tracking-widest border-none", req.requestType === 'handle' ? "bg-orange-50 text-white" : "bg-primary/10 text-primary")}>
                      {req.requestType === 'handle' ? 'HANDLER' : 'STATION USE'}
                    </Badge>
                  </td>
                  <td className="px-10 py-8 text-right">
                    {req.status === 'pending' ? (
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => handleAction(req, 'approved')} className="h-10 px-5 rounded-xl bg-green-500 text-white font-black uppercase text-[10px] shadow-lg hover:bg-green-600 transition-all">Authorize</button>
                        <button onClick={() => handleAction(req, 'declined')} className="h-10 px-5 rounded-xl bg-red-500 text-white font-black uppercase text-[10px] shadow-lg hover:bg-red-600 transition-all">Reject</button>
                      </div>
                    ) : (
                      <Badge className={cn("px-4 py-1.5 rounded-full font-black text-[9px] uppercase tracking-widest border-none shadow-sm", req.status === 'approved' ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800")}>
                        {req.status.toUpperCase()}
                      </Badge>
                    )}
                  </td>
                </tr>
              ))}
              {requests.length === 0 && (
                <tr>
                    <td colSpan={4} className="p-20 text-center text-muted-foreground font-black uppercase tracking-[0.2em] opacity-30">No requests in registry</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}