'use client';

import React, { useState } from 'react';
import { ScannerComponent } from '@/components/teacher/ScannerComponent';
import { User } from '@/utils/storage';
import { getUsersAction, addCampusLogAction } from '@/app/actions/dbActions';
import { toast } from 'sonner';
import { Loader2, ShieldCheck, User as UserIcon, Mail, Barcode, ArrowLeft } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { QRCodeSVG as QRCode } from 'qrcode.react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const VisualBarcode = ({ value }: { value: string }) => {
  const bars = value.split('').map((char, i) => {
    const digit = parseInt(char) || 0;
    const width = (digit % 2 === 0) ? 6 : 3;
    const height = 48;
    const gap = 4;
    const x = i * (6 + gap);
    return (
      <rect key={i} x={x} y={0} width={width} height={height} fill="#D1432A" rx={2} />
    );
  });
  return <svg width={value.length * 10} height="48" viewBox={`0 0 ${value.length * 10} 48`} className="mx-auto">{bars}</svg>;
};

interface CampusScannerProps {
  onBack?: () => void;
}

export default function CampusScanner({ onBack }: CampusScannerProps) {
  const [verifying, setVerifying] = useState(false);
  const [scanMode, setScanMode] = useState<'entry' | 'exit'>('entry');
  const [verifiedUser, setVerifiedUser] = useState<User | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleScan = async (data: string) => {
    setVerifying(true);
    try {
      const users = await getUsersAction();
      const user = users.find(u => u.id === data.trim());

      if (user) {
        if (user.isBanned) {
          toast.error("SECURITY ALERT: Blacklisted Identity Detected.");
          return;
        }

        await addCampusLogAction({
          userId: user.id,
          userName: user.name,
          role: user.role,
          type: scanMode,
          location: 'Main Gate'
        });

        setVerifiedUser(user);
        setIsModalOpen(true);
        toast.success(`Identity Verified: Welcome, ${user.name}`);
      } else {
        toast.error("ACCESS DENIED: Identity not found in Registry.");
      }
    } catch (e) {
      toast.error("Validation system failure.");
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col items-center text-center relative">
        {onBack && (
          <Button 
            variant="ghost" 
            onClick={onBack} 
            className="absolute left-0 top-0 h-12 w-12 rounded-full p-0 flex items-center justify-center hover:bg-primary/5 transition-all active:scale-90"
          >
            <ArrowLeft className="h-6 w-6 text-primary" />
          </Button>
        )}
        <h2 className="text-4xl font-black text-primary tracking-tighter uppercase leading-none">Security Portal</h2>
        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.4em] mt-2">Campus Access Control v1.0</p>
      </div>

      <div className="flex justify-center gap-4">
        <button 
          onClick={() => setScanMode('entry')}
          className={cn(
            "h-16 px-10 rounded-2xl font-black uppercase text-xs tracking-widest transition-all shadow-xl active:scale-95",
            scanMode === 'entry' ? "bg-primary text-white" : "bg-white text-muted-foreground border-2 border-primary/10"
          )}
        >
          Gate Entry
        </button>
        <button 
          onClick={() => setScanMode('exit')}
          className={cn(
            "h-16 px-10 rounded-2xl font-black uppercase text-xs tracking-widest transition-all shadow-xl active:scale-95",
            scanMode === 'exit' ? "bg-primary text-white" : "bg-white text-muted-foreground border-2 border-primary/10"
          )}
        >
          Gate Exit
        </button>
      </div>

      <div className="bg-white rounded-[3rem] p-10 shadow-2xl border-primary/5 flex flex-col items-center">
        {verifying ? (
          <div className="h-64 flex flex-col items-center justify-center space-y-6">
            <div className="relative">
              <Loader2 className="animate-spin h-20 w-20 text-primary" strokeWidth={3} />
              <ShieldCheck className="absolute inset-0 m-auto h-8 w-8 text-primary/40" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary animate-pulse">Verifying Identity...</p>
          </div>
        ) : (
          <div className="w-full max-w-md">
            <ScannerComponent 
              onScan={handleScan} 
              mode={scanMode === 'entry' ? 'in' : 'out'} 
            />
          </div>
        )}
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-xl p-0 overflow-hidden border-none rounded-[2.5rem] shadow-3xl bg-white no-scrollbar">
          <DialogHeader className="sr-only">
            <DialogTitle>Verification Result</DialogTitle>
            <DialogDescription>Student Identity Verification</DialogDescription>
          </DialogHeader>
          
          {verifiedUser && (
            <div className="flex flex-col h-full max-h-[90vh] overflow-y-auto no-scrollbar">
              <div className="bg-primary p-8 text-white flex items-start gap-6 relative">
                <div className="w-24 h-24 rounded-2xl bg-white/20 flex items-center justify-center overflow-hidden border-2 border-white/20 shrink-0 shadow-xl">
                  {verifiedUser.profilePic ? (
                    <img src={verifiedUser.profilePic} alt="profile" className="w-full h-full object-cover" />
                  ) : (
                    <UserIcon size={48} />
                  )}
                </div>
                <div className="flex-1 space-y-1 mt-1">
                  <h3 className="text-2xl font-black uppercase tracking-tight leading-tight">{verifiedUser.name}</h3>
                  <div className="space-y-0.5 pt-2">
                    <p className="text-xs font-bold opacity-90 uppercase tracking-widest">ID: {verifiedUser.id}</p>
                    <p className="text-xs font-bold opacity-90 uppercase tracking-widest">Year: {verifiedUser.year || 'N/A'}</p>
                    <p className="text-xs font-bold opacity-90 uppercase tracking-widest">Program: {verifiedUser.program || 'N/A'}</p>
                  </div>
                </div>
              </div>

              <div className="p-8 grid grid-cols-2 gap-6 bg-slate-50/50">
                <div className="bg-white rounded-3xl p-8 flex flex-col items-center justify-center border-2 border-primary/5 shadow-xl transition-transform hover:scale-[1.02]">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#D1432A]/40 mb-6">QUICK ID SCAN</p>
                  <QRCode value={verifiedUser.id} size={120} includeMargin />
                </div>
                <div className="bg-white rounded-3xl p-8 flex flex-col items-center justify-center border-2 border-primary/5 shadow-xl transition-transform hover:scale-[1.02]">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#D1432A]/40 mb-6">ASSET BARCODE</p>
                  <div className="flex items-center justify-center h-16 w-full">
                    <VisualBarcode value={verifiedUser.id} />
                  </div>
                  <p className="mt-6 font-black text-sm tracking-[0.4em] text-foreground">{verifiedUser.id}</p>
                </div>
              </div>

              <div className="px-8 grid grid-cols-2 gap-4 py-6">
                <div className="p-5 rounded-2xl border border-primary/5 flex items-center gap-4 bg-white shadow-sm">
                  <div className="h-10 w-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary">
                    <Mail size={20} />
                  </div>
                  <div className="overflow-hidden text-left">
                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Email</p>
                    <p className="text-xs font-black truncate text-primary">{verifiedUser.email}</p>
                  </div>
                </div>
                <div className="p-5 rounded-2xl border border-green-100 flex items-center gap-4 bg-green-50/30 shadow-sm">
                  <div className="h-10 w-10 rounded-xl bg-green-100 flex items-center justify-center text-green-600">
                    <ShieldCheck size={20} />
                  </div>
                  <div className="text-left">
                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Status</p>
                    <p className="text-xs font-black text-green-600 uppercase tracking-tighter">Verified Active</p>
                  </div>
                </div>
              </div>

              <div className="px-8 pb-10 space-y-4">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Emergency Contact</h4>
                <div className="p-8 rounded-[2rem] border border-primary/5 bg-slate-50/50 space-y-4 shadow-inner text-left">
                  <div className="grid grid-cols-[80px_1fr] items-center gap-2">
                    <span className="font-black text-muted-foreground uppercase text-[10px] tracking-widest">Name:</span>
                    <span className="font-bold text-sm text-foreground uppercase truncate">{verifiedUser.emergencyContactName || 'N/A'}</span>
                  </div>
                  <div className="grid grid-cols-[80px_1fr] items-center gap-2">
                    <span className="font-black text-muted-foreground uppercase text-[10px] tracking-widest">Address:</span>
                    <span className="font-bold text-sm text-foreground uppercase truncate">{verifiedUser.emergencyContactAddress || 'N/A'}</span>
                  </div>
                  <div className="grid grid-cols-[80px_1fr] items-center gap-2">
                    <span className="font-black text-muted-foreground uppercase text-[10px] tracking-widest">Tel. No:</span>
                    <span className="font-bold text-sm text-foreground">{verifiedUser.emergencyContactPhone || 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}