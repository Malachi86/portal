'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Send, AlertCircle, Monitor, Building, Clock, Loader2 } from 'lucide-react';
import { getUsersAction, getSubjectsAction, getLabsAction, getRoomsAction, getPcsAction, addLabRequestAction } from '@/app/actions/dbActions';
import { Subject, User } from '@/utils/storage';
import { toast } from 'sonner';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

export default function MakeRequest() {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [labs, setLabs] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [availablePCs, setAvailablePCs] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    subject: '',
    type: 'lab' as 'lab' | 'room',
    labOrRoom: '',
    pc: '',
    startTime: '',
    endTime: '',
    reason: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if(user) {
      loadInitialData();
    }
  }, [user]);

  useEffect(() => {
    if (formData.type === 'lab' && formData.labOrRoom) {
      loadAvailablePCs(formData.labOrRoom);
    }
  }, [formData.labOrRoom, formData.type]);

  const loadInitialData = async () => {
    if (!user) return;
    const [subjs, allLabs, allRooms] = await Promise.all([
      getSubjectsAction(),
      getLabsAction(),
      getRoomsAction()
    ]);
    setSubjects(subjs);
    setLabs(allLabs);
    setRooms(allRooms);
  };

  const loadAvailablePCs = async (labId: string) => {
    const allPcs = await getPcsAction();
    const available = allPcs.filter(pc => pc.labId === labId && pc.status === 'available');
    setAvailablePCs(available);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!formData.subject || !formData.labOrRoom || !formData.startTime || !formData.endTime) {
      toast.error('Required fields missing.');
      return;
    }
    
    setLoading(true);
    try {
        const today = new Date().toISOString().split('T')[0];
        await addLabRequestAction({
          studentId: user.id,
          studentName: user.name,
          subjectId: formData.subject,
          labId: formData.labOrRoom,
          pcId: formData.type === 'lab' ? formData.pc : undefined,
          startTime: `${today}T${formData.startTime}`,
          endTime: `${today}T${formData.endTime}`,
          reason: formData.reason,
          status: 'pending' as const,
          requestType: 'use'
        });
        toast.success("Request submitted successfully!");
        setFormData({ subject: '', type: 'lab', labOrRoom: '', pc: '', startTime: '', endTime: '', reason: '' });
    } catch {
        toast.error("Failed to submit request.");
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20 animate-in fade-in duration-500">
      <div>
        <h2 className="text-4xl font-black text-primary tracking-tighter uppercase leading-none">New Reservation</h2>
        <p className="text-xs font-bold text-muted-foreground mt-2 uppercase tracking-widest">Authorize workstation or room usage</p>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-2xl border-none p-10 md:p-16 space-y-10">
        <form onSubmit={handleSubmit} className="space-y-10">
          
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Subject Load</Label>
            <select
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              className="w-full h-14 bg-muted/10 border-none rounded-2xl px-6 font-bold text-foreground focus:ring-2 focus:ring-primary/20 outline-none appearance-none transition-all"
              required
            >
              <option value="">Select Target Subject</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
              ))}
            </select>
          </div>

          <div className="space-y-4">
            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Infrastructure Type</Label>
            <div className="flex gap-8">
              {['lab', 'room'].map(t => (
                <label key={t} className="flex items-center gap-3 cursor-pointer group">
                  <div className={cn("w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all", formData.type === t ? "border-primary bg-primary" : "border-primary/20")}>
                    {formData.type === t && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                  <input type="radio" value={t} checked={formData.type === t} onChange={(e) => setFormData({ ...formData, type: e.target.value as any, labOrRoom: '', pc: ''})} className="hidden" />
                  <span className="font-bold text-sm uppercase tracking-tight">{t === 'lab' ? 'Laboratory' : 'Classroom'}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">{formData.type === 'lab' ? 'Lab Unit' : 'Room Unit'}</Label>
              <select
                value={formData.labOrRoom}
                onChange={(e) => setFormData({ ...formData, labOrRoom: e.target.value, pc: '' })}
                className="w-full h-14 bg-muted/10 border-none rounded-2xl px-6 font-bold text-foreground focus:ring-2 focus:ring-primary/20 outline-none appearance-none transition-all"
                required
              >
                <option value="">-- Choose Unit --</option>
                {(formData.type === 'lab' ? labs : rooms).map((loc) => (
                  <option key={loc.id} value={loc.id}>{loc.name} (Cap: {loc.capacity})</option>
                ))}
              </select>
            </div>

            {formData.type === 'lab' && formData.labOrRoom && (
              <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary ml-1">Workstation node ({availablePCs.length} Active)</Label>
                <select
                  value={formData.pc}
                  onChange={(e) => setFormData({ ...formData, pc: e.target.value })}
                  className="w-full h-14 bg-primary/5 border-2 border-primary/10 rounded-2xl px-6 font-bold text-primary focus:ring-2 focus:ring-primary/20 outline-none appearance-none transition-all"
                  required
                >
                  <option value="">Select PC</option>
                  {availablePCs.map((pc) => (
                    <option key={pc.id} value={pc.id}>PC {pc.pcNumber}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-10">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Start Mark</Label>
              <Input type="time" value={formData.startTime} onChange={(e) => setFormData({ ...formData, startTime: e.target.value })} required className="h-14 rounded-2xl border-none bg-muted/10 font-bold" />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">End Mark</Label>
              <Input type="time" value={formData.endTime} onChange={(e) => setFormData({ ...formData, endTime: e.target.value })} required className="h-14 rounded-2xl border-none bg-muted/10 font-bold" />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Activity Log Note</Label>
            <Textarea
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              className="rounded-3xl p-8 border-none bg-muted/10 min-h-[140px] font-medium text-base focus:ring-2 focus:ring-primary/20 outline-none"
              placeholder="State purpose for entry..."
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-20 bg-primary hover:bg-primary/90 text-white font-black uppercase text-sm tracking-[0.25em] rounded-2xl shadow-xl shadow-primary/20 gap-4 transition-all active:scale-95 disabled:grayscale"
          >
            {loading ? <Loader2 className="animate-spin" /> : <Send size={24} />}
            TRANSMIT PROTOCOL
          </Button>
        </form>
      </div>
    </div>
  );
}