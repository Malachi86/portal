
'use client';

import React, { useState, useEffect } from 'react';
import { getLabsAction, getPcsAction, updatePcAction } from '@/app/actions/dbActions';
import { Lab, Pc } from '@/utils/storage';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Monitor, RefreshCw, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export default function LabSetup() {
  const [labs, setLabs] = useState<Lab[]>([]);
  const [pcs, setPcs] = useState<Pc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [l, p] = await Promise.all([getLabsAction(), getPcsAction()]);
    setLabs(l);
    setPcs(p);
    setLoading(false);
  };

  const togglePcStatus = async (pc: Pc) => {
    const nextStatus = pc.status === 'available' ? 'occupied' : 'available';
    await updatePcAction(pc.id, { status: nextStatus });
    loadData();
  };

  if (loading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="space-y-10">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-black uppercase tracking-tighter">Infrastructure Setup</h2>
        <Button onClick={loadData} variant="ghost" size="icon" className="rounded-full"><RefreshCw size={18} /></Button>
      </div>

      <div className="grid grid-cols-1 gap-10">
        {labs.map(lab => (
          <Card key={lab.id} className="rounded-[3rem] border-none shadow-2xl overflow-hidden bg-white">
            <CardHeader className="bg-primary/5 p-10">
              <CardTitle className="text-2xl font-black uppercase tracking-tight flex items-center gap-4">
                <Monitor className="text-primary" /> {lab.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-10">
              <div className="grid grid-cols-4 sm:grid-cols-8 lg:grid-cols-12 gap-3">
                {pcs.filter(p => p.labId === lab.id).map(pc => (
                  <button
                    key={pc.id}
                    onClick={() => togglePcStatus(pc)}
                    className={cn(
                      "aspect-square rounded-2xl flex flex-col items-center justify-center gap-1 border-2 transition-all",
                      pc.status === 'occupied' ? "bg-red-500/10 border-red-500/20 text-red-600" : "bg-green-500/10 border-green-500/20 text-green-600"
                    )}
                  >
                    <span className="font-black text-xs">{pc.pcNumber}</span>
                    <div className={cn("h-1 w-1 rounded-full", pc.status === 'occupied' ? "bg-red-500" : "bg-green-500")} />
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
