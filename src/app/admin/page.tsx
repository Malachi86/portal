'use client';

import React, { useState } from 'react';
import { useCollection, useFirestore } from '@/firebase';
import { collection, doc, updateDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Calendar as CalendarIcon, Filter, Check, X, User, Monitor, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function AdminDashboard() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  
  const { data: requests } = useCollection(firestore ? collection(firestore, 'requests') : null);

  const pending = requests?.filter(r => r.status === 'Pending') || [];
  const approved = requests?.filter(r => r.status === 'Approved') || [];
  const rejected = requests?.filter(r => r.status === 'Rejected') || [];

  const handleAction = (requestId: string, action: 'Approved' | 'Rejected') => {
    if (!firestore || !requests) return;
    const request = requests.find(r => r.id === requestId);
    if (!request) return;

    updateDoc(doc(firestore, 'requests', requestId), {
      status: action,
      approvedAt: action === 'Approved' ? new Date().toISOString() : null,
      expiresAt: action === 'Approved' ? new Date(Date.now() + 60 * 60 * 1000).toISOString() : null
    });

    updateDoc(doc(firestore, 'laboratories', request.labId, 'pcs', request.pcNumber), {
      status: action === 'Approved' ? 'Occupied' : 'Available',
      ...(action === 'Rejected' && { currentUserId: null, currentUserName: null, requestId: null })
    });

    toast({ title: `Request ${action}`, description: `PC ${request.pcNumber} status updated.` });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="rounded-[2.5rem] shadow-lg border-none">
          <CardContent className="p-8 flex flex-col gap-2">
            <p className="text-sm font-bold text-muted-foreground uppercase">Pending requests</p>
            <h2 className="text-6xl font-black text-[#f07148]">{pending.length}</h2>
          </CardContent>
        </Card>
        <Card className="rounded-[2.5rem] shadow-lg border-none">
          <CardContent className="p-8 flex flex-col gap-2">
            <p className="text-sm font-bold text-muted-foreground uppercase">Approved sessions</p>
            <h2 className="text-6xl font-black text-green-600">{approved.length}</h2>
          </CardContent>
        </Card>
        <Card className="rounded-[2.5rem] shadow-lg border-none">
          <CardContent className="p-8 flex flex-col gap-2">
            <p className="text-sm font-bold text-muted-foreground uppercase">Declined requests</p>
            <h2 className="text-6xl font-black text-red-600">{rejected.length}</h2>
          </CardContent>
        </Card>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5" />
          <Input 
            className="h-16 pl-14 rounded-3xl bg-white border-none shadow-md text-lg" 
            placeholder="Search by student, subject or lab..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-4 w-full md:w-auto">
          <div className="relative w-full md:w-48">
            <CalendarIcon className="absolute right-6 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5" />
            <Input className="h-16 px-6 rounded-3xl bg-white border-none shadow-md" type="text" placeholder="mm/dd/yyyy" />
          </div>
          <Button className="h-16 px-8 rounded-3xl bg-white text-foreground hover:bg-slate-100 border-none shadow-md font-bold">
            All status
          </Button>
        </div>
      </div>

      {/* Main Registry Table */}
      <Card className="rounded-[3rem] shadow-xl border-none overflow-hidden bg-white min-h-[500px]">
        <div className="grid grid-cols-5 p-10 text-[11px] font-black uppercase tracking-widest text-slate-400 border-b bg-slate-50/50">
          <div>Student info</div>
          <div>Lab / Room</div>
          <div>PC unit</div>
          <div>Time block</div>
          <div className="text-right">Status / Control</div>
        </div>
        <CardContent className="p-0">
          {requests?.length === 0 ? (
            <div className="py-32 flex flex-col items-center justify-center text-slate-300 gap-4">
              <Monitor className="h-20 w-20 opacity-20" />
              <p className="text-xl font-bold tracking-tight">No matching requests in registry</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {requests?.map((req) => (
                <div key={req.id} className="grid grid-cols-5 p-10 items-center hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center">
                      <User className="h-6 w-6 text-slate-400" />
                    </div>
                    <div>
                      <p className="font-bold text-lg leading-none">{req.userName}</p>
                      <p className="text-xs text-muted-foreground uppercase mt-1">{req.userRole}</p>
                    </div>
                  </div>
                  <div className="font-bold text-slate-600">{req.labName}</div>
                  <div>
                    <Badge variant="outline" className="rounded-xl px-4 py-1 text-sm font-black border-slate-200">
                      PC {req.pcNumber}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-slate-500 font-medium">
                    <Clock className="h-4 w-4" />
                    {req.durationMinutes} min
                  </div>
                  <div className="flex justify-end gap-2">
                    {req.status === 'Pending' ? (
                      <>
                        <Button 
                          onClick={() => handleAction(req.id, 'Approved')}
                          className="bg-green-600 hover:bg-green-700 rounded-2xl font-black h-12 px-6"
                        >
                          APPROVE
                        </Button>
                        <Button 
                          onClick={() => handleAction(req.id, 'Rejected')}
                          variant="destructive" 
                          className="rounded-2xl font-black h-12 px-6"
                        >
                          REJECT
                        </Button>
                      </>
                    ) : (
                      <Badge className={`rounded-2xl px-6 py-2 text-sm font-black border-none ${
                        req.status === 'Approved' ? 'bg-green-100 text-green-700' : 
                        req.status === 'Rejected' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {req.status.toUpperCase()}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
