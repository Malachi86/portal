'use client';

import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Search, 
  Loader2, 
  UserX, 
  Unlock, 
  Ban, 
  Activity,
  ShieldAlert,
  History,
  ShieldCheck
} from 'lucide-react';
import { getUsersAction, unbanUserAction } from '@/app/actions/dbActions';
import { User } from '@/utils/storage';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

// Compact and formal StatBox
const StatBox = ({ icon: Icon, label, value, color, description }: any) => (
  <Card className="p-5 rounded-2xl border border-slate-100 shadow-sm bg-white flex flex-col justify-between min-h-[130px] transition-all hover:border-primary/20 group relative overflow-hidden">
    <div className="flex justify-between items-start relative z-10">
      <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center shadow-sm", color || "bg-primary/5 text-primary")}>
        <Icon size={18} />
      </div>
      {description && (
        <span className="text-[9px] font-bold text-slate-400 tracking-tight bg-slate-50 px-2 py-1 rounded">
          {description}
        </span>
      )}
    </div>
    <div className="relative z-10 mt-4">
      <p className="text-[10px] font-bold tracking-wider text-slate-500 mb-0.5">{label}</p>
      <span className="text-3xl font-bold tracking-tight text-slate-900">{value}</span>
    </div>
    <Icon size={80} className="absolute -right-4 -bottom-4 opacity-[0.02] transition-transform group-hover:scale-110" />
  </Card>
);

export default function SecurityCenter() {
  const { user: admin } = useAuth();
  const [bannedUsers, setBannedUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadBannedUsers();
  }, []);

  const loadBannedUsers = async () => {
    setLoading(true);
    try {
      const allUsers = await getUsersAction();
      setBannedUsers(allUsers.filter((u) => u.isBanned));
    } catch (e) {
      toast.error('Failed to load registry.');
    } finally {
      setLoading(false);
    }
  };

  const handleUnban = async (userId: string) => {
    if (!admin) return;
    try {
      await unbanUserAction(admin.id, userId);
      toast.success('Access restored.');
      loadBannedUsers();
    } catch (e) {
      toast.error('Operation failed.');
    }
  };

  const filtered = bannedUsers.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-full space-y-6 animate-in fade-in duration-500 pb-12 max-w-[1200px] mx-auto p-4 md:p-0">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div className="space-y-1">
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-[#6D1B0A] leading-none">
            Security Center
          </h1>
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
            <p className="text-[10px] font-semibold text-slate-500 tracking-[0.15em]">
              Iron Wall Protocol v1.0
            </p>
          </div>
        </div>
        
        <Badge variant="outline" className="rounded-lg px-3 py-1.5 text-[10px] font-bold tracking-wider bg-white shadow-sm border-slate-200">
          <ShieldCheck size={12} className="mr-2 text-green-600" />
          Terminal secured
        </Badge>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <StatBox 
          icon={Ban} 
          label="Active restrictions" 
          value={bannedUsers.length} 
          color="bg-red-50 text-red-600"
          description="Accounts"
        />
        <StatBox 
          icon={ShieldAlert} 
          label="Registry status" 
          value="Locked" 
          color="bg-slate-50 text-slate-700"
          description="Protocol"
        />
        <StatBox 
          icon={Activity} 
          label="System integrity" 
          value="100%" 
          color="bg-emerald-50 text-emerald-600"
          description="Optimal"
        />
      </div>

      {/* Main Terminal Card */}
      <Card className="border border-slate-200 bg-white rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-[500px]">
        {/* Compact Header */}
        <div className="bg-slate-50/50 px-6 py-5 flex flex-col lg:flex-row items-center justify-between gap-4 border-b border-slate-100">
          <div className="space-y-0.5 text-center lg:text-left">
            <h3 className="text-base font-bold text-slate-800">Blacklist registry</h3>
            <p className="text-[11px] font-medium text-slate-500">Manage and review restricted identity access</p>
          </div>

          <div className="relative group w-full lg:w-[350px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <Input
              placeholder="Search by USN or name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 pl-10 rounded-xl border-slate-200 bg-white shadow-sm text-sm focus:ring-primary/20 transition-all"
            />
          </div>
        </div>

        <CardContent className="flex-1 p-0 bg-white">
          {loading ? (
            <div className="h-64 flex flex-col items-center justify-center space-y-3">
              <Loader2 className="animate-spin h-8 w-8 text-slate-300" strokeWidth={2.5} />
              <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Syncing Matrix...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-8 space-y-4">
              <div className="h-16 w-16 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-200 border border-slate-100">
                <UserX size={32} />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-800">No restricted identities</h4>
                <p className="text-[11px] text-slate-400">The registry is currently clear of matching records.</p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {filtered.map((user) => (
                <div
                  key={user.id}
                  className="p-5 hover:bg-slate-50/50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-lg bg-red-50 flex items-center justify-center text-red-500 border border-red-100 shrink-0">
                      <Ban size={18} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{user.name}</h3>
                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-tight">
                        ID: {user.id} • {user.role.replace('_', ' ')}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-1 max-w-md px-4">
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 w-full">
                      <p className="text-[11px] text-slate-600 italic line-clamp-1">
                        "{user.banReason || 'No violation record logged.'}"
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-none font-bold text-[9px] uppercase px-2 py-0.5">
                      Restricted
                    </Badge>
                    <Button
                      onClick={() => handleUnban(user.id)}
                      size="sm"
                      className="h-9 px-4 rounded-lg bg-slate-900 hover:bg-primary text-white font-bold uppercase text-[10px] tracking-wider transition-all"
                    >
                      <Unlock size={14} className="mr-2" />
                      Restore
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>

        {/* Minimalist Footer */}
        <div className="bg-slate-50/50 px-6 py-4 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-slate-300" />
            <span className="text-[9px] font-bold tracking-widest text-slate-400">Authorized access only</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <History size={12} />
            <span className="text-[9px] font-bold">Registry sync: active</span>
          </div>
        </div>
      </Card>
    </div>
  );
}