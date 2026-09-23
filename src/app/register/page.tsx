
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
import { GraduationCap, User, IdentificationCard, Mail, Lock, Loader2, BookOpen, UserCircle } from 'lucide-react';
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
    setLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;
    
    if (password !== confirmPassword) {
      toast({ variant: 'destructive', title: 'Error', description: 'Passwords do not match.' });
      setLoading(false);
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth!, email, password);
      const uid = userCredential.user.uid;

      const profile = {
        uid,
        email,
        role,
        fullName: formData.get('fullName') as string,
        identifier: formData.get('identifier') as string,
        mpm: formData.get('mpm') as string,
        createdAt: new Date().toISOString(),
        ...(role === 'student' ? {
          course: formData.get('course') as string,
          term: formData.get('term') as string,
        } : {
          position: formData.get('position') as string,
        })
      };

      await setDoc(doc(firestore!, 'users', uid), profile);
      toast({ title: 'Success', description: 'Account created successfully.' });
      router.push('/login');
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Registration Failed', description: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full border-none shadow-2xl bg-white/90 backdrop-blur-md">
        <CardHeader className="text-center">
          <GraduationCap className="h-10 w-10 text-primary mx-auto mb-2" />
          <CardTitle className="text-2xl font-bold">Create Account</CardTitle>
          <CardDescription>Join Siklab Academy Lab Management System</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="student" onValueChange={(v) => setRole(v as any)}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="student" className="gap-2">
                <IdentificationCard className="h-4 w-4" /> Student
              </TabsTrigger>
              <TabsTrigger value="teacher" className="gap-2">
                <UserCircle className="h-4 w-4" /> Teacher
              </TabsTrigger>
            </TabsList>

            <form onSubmit={handleRegister} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input id="fullName" name="fullName" placeholder="Juan Dela Cruz" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="identifier">{role === 'student' ? 'USN' : 'EMP ID'}</Label>
                  <Input id="identifier" name="identifier" placeholder={role === 'student' ? '123456789' : 'EMP-001'} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Institutional Email</Label>
                  <Input id="email" name="email" type="email" placeholder="name@siklab.edu.ph" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mpm">MPM / Phone</Label>
                  <Input id="mpm" name="mpm" placeholder="+63 900 000 0000" required />
                </div>

                {role === 'student' ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="course">Course / Program</Label>
                      <Input id="course" name="course" placeholder="BSCS" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="term">Year / Term</Label>
                      <Input id="term" name="term" placeholder="1st Year" required />
                    </div>
                  </>
                ) : (
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="position">Position / Department</Label>
                    <Input id="position" name="position" placeholder="CS Department Head" required />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" name="password" type="password" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input id="confirmPassword" name="confirmPassword" type="password" required />
                </div>
              </div>

              <Button type="submit" className="w-full mt-6 h-12" disabled={loading}>
                {loading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : 'Complete Registration'}
              </Button>
            </form>
          </Tabs>
        </CardContent>
        <CardFooter className="justify-center border-t py-4">
          <p className="text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login" className="text-primary font-bold hover:underline">
              Sign In
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
