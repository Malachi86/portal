'use client';

import React from 'react';
import { useCollection, useFirestore } from '@/firebase';
import { collection, doc, updateDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Monitor, Check, X, Users, LayoutDashboard, Settings, AlertCircle, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function AdminDashboard() {
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const { data: requests } = useCollection(firestore ? collection(firestore, 'requests') : null);
  const { data: labs } = useCollection(firestore ? collection(firestore, 'laboratories') : null);

  const pendingRequests = requests?.filter(r => r.status === 'Pending') || [];

  const handleAction = async (requestId: string, action: 'Approved' | 'Rejected') => {
    if (!firestore || !requests) return;
    try {
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

      toast({ title: `Request ${action}`, description: `Action completed for PC ${request.pcNumber}` });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border shadow-sm">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-primary">ADMIN CONTROL CENTER</h1>
          <p className="text-muted-foreground uppercase text-xs font-bold tracking-widest mt-1">Real-time Operations Monitoring</p>
        </div>
        <div className="flex gap-4">
          <Badge variant="outline" className="h-10 px-4 text-sm gap-2">
            <Users className="h-4 w-4" /> Active Users: 12
          </Badge>
          <Badge variant="outline" className="h-10 px-4 text-sm gap-2">
            <Monitor className="h-4 w-4" /> PC Occupancy: 65%
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="requests" className="w-full">
        <TabsList className="grid w-full grid-cols-4 h-14 bg-white border shadow-sm">
          <TabsTrigger value="requests" className="gap-2 text-lg">
            <AlertCircle className="h-5 w-5" /> Pending {pendingRequests.length > 0 && <Badge className="ml-1 bg-red-500">{pendingRequests.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="monitor" className="gap-2 text-lg">
            <LayoutDashboard className="h-5 w-5" /> Live Monitor
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-2 text-lg">
            <Users className="h-5 w-5" /> User Management
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-2 text-lg">
            <Settings className="h-5 w-5" /> Lab Setup
          </TabsTrigger>
        </TabsList>

        <TabsContent value="requests" className="mt-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pendingRequests.length === 0 ? (
              <div className="col-span-full flex flex-col items-center justify-center py-32 bg-white rounded-3xl border border-dashed">
                <Check className="h-20 w-20 text-muted-foreground/20 mb-4" />
                <p className="text-xl font-bold text-muted-foreground">No pending requests</p>
              </div>
            ) : (
              pendingRequests.map(req => (
                <Card key={req.id} className="border-none shadow-md overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
                  <div className="bg-primary p-4 text-white flex justify-between items-center">
                    <span className="text-sm font-black uppercase tracking-widest">{req.labName}</span>
                    <Badge className="bg-white/20 text-white border-none">PC {req.pcNumber}</Badge>
                  </div>
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-full bg-primary/5 flex items-center justify-center">
                        <User className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="font-bold text-lg leading-none">{req.userName}</p>
                        <p className="text-sm text-muted-foreground uppercase mt-1">{req.userRole}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 pt-2 text-sm">
                      <div className="bg-muted p-2 rounded-lg">
                        <p className="text-xs text-muted-foreground uppercase font-bold">Duration</p>
                        <p className="font-bold">{req.durationMinutes} Min</p>
                      </div>
                      <div className="bg-muted p-2 rounded-lg">
                        <p className="text-xs text-muted-foreground uppercase font-bold">Requested</p>
                        <p className="font-bold">{new Date(req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                    </div>
                  </CardContent>
                  <div className="grid grid-cols-2 border-t p-2 gap-2 bg-muted/30">
                    <Button onClick={() => handleAction(req.id, 'Approved')} className="bg-green-600 hover:bg-green-700 font-bold">
                      <Check className="h-4 w-4 mr-2" /> ACCEPT
                    </Button>
                    <Button variant="destructive" onClick={() => handleAction(req.id, 'Rejected')} className="font-bold">
                      <X className="h-4 w-4 mr-2" /> REJECT
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="monitor" className="mt-8 space-y-8">
          {labs?.map(lab => (
            <Card key={lab.id} className="border-none shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/20">
                <div>
                  <CardTitle className="text-xl">{lab.name}</CardTitle>
                  <CardDescription>Capacity: {lab.capacity} PCs</CardDescription>
                </div>
                <Badge variant={lab.status === 'Active' ? 'default' : 'secondary'}>{lab.status}</Badge>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-4 md:grid-cols-8 lg:grid-cols-12 gap-3">
                   <p className="col-span-full text-sm italic text-muted-foreground">Select room to view grid details...</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
