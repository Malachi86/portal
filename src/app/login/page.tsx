'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useFirestore } from '@/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { GraduationCap, Lock, User, Loader2, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

export default function LoginPage() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth || !firestore) return;
    setLoading(true);

    // Format the identifier into an internal system email credential format
    const formattedEmail = identifier.trim().toLowerCase().includes('@') 
      ? identifier.trim().toLowerCase() 
      : `${identifier.trim().toLowerCase()}@nexus.local`;

    try {
      const userCredential = await signInWithEmailAndPassword(auth, formattedEmail, password);
      const userDoc = await getDoc(doc(firestore, 'users', userCredential.user.uid));
      
      if (userDoc.exists()) {
        const role = userDoc.data().role;
        toast({
          title: "Access Granted",
          description: `Welcome back, ${userDoc.data().fullName || 'User'}!`,
        });
        if (role === 'admin') router.push('/admin');
        else router.push('/dashboard');
      } else {
        toast({
          variant: 'destructive',
          title: 'Profile Not Found',
          description: 'Your account was authenticated, but no local profile exists.',
        });
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Authentication Failed',
        description: 'Invalid USN/EMP ID or password. Please verify your credentials.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-slate-950">
      <Card className="max-w-md w-full border-none shadow-2xl bg-white/95 backdrop-blur-md rounded-[2rem] overflow-hidden">
        <CardHeader className="space-y-2 text-center pt-8">
          <div className="flex justify-center mb-2">
            <div className="h-16 w-16 bg-primary/10 rounded-2xl flex items-center justify-center">
              <GraduationCap className="h-10 w-10 text-primary" />
            </div>
          </div>
          <CardTitle className="text-3xl font-black tracking-tight text-slate-900">NEXUS ENGINE</CardTitle>
          <CardDescription className="text-xs uppercase tracking-widest font-bold text-muted-foreground">Kiosk Secure Access Terminal</CardDescription>
        </CardHeader>
        <CardContent className="px-8">
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="identifier" className="text-xs font-black uppercase tracking-wider text-slate-700">USN / Employee ID</Label>
              <div className="relative">
                <User className="absolute left-4 top-3.5 h-5 w-5 text-muted-foreground" />
                <Input
                  id="identifier"
                  placeholder="e.g., 202410123 or EMP-402"
                  className="pl-12 h-12 rounded-xl border-2 focus-visible:ring-primary font-medium"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs font-black uppercase tracking-wider text-slate-700">Security Password</Label>
              <div className="relative">
                <Lock className="absolute left-4 top-3.5 h-5 w-5 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="pl-12 pr-12 h-12 rounded-xl border-2 focus-visible:ring-primary font-medium"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="absolute right-4 top-3.5 text-muted-foreground hover:text-slate-800"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full h-14 text-lg font-black tracking-wide rounded-xl shadow-lg bg-primary hover:bg-primary/90 mt-2" disabled={loading}>
              {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : 'AUTHENTICATE TERMINAL'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4 border-t bg-slate-50/50 py-6 px-8 text-center">
          <div className="text-sm text-muted-foreground font-medium">
            Terminal unregistered?{' '}
            <Link href="/register" className="text-primary font-bold hover:underline">
              Create local account
            </Link>
          </div>
          <div className="bg-slate-100 p-3 rounded-xl text-[11px] text-slate-600 font-mono border text-left">
            <span className="font-bold uppercase text-amber-700 block mb-0.5">Default Emergency Admin:</span>
            User ID: <span className="font-bold">admin</span> | Password: <span className="font-bold">admin123</span>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
