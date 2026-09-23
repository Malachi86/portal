'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useFirestore } from '@/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
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

    const inputId = identifier.trim().toLowerCase();
    const formattedEmail = `${inputId}@nexus.local`;

    try {
      let userCredential;
      
      // Auto-provision default admin credentials if it's the emergency account
      if (inputId === 'admin' && password === 'admin123') {
        try {
          userCredential = await signInWithEmailAndPassword(auth, formattedEmail, password);
        } catch (err) {
          // If admin doesn't exist yet, seed it locally automatically
          userCredential = await createUserWithEmailAndPassword(auth, formattedEmail, password);
          await setDoc(doc(firestore, 'users', userCredential.user.uid), {
            uid: userCredential.user.uid,
            email: formattedEmail,
            role: 'admin',
            fullName: 'Emergency Admin Control',
            identifier: 'ADMIN',
            createdAt: new Date().toISOString()
          });
        }
      } else {
        userCredential = await signInWithEmailAndPassword(auth, formattedEmail, password);
      }

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
          description: 'Your credential matches but no local database profile exists.',
        });
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Authentication Failed',
        description: 'Invalid USN or Employee ID / Password. Please check your kiosk card.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-slate-950">
      <Card className="max-w-md w-full border border-slate-800 shadow-2xl bg-slate-900 text-white rounded-[2rem] overflow-hidden">
        <CardHeader className="space-y-2 text-center pt-8">
          <div className="flex justify-center mb-2">
            <div className="h-16 w-16 bg-primary/20 rounded-2xl flex items-center justify-center border border-primary/40">
              <GraduationCap className="h-10 w-10 text-primary" />
            </div>
          </div>
          <CardTitle className="text-3xl font-black tracking-tight text-white">NEXUS TERMINAL</CardTitle>
          <CardDescription className="text-xs uppercase tracking-widest font-bold text-slate-400">Kiosk Access Node</CardDescription>
        </CardHeader>
        <CardContent className="px-8">
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="identifier" className="text-xs font-black uppercase tracking-wider text-slate-300">USN / Employee ID</Label>
              <div className="relative">
                <User className="absolute left-4 top-3.5 h-5 w-5 text-slate-500" />
                <Input
                  id="identifier"
                  placeholder="e.g., 202410123 or EMP-402"
                  className="pl-12 h-12 rounded-xl bg-slate-950 border-slate-800 focus-visible:ring-primary text-white font-medium"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs font-black uppercase tracking-wider text-slate-300">Security Password</Label>
              <div className="relative">
                <Lock className="absolute left-4 top-3.5 h-5 w-5 text-slate-500" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="pl-12 pr-12 h-12 rounded-xl bg-slate-950 border-slate-800 focus-visible:ring-primary text-white font-medium"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="absolute right-4 top-3.5 text-slate-400 hover:text-white"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full h-14 text-lg font-black tracking-wide rounded-xl shadow-lg bg-primary hover:bg-primary/90 text-white mt-2" disabled={loading}>
              {loading ? <Loader2 className="h-6 w-6 animate-spin mx-auto" /> : 'AUTHENTICATE ACCESS'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4 border-t border-slate-800 bg-slate-950 py-6 px-8 text-center">
          <div className="text-sm text-slate-400 font-medium">
            Terminal unregistered?{' '}
            <Link href="/register" className="text-primary font-bold hover:underline">
              Create account
            </Link>
          </div>
          <div className="bg-slate-900 p-3 rounded-xl text-[11px] text-slate-400 font-mono border border-slate-800 text-left w-full">
            <span className="font-bold uppercase text-amber-500 block mb-0.5">Default Admin Node:</span>
            USN / ID: <span className="font-bold text-white">admin</span> | Password: <span className="font-bold text-white">admin123</span>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
