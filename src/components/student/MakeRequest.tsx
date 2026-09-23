'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Send, AlertCircle, Monitor, Building, Clock, Loader2, ShieldCheck, Zap } from 'lucide-react';
import { getLabsAction, getRoomsAction, getPcsAction, addLabRequestAction } from '@/app/actions/dbActions';
import { Lab, Room, Pc } from '@/utils/storage';
import { toast } from 'sonner';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

export default function MakeRequest() {
  const { user } = useAuth();
  const [labs, setLabs] = useState<Lab[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [availablePCs, setAvailablePCs] = useState<Pc[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const [formData, setFormData] = useState({
    type: 'lab' as 'lab' | 'room',
    requestType: 'use' as 'use' | 'handle',
    locationId: '',
    pcId: '',
    startTime: '',
    endTime: '',
    reason: ''
  });

  useEffect(() => {
    if (user) {
      loadInitialData();
    }
  }, [user]);

  useEffect(() => {
    if (formData.type === 'lab' && formData.locationId) {
      loadAvailablePCs(formData.locationId);
    } else {
      setAvailablePCs([]);
      setFormData(prev => ({ ...prev, pcId: '' }));
    }
  }, [formData.locationId, formData.type]);

  const loadInitialData = async () => {
    try {
      const [allLabs, allRooms] = await Promise.all([
        getLabsAction(),
        getRoomsAction()
      ]);
      setLabs(allLabs);
      setRooms(allRooms);
    } finally {
      setInitialLoading(false);
    }
  };

  const loadAvailablePCs = async (labId: string) => {
    try {
      const allPcs = await getPcsAction();
      const available = allPcs.filter(pc => pc.labId === labId && pc.status === 'available');
      setAvailablePCs(available);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!formData.locationId || !formData.startTime || !formData.endTime || (formData.type === 'lab' && !formData.pcId)) {
      toast.error('Required fields missing.');
      return;
    }
    
    setLoading(true);
    try {
        await addLabRequestAction({
          studentId: user.id,
          studentName: user.name,
          subjectId: formData.requestType === 'handle' ? 'Facility Lease' : 'Personal Usage',
          labId: formData.locationId,
          pcId: formData.pcId,
          startTime: new Date().toISOString().split('T')[0] + 'T' + formData.startTime,
          endTime: new Date().toISOString().split('T')[0] + 'T' + formData.endTime,
          reason: formData.reason,
          status: 'pending',
          requestType: formData.requestType
        });
        toast.success("Signal Sent! Awaiting authorization.");
        setFormData({ 
          type: 'lab', 
          requestType: 'use', 
          locationId: '', 
          pcId: '', 
          startTime: '', 
          endTime: '', 
          reason: '' 
        });
    } catch {
        toast.error("Transmission failed.");
    } finally {
        setLoading(false);
    }
  };

  if (initialLoading) return <div className="flex justify-center p-32"><Loader2 className="animate-spin text-primary h-12 w-12" /></div>;

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-20 animate-in fade-in duration-500">
      <div>
        <h2 className="text-[3.5rem] font-black text-primary tracking-tighter uppercase leading-none">New Reservation</h2>
        <p className="text-[11px] font-black text-muted-foreground mt-2 uppercase tracking-[0.4em]">Infrastructure Authorization</p>
      </div>

      <div className="bg-white rounded-[3rem] shadow-2xl border-none p-12 md:p-20 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5 rotate-12 pointer-events-none">
          <Zap size={200} fill="currentColor" className="text-primary" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-12 relative z-10">
          
          <div className="space-y-4">
            <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-primary ml-1">Protocol Mode</Label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, requestType: 'use' })}
                className={cn(
                  "h-20 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all border-2",
                  formData.requestType === 'use' 
                    ? "bg-primary text-white border-primary shadow-2xl scale-[1.02]" 
                    : "bg-muted/30 border-transparent text-muted-foreground hover:bg-muted/50"
                )}
              >
                <Monitor size={20} />
                <span className="font-black uppercase text-[10px] tracking-widest">Station Use</span>
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, requestType: 'handle' })}
                className={cn(
                  "h-20 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all border-2",
                  formData.requestType === 'handle' 
                    ? "bg-primary text-white border-primary shadow-2xl scale-[1.02]" 
                    : "bg-muted/30 border-transparent text-muted-foreground hover:bg-muted/50"
                )}
              >
                <ShieldCheck size={20} />
                <span className="font-black uppercase text-[10px] tracking-widest">Facility Handle</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground ml-1">Facility Type</Label>
              <div className="flex gap-10 h-16 items-center px-4">
                {['lab', 'room'].map(t => (
                  <label key={t} className="flex items-center gap-4 cursor-pointer group">
                    <div className={cn(
                      "w-7 h-7 rounded-full border-4 flex items-center justify-center transition-all", 
                      formData.type === t ? "border-primary bg-primary" : "border-primary/20"
                    )}>
                      {formData.type === t && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                    <input type="radio" value={t} checked={formData.type === t} onChange={(e) => setFormData({ ...formData, type: e.target.value as any, locationId: '', pcId: ''})} className="hidden" />
                    <span className="font-black text-xs uppercase tracking-widest text-slate-700">{t === 'lab' ? 'Laboratory' : 'Classroom'}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground ml-1">Infrastructure Unit</Label>
              <select
                value={formData.locationId}
                onChange={(e) => setFormData({ ...formData, locationId: e.target.value, pcId: '' })}
                className="w-full h-16 bg-muted/20 border-none rounded-2xl px-8 font-black text-sm uppercase tracking-tight focus:ring-2 focus:ring-primary/20 outline-none appearance-none transition-all shadow-inner"
                required
              >
                <option value="">-- CHOOSE UNIT --</option>
                {(formData.type === 'lab' ? labs : rooms).map((loc) => (
                  <option key={loc.id} value={loc.id}>{loc.name.toUpperCase()} (CAP: {loc.capacity})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-2">
              <Label className={cn("text-[10px] font-black uppercase tracking-[0.3em] ml-1 transition-colors", formData.locationId ? "text-primary" : "text-muted-foreground/30")}>Station Assignment</Label>
              <select
                value={formData.pcId}
                disabled={!formData.locationId || formData.type !== 'lab'}
                onChange={(e) => setFormData({ ...formData, pcId: e.target.value })}
                className={cn(
                  "w-full h-16 rounded-2xl px-8 font-black text-sm uppercase tracking-tight focus:ring-2 outline-none appearance-none transition-all shadow-inner",
                  formData.locationId && formData.type === 'lab' ? "bg-primary/5 border-2 border-primary/10 text-primary" : "bg-muted/10 border-none text-muted-foreground/30"
                )}
                required={formData.type === 'lab'}
              >
                <option value="">-- SELECT PC UNIT --</option>
                {availablePCs.map((pc) => (
                  <option key={pc.id} value={pc.id}>PC-{pc.pcNumber}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground ml-1">Clock In</Label>
                <Input type="time" value={formData.startTime} onChange={(e) => setFormData({ ...formData, startTime: e.target.value })} required className="h-16 rounded-2xl border-none bg-muted/20 font-black text-xl px-8 shadow-inner" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground ml-1">Clock Out</Label>
                <Input type="time" value={formData.endTime} onChange={(e) => setFormData({ ...formData, endTime: e.target.value })} required className="h-16 rounded-2xl border-none bg-muted/20 font-black text-xl px-8 shadow-inner" />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground ml-1">Request Purpose</Label>
            <Textarea
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              className="rounded-[2.5rem] p-10 border-none bg-muted/10 min-h-[160px] font-bold text-lg focus:ring-2 focus:ring-primary/20 outline-none shadow-inner"
              placeholder="State objective for session..."
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-24 bg-primary hover:bg-primary/90 text-white font-black uppercase text-base tracking-[0.4em] rounded-[1.5rem] shadow-xl gap-5 transition-all active:scale-95 disabled:grayscale"
          >
            {loading ? <Loader2 className="animate-spin h-8 w-8" /> : <Send size={32} />}
            TRANSMIT REQUEST SIGNAL
          </Button>
        </form>
      </div>

      <div className="p-10 bg-primary/5 rounded-[3rem] border-2 border-primary/5 flex items-start gap-8 shadow-inner">
        <div className="h-14 w-14 rounded-2xl bg-white flex items-center justify-center text-primary shadow-lg shrink-0">
          <AlertCircle size={32} />
        </div>
        <div className="space-y-2">
          <h4 className="font-black uppercase tracking-tight text-primary text-xl">System Notice</h4>
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest leading-relaxed">
            All workstation logins are recorded. Unauthorized usage will be reported to the IT Department.
          </p>
        </div>
      </div>
    </div>
  );
}
