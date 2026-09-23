'use client';

import React, { useState, useEffect } from 'react';
import { CampusLog } from '@/utils/storage';
import { getCampusLogsAction } from '@/app/actions/dbActions';
import { Loader2, History, LogIn, LogOut, Search, Calendar, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CampusLogsProps {
  onBack?: () => void;
}

export default function CampusLogs({ onBack }: CampusLogsProps) {
  const [logs, setLogs] = useState<CampusLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadLogs();
    const interval = setInterval(loadLogs, 10000); // Live update every 10s
    return () => clearInterval(interval);
  }, []);

  const loadLogs = async () => {
    try {
      const data = await getCampusLogsAction();
      setLogs(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => 
    log.userName.toLowerCase().includes(search.toLowerCase()) || 
    log.userId.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return (
    <div className="flex flex-col items-center justify-center p-32 space-y-4">
      <Loader2 className="animate-spin h-12 w-12 text-primary" />
      <p className="font-black uppercase text-[10px] tracking-widest text-muted-foreground">Accessing Activity Intel...</p>
    </div>
  );

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-24">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-4">
          {onBack && (
            <Button 
              variant="ghost" 
              onClick={onBack} 
              className="h-12 w-12 rounded-full p-0 flex items-center justify-center hover:bg-primary/5 transition-all active:scale-90 shrink-0"
            >
              <ArrowLeft className="h-6 w-6 text-primary" />
            </Button>
          )}
          <div>
            <h2 className="text-3xl font-black text-primary tracking-tighter uppercase leading-none">Activity Registry</h2>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mt-2">Campus Entry & Exit Logs</p>
          </div>
        </div>
        
        <div className="relative group w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/20 group-focus-within:text-primary transition-colors" size={20} />
          <Input 
            placeholder="Search Name or USN..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="h-14 pl-12 rounded-2xl border-primary/10 shadow-lg font-bold"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <Card className="p-8 rounded-[2.5rem] bg-primary text-white border-none shadow-xl flex items-center justify-between group overflow-hidden relative">
          <div className="relative z-10">
            <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Today's Traffic</p>
            <p className="text-5xl font-black tracking-tighter mt-2">{logs.length}</p>
          </div>
          <History size={80} className="absolute -right-4 -bottom-4 opacity-10 group-hover:rotate-12 transition-transform" />
        </Card>
        
        <Card className="p-8 rounded-[2.5rem] bg-white border-none shadow-xl flex items-center justify-between group overflow-hidden relative border-2 border-primary/5">
          <div className="relative z-10">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total Entries</p>
            <p className="text-5xl font-black tracking-tighter mt-2 text-primary">{logs.filter(l => l.type === 'entry').length}</p>
          </div>
          <LogIn size={80} className="absolute -right-4 -bottom-4 text-primary opacity-5" />
        </Card>

        <Card className="p-8 rounded-[2.5rem] bg-white border-none shadow-xl flex items-center justify-between group overflow-hidden relative border-2 border-primary/5">
          <div className="relative z-10">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total Exits</p>
            <p className="text-5xl font-black tracking-tighter mt-2 text-primary">{logs.filter(l => l.type === 'exit').length}</p>
          </div>
          <LogOut size={80} className="absolute -right-4 -bottom-4 text-primary opacity-5" />
        </Card>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-primary/5 shadow-2xl overflow-hidden">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full">
            <thead className="bg-primary/5 border-b border-primary/5">
              <tr>
                <th className="px-8 py-6 text-left text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Identity</th>
                <th className="px-8 py-6 text-left text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Protocol</th>
                <th className="px-8 py-6 text-left text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Timestamp</th>
                <th className="px-8 py-6 text-left text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Location</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primary/5">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-20 text-center text-muted-foreground font-bold uppercase tracking-widest text-xs opacity-40">No entries recorded today</td>
                </tr>
              ) : (
                filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-primary/[0.02] transition-colors group">
                    <td className="px-8 py-6">
                      <p className="font-black text-primary uppercase tracking-tight group-hover:scale-[1.01] transition-transform origin-left">{log.userName}</p>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">{log.role} • {log.userId}</p>
                    </td>
                    <td className="px-8 py-6">
                      <Badge className={cn(
                        "px-4 py-1.5 rounded-full font-black text-[9px] uppercase tracking-widest border-none shadow-sm",
                        log.type === 'entry' ? "bg-green-500 text-white" : "bg-primary text-white"
                      )}>
                        {log.type === 'entry' ? "CAMPUS ENTRY" : "CAMPUS EXIT"}
                      </Badge>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                        <Calendar size={14} className="text-primary/40" />
                        {format(new Date(log.timestamp), "MMM dd, yyyy")}
                        <span className="text-primary font-black ml-2">{format(new Date(log.timestamp), "hh:mm a")}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{log.location}</p>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}