'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Camera,
  Save,
  Loader2,
  QrCode,
  User as UserIcon,
  Mail,
  ShieldCheck,
  Barcode,
  ArrowLeft
} from 'lucide-react';
import { toast } from 'sonner';
import { updateUserAction } from '@/app/actions/dbActions';
import { compressImage } from '@/lib/compression';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription
} from '@/components/ui/dialog';
import { QRCodeSVG as QRCode } from 'qrcode.react';
import { Department } from '@/utils/storage';

const VisualBarcode = ({ value }: { value: string }) => {
  const bars = value.split('').map((char, i) => {
    const digit = parseInt(char) || 0;
    const width = (digit % 2 === 0) ? 6 : 3;
    const height = 48;
    const gap = 4;
    const x = i * (6 + gap);
    return (
      <rect 
        key={i} 
        x={x} 
        y={0} 
        width={width} 
        height={height} 
        fill="#D1432A" 
        rx={2}
      />
    );
  });

  return (
    <svg 
      width={value.length * 10} 
      height="48" 
      viewBox={`0 0 ${value.length * 10} 48`} 
      className="mx-auto"
    >
      {bars}
    </svg>
  );
};

interface ProfileViewProps {
  onBack?: () => void;
}

export default function ProfileView({ onBack }: ProfileViewProps) {
  const { user, updateCurrentUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    department: 'college' as Department,
    program: '',
    year: 1,
    position: '',
    profilePic: '',
    emergencyContactName: '',
    emergencyContactAddress: '',
    emergencyContactPhone: ''
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        department: (user.department as Department) || 'college',
        program: user.program || '',
        year: user.year || 1,
        position: user.position || '',
        profilePic: user.profilePic || '',
        emergencyContactName: user.emergencyContactName || '',
        emergencyContactAddress: user.emergencyContactAddress || '',
        emergencyContactPhone: user.emergencyContactPhone || ''
      });
    }
  }, [user]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      const compressed = await compressImage(base64);
      setFormData({ ...formData, profilePic: compressed });
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const updates: any = {
        name: formData.name,
        email: formData.email,
        department: formData.department,
        profilePic: formData.profilePic
      };
      
      if (user.role === 'student') {
        updates.program = formData.program;
        updates.year = formData.year;
        updates.emergencyContactName = formData.emergencyContactName;
        updates.emergencyContactAddress = formData.emergencyContactAddress;
        updates.emergencyContactPhone = formData.emergencyContactPhone;
      } else {
        updates.position = formData.position;
      }

      const updatedUser = await updateUserAction(user.id, updates);
      if (updatedUser) {
        updateCurrentUser(updatedUser);
        toast.success('Profile updated successfully');
      } else {
        toast.error('User not found');
      }
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
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
            <h2 className="text-3xl font-black text-primary tracking-tighter uppercase leading-none">Account Profile</h2>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mt-2">Manage your identity and credentials</p>
          </div>
        </div>

        <Dialog>
          <DialogTrigger asChild>
            <button className="h-14 px-6 bg-white rounded-2xl flex items-center justify-center gap-4 shadow-xl border border-primary/5 hover:border-primary transition-all active:scale-95 group">
              <QrCode className="h-6 w-6 text-primary" />
              <div className="h-8 w-px bg-primary/10" />
              <Barcode className="h-6 w-6 text-primary" />
            </button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-xl p-0 overflow-hidden border-none rounded-[2.5rem] shadow-3xl">
            <DialogHeader className="sr-only">
              <DialogTitle>Digital Identity Card</DialogTitle>
              <DialogDescription>Universal Identity Protocol</DialogDescription>
            </DialogHeader>
            <div className="bg-white flex flex-col h-full overflow-y-auto no-scrollbar max-h-[90vh]">
              <div className="bg-primary p-8 text-white flex items-start gap-6 relative">
                <div className="w-24 h-24 rounded-2xl bg-white/20 flex items-center justify-center overflow-hidden border-2 border-white/20 shrink-0 shadow-xl">
                  {formData.profilePic ? (
                    <img src={formData.profilePic} alt="profile" className="w-full h-full object-cover" />
                  ) : (
                    <UserIcon size={48} />
                  )}
                </div>
                <div className="flex-1 space-y-1 mt-1">
                  <h3 className="text-2xl font-black uppercase tracking-tight leading-tight leading-none">{user.name}</h3>
                  <div className="space-y-0.5 pt-2">
                    <p className="text-xs font-bold opacity-90 uppercase tracking-widest">ID: {user.id}</p>
                    <p className="text-xs font-bold opacity-90 uppercase tracking-widest">Year: {user.year || 'N/A'}</p>
                    <p className="text-xs font-bold opacity-90 uppercase tracking-widest">Program: {user.program || 'N/A'}</p>
                  </div>
                </div>
              </div>

              <div className="p-8 grid grid-cols-2 gap-6 bg-slate-50/50">
                <div className="bg-white rounded-3xl p-8 flex flex-col items-center justify-center border-2 border-primary/5 shadow-xl transition-transform hover:scale-[1.02]">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#D1432A]/40 mb-6">QUICK ID SCAN</p>
                  <QRCode value={user.id} size={140} includeMargin />
                </div>
                <div className="bg-white rounded-3xl p-8 flex flex-col items-center justify-center border-2 border-primary/5 shadow-xl transition-transform hover:scale-[1.02]">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#D1432A]/40 mb-6">ASSET BARCODE</p>
                  <div className="flex items-center justify-center h-16 w-full">
                    <VisualBarcode value={user.id} />
                  </div>
                  <p className="mt-6 font-black text-sm tracking-[0.4em] text-foreground">{user.id}</p>
                </div>
              </div>

              <div className="px-8 grid grid-cols-2 gap-4 py-6">
                <div className="p-5 rounded-2xl border border-primary/5 flex items-center gap-4 bg-white shadow-sm">
                  <div className="h-10 w-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary">
                    <Mail size={20} />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Email</p>
                    <p className="text-xs font-black truncate text-primary">{user.email}</p>
                  </div>
                </div>
                <div className="p-5 rounded-2xl border border-green-100 flex items-center gap-4 bg-green-50/30 shadow-sm">
                  <div className="h-10 w-10 rounded-xl bg-green-100 flex items-center justify-center text-green-600">
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Status</p>
                    <p className="text-xs font-black text-green-600 uppercase tracking-tighter">Verified Active</p>
                  </div>
                </div>
              </div>

              <div className="px-8 pb-10 space-y-4">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Emergency Contact</h4>
                <div className="p-8 rounded-[2rem] border border-primary/5 bg-slate-50/50 space-y-4 shadow-inner">
                  <div className="grid grid-cols-[80px_1fr] items-center gap-2">
                    <span className="font-black text-muted-foreground uppercase text-[10px] tracking-widest">Name:</span>
                    <span className="font-bold text-sm text-foreground uppercase truncate">{formData.emergencyContactName || 'N/A'}</span>
                  </div>
                  <div className="grid grid-cols-[80px_1fr] items-center gap-2">
                    <span className="font-black text-muted-foreground uppercase text-[10px] tracking-widest">Address:</span>
                    <span className="font-bold text-sm text-foreground uppercase truncate">{formData.emergencyContactAddress || 'N/A'}</span>
                  </div>
                  <div className="grid grid-cols-[80px_1fr] items-center gap-2">
                    <span className="font-black text-muted-foreground uppercase text-[10px] tracking-widest">Tel. No:</span>
                    <span className="font-bold text-sm text-foreground">{formData.emergencyContactPhone || 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="rounded-[3rem] overflow-hidden shadow-2xl border-none">
        <div className="bg-primary/5 h-64 flex flex-col items-center justify-center p-8 relative">
          <div className="relative group">
            <div className="w-32 h-32 rounded-[2.5rem] bg-primary flex items-center justify-center text-5xl text-white font-black shadow-2xl shadow-primary/30 transition-transform hover:scale-105 overflow-hidden">
              {formData.profilePic ? (
                <img src={formData.profilePic} alt="profile" className="w-full h-full object-cover" />
              ) : (
                user.name.charAt(0)
              )}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-white text-primary flex items-center justify-center shadow-xl border-2 border-primary/5 hover:bg-primary hover:text-white transition-colors"
            >
              <Camera size={18} />
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
          </div>
          
          <div className="mt-6 text-center">
            <h2 className="text-2xl font-black uppercase tracking-tight text-foreground">
              {formData.name}
            </h2>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground mt-2">
              {user.role.replace('_', ' ')} • {formData.department?.toUpperCase()}
            </p>
          </div>
        </div>

        <CardContent className="p-10 md:p-16 space-y-12">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Full Name</Label>
              <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="h-14 rounded-2xl border-primary/10 font-bold px-6" />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Email Address</Label>
              <Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="h-14 rounded-2xl border-primary/10 font-bold px-6" />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Academic Department</Label>
              <Select value={formData.department} onValueChange={(v: Department) => setFormData({ ...formData, department: v })}>
                <SelectTrigger className="h-14 rounded-2xl border-primary/10 font-bold px-6"><SelectValue /></SelectTrigger>
                <SelectContent className="rounded-2xl">
                  <SelectItem value="college" className="font-bold">College</SelectItem>
                  <SelectItem value="shs" className="font-bold">Senior High School</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {user.role === 'student' ? (
              <>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Year / Grade Level</Label>
                  <Select value={String(formData.year)} onValueChange={(v) => setFormData({ ...formData, year: parseInt(v) })}>
                    <SelectTrigger className="h-14 rounded-2xl border-primary/10 font-bold px-6"><SelectValue /></SelectTrigger>
                    <SelectContent className="rounded-2xl">
                      {formData.department === 'shs' ? (
                        <>
                          <SelectItem value="11" className="font-bold">Grade 11</SelectItem>
                          <SelectItem value="12" className="font-bold">Grade 12</SelectItem>
                        </>
                      ) : (
                        <>
                          <SelectItem value="1" className="font-bold">1st Year</SelectItem>
                          <SelectItem value="2" className="font-bold">2nd Year</SelectItem>
                          <SelectItem value="3" className="font-bold">3rd Year</SelectItem>
                          <SelectItem value="4" className="font-bold">4th Year</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Universal ID Number</Label>
                  <Input value={user.id} disabled className="h-14 rounded-2xl bg-muted/50 border-primary/5 font-bold px-6" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Program / Strand</Label>
                  <Input value={formData.program} onChange={(e) => setFormData({ ...formData, program: e.target.value })} className="h-14 rounded-2xl border-primary/10 font-bold px-6" />
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Professional Position</Label>
                  <Input value={formData.position} onChange={(e) => setFormData({ ...formData, position: e.target.value })} className="h-14 rounded-2xl border-primary/10 font-bold px-6" placeholder="e.g. IT Instructor, Librarian" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Employee ID Number</Label>
                  <Input value={user.id} disabled className="h-14 rounded-2xl bg-muted/50 border-primary/5 font-bold px-6" />
                </div>
              </>
            )}
          </div>

          {user.role === 'student' && (
            <div className="border-t border-primary/5 pt-10 space-y-8">
              <h3 className="text-sm font-black uppercase tracking-widest text-primary">Emergency Contact</h3>
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Contact Person</Label>
                  <Input value={formData.emergencyContactName} onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })} className="h-14 rounded-2xl border-primary/10 font-bold px-6" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Contact Number</Label>
                  <Input value={formData.emergencyContactPhone} onChange={(e) => setFormData({ ...formData, emergencyContactPhone: e.target.value })} className="h-14 rounded-2xl border-primary/10 font-bold px-6" />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Home Address</Label>
                  <Input value={formData.emergencyContactAddress} onChange={(e) => setFormData({ ...formData, emergencyContactAddress: e.target.value })} className="h-14 rounded-2xl border-primary/10 font-bold px-6" />
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-4 pt-10">
            <Button onClick={handleSave} disabled={loading} className="h-14 px-10 rounded-2xl bg-primary text-white font-black uppercase text-xs tracking-widest shadow-xl shadow-primary/20">
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save Profile
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}