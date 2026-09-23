'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { login as loginAction } from '@/app/actions/authActions'; 
import { ArrowRight, Lock } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export default function LoginPage() {
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth(); 

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await loginAction(id, password);
      
      if (result.success && result.user) {
        const user = result.user as any; 
        login(user); 
        toast.success(`Access Granted: Welcome, ${user.name}`);
      } else {
        toast.error(result.message || 'Identity verification failed.');
      }
    } catch (error) {
      console.error(error); 
      toast.error('System Authentication Error');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col">
      <header className="bg-primary shadow-md">
        <div className="container mx-auto px-6 py-4">
          <Image src="/logo.png" alt="AMA Student Portal" width={150} height={40} />
        </div>
      </header>

      <main className="flex-grow flex items-center justify-center p-4">
        <div className="w-full max-w-4xl bg-white rounded-[3rem] shadow-2xl overflow-hidden flex flex-col md:flex-row">
          <div className="w-full md:w-2/5 bg-primary text-white p-12 flex flex-col justify-center items-start">
            <h1 className="text-4xl font-black mb-4 uppercase tracking-tighter">AUTHENTICATION</h1>
            <p className="text-white/80 leading-relaxed font-bold">Secure access to AMA Student infrastructure. Use your USN or Employee ID to continue.</p>
          </div>

          <div className="w-full md:w-3/5 p-12">
            <h2 className="text-2xl font-black uppercase tracking-tight mb-2">Welcome Back</h2>
            <p className="text-muted-foreground font-bold text-xs uppercase tracking-widest mb-8">Registry Handshake Required</p>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="id" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Universal ID (USN/EMP)</Label>
                <Input
                  id="id"
                  type="text"
                  value={id}
                  onChange={(e) => setId(e.target.value)}
                  required
                  className="h-14 rounded-2xl font-bold text-lg px-6 border-primary/10"
                  placeholder="ID Number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password"  className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Access Key</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-14 rounded-2xl px-6 border-primary/10"
                  placeholder="••••••••"
                />
              </div>
              <Button 
                type="submit" 
                className="w-full h-16 text-sm font-black uppercase tracking-widest bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 rounded-2xl gap-3 transition-all active:scale-95" 
                disabled={loading}
              >
                {loading ? 'VERIFYING...' : 'SECURE SIGN IN'}
                <ArrowRight className="w-5 h-5" />
              </Button>
            </form>
            <div className="text-center mt-8">
              <p className="text-sm font-bold text-muted-foreground">
                Don't have an account? <Link href="/register" className="font-black text-primary hover:underline">Register Identity</Link>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
