'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useFirestore } from '@/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GraduationCap, IdCard, User, Lock, Loader2, Phone, BookOpen, UserCircle } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<'student' | 'teacher'>('student');
  const router = useRouter();
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!auth || !firestore) return;
    setLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const identifier = (formData.get('identifier') as string).trim().toLowerCase();
    const fullName = formData.get('fullName') as string;
    const mpm = formData.get('mpm') as string;
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;
    
    if (password !== confirmPassword) {
      toast({ variant: 'destructive', title: 'Registration Failed', description: 'Passwords do not match.' });
      setLoading(false);
      return;
    }

    const systemEmail = `${identifier}@nexus.local`;

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, systemEmail, password);
      const uid = userCredential.user.uid;

      const profile = {
        uid,
        email: systemEmail,
        role,
        fullName,
        identifier: identifier.toUpperCase(),
        mpm,
        createdAt: new Date().toISOString(),
        ...(role === 'student' ? {
          course: formData.get('course') as string,
          term: formData.get('term') as string,
        } : {
          position: formData.get('position') as string,
        })
      };

      await setDoc(doc(firestore, 'users', uid), profile);
      toast({ 
        title: 'Account Registered', 
        description: `Successfully registered ${role === 'student' ? 'USN' : 'EMP ID'}: ${identifier.toUpperCase()}` 
      });
      router.push('/login');
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Registration Failed', description: error.message || 'Error occurred.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-slate-950">
      <Card className="max-w-2xl w-full border-none shadow-2xl bg-white/95 backdrop-blur-md rounded-[2.5rem] overflow-hidden">
        <CardHeader className="text-center pt-8">
          <div className="h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-2">
            <GraduationCap className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-black text-slate-900">LOCAL REGISTRATION</CardTitle>
          <CardDescription className="text-sm font-medium text-muted-foreground">Register terminal profile for laboratory tracking</CardDescription>
        </CardHeader>
        <CardContent className="px-8">
          <Tabs defaultValue="student" onValueChange={(v) => setRole(v as any)}>
            <TabsList className="grid w-full grid-cols-2 mb-6 h-12 bg-slate-100 p-1 rounded-xl">
              <TabsTrigger value="student" className="gap-2 text-sm font-bold rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <IdCard className="h-4 w-4" /> Student Profile
              </TabsTrigger>
              <TabsTrigger value="teacher" className="gap-2 text-sm font-bold rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <UserCircle className="h-4 w-4" /> Teacher / Faculty
              </TabsTrigger>
            </TabsList>

            <form onSubmit={handleRegister} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="identifier" className="text-xs font-black uppercase text-slate-700">
                    {role === 'student' ? 'Student Number (USN)' : 'Employee ID (EMP)'}
                  </Label>
                  <Input 
                    id="identifier" 
                    name="identifier" 
                    placeholder={role === 'student' ? 'e.g., 202410123' : 'e.g., EMP-402'} 
                    required 
                    className="h-11 rounded-lg border-2 focus-visible:ring-primary font-medium"
                  />
                </div>
                
                <div className="space-y-1.5">
                  <Label htmlFor="fullName" className="text-xs font-black uppercase text-slate-700">Full Name</Label>
                  <Input 
                    id="fullName" 
                    name="fullName" 
                    placeholder="e.g., Juan Dela Cruz" 
                    required 
                    className="h-11 rounded-lg border-2 focus-visible:ring-primary font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="mpm" className="text-xs font-black uppercase text-slate-700">Contact / Phone Number</Label>
                  <Input 
                    id="mpm" 
                    name="mpm" 
                    placeholder="e.g., 09171234567" 
                    required 
                    className="h-11 rounded-lg border-2 focus-visible:ring-primary font-medium"
                  />
                </div>

                {role === 'student' ? (
                  <>
                    <div className="space-y-1.5">
                      <Label htmlFor="course" className="text-xs font-black uppercase text-slate-700">Course / Program</Label>
                      <Input 
                        id="course" 
                        name="course" 
                        placeholder="e.g., BSCS or BSIT" 
                        required 
                        className="h-11 rounded-lg border-2 focus-visible:ring-primary font-medium"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="term" className="text-xs font-black uppercase text-slate-700">Year Level / Term</Label>
                      <Input 
                        id="term" 
                        name="term" 
                        placeholder="e.g., 3rd Year" 
                        required 
                        className="h-11 rounded-lg border-2 focus-visible:ring-primary font-medium"
                      />
                    </div>
                  </>
                ) : (
                  <div className="space-y-1.5 md:col-span-1">
                    <Label htmlFor="position" className="text-xs font-black uppercase text-slate-700">Department / Position</Label>
                    <Input 
                      id="position" 
                      name="position" 
                      placeholder="e.g., IT Instructor" 
                      required 
                      className="h-11 rounded-lg border-2 focus-visible:ring-primary font-medium"
                    />
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-xs font-black uppercase text-slate-700">Password</Label>
                  <Input 
                    id="password" 
                    name="password" 
                    type="password" 
                    placeholder="••••••••"
                    required 
                    className="h-11 rounded-lg border-2 focus-visible:ring-primary"
                  />
                </div>
                
                <div className="space-y-1.5">
                  <Label htmlFor="confirmPassword" className="text-xs font-black uppercase text-slate-700">Confirm Password</Label>
                  <Input 
                    id="confirmPassword" 
                    name="confirmPassword" 
                    type="password" 
                    placeholder="••••••••"
                    required 
                    className="h-11 rounded-lg border-2 focus-visible:ring-primary"
                  />
                </div>
              </div>

              <Button type="submit" className="w-full mt-4 h-12 font-black tracking-wide rounded-xl shadow-md bg-primary hover:bg-primary/90" disabled={loading}>
                {loading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : 'REGISTER PROFILE'}
              </Button>
            </form>
          </Tabs>
        </CardContent>
        <CardFooter className="justify-center border-t bg-slate-50/50 py-5 px-8">
          <p className="text-sm font-medium text-muted-foreground">
            Already have a credential?{' '}
            <Link href="/login" className="text-primary font-bold hover:underline">
              Sign In with Identifier
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
