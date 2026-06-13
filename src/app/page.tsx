import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, GraduationCap, Laptop, Sparkles, Trophy, Users } from 'lucide-react';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export default function Home() {
  const heroImage = PlaceHolderImages.find(img => img.id === 'hero-learning');

  return (
    <div className="flex flex-col min-h-screen">
      {/* Navigation */}
      <header className="px-4 lg:px-6 h-16 flex items-center border-b bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <Link className="flex items-center justify-center gap-2" href="/">
          <GraduationCap className="h-8 w-8 text-primary" />
          <span className="font-bold text-xl tracking-tight text-primary">Siklab Academy</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Link className="text-sm font-medium hover:text-primary transition-colors" href="/courses">
            Courses
          </Link>
          <Link className="text-sm font-medium hover:text-primary transition-colors" href="/dashboard">
            Dashboard
          </Link>
          <Link href="/dashboard" className="hidden sm:block">
            <Button variant="outline" size="sm">Log In</Button>
          </Link>
          <Link href="/dashboard">
            <Button size="sm">Get Started</Button>
          </Link>
        </nav>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-gradient-to-b from-background to-white">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px] items-center">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none text-primary">
                    Ignite Your Future with <span className="text-accent">Siklab Academy</span>
                  </h1>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl">
                    The modern Learning Management System designed for focus, achievement, and AI-powered educational efficiency.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Link href="/courses">
                    <Button size="lg" className="px-8 bg-primary hover:bg-primary/90">Explore Courses</Button>
                  </Link>
                  <Link href="/dashboard">
                    <Button variant="outline" size="lg" className="px-8">Instructor Portal</Button>
                  </Link>
                </div>
              </div>
              <div className="mx-auto overflow-hidden rounded-xl shadow-2xl lg:order-last">
                <Image
                  alt="Students learning"
                  className="object-cover"
                  height={600}
                  src={heroImage?.imageUrl || ""}
                  width={1200}
                  data-ai-hint="online learning student"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 bg-white">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm text-primary font-medium">Features</div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Everything You Need to Succeed</h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Powerful tools for both students and instructors, built on a foundation of reliability and intelligence.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-start gap-6 py-12 lg:grid-cols-3 lg:gap-12">
              <Card className="border-none shadow-md hover:shadow-lg transition-shadow bg-background/50">
                <CardHeader>
                  <Sparkles className="h-10 w-10 text-accent mb-2" />
                  <CardTitle>AI Quiz Generator</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Instructors can generate high-quality assessment questions instantly from lesson content using our advanced AI engine.
                  </p>
                </CardContent>
              </Card>
              <Card className="border-none shadow-md hover:shadow-lg transition-shadow bg-background/50">
                <CardHeader>
                  <Trophy className="h-10 w-10 text-accent mb-2" />
                  <CardTitle>Progress Tracking</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Visualize your learning journey with interactive progress bars, achievement milestones, and detailed performance analytics.
                  </p>
                </CardContent>
              </Card>
              <Card className="border-none shadow-md hover:shadow-lg transition-shadow bg-background/50">
                <CardHeader>
                  <BookOpen className="h-10 w-10 text-accent mb-2" />
                  <CardTitle>Rich Content Viewer</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    A distraction-free environment for consuming videos, PDFs, and interactive text lessons.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="w-full py-12 md:py-24 lg:py-32 bg-primary text-primary-foreground">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Ready to Start Learning?</h2>
                <p className="mx-auto max-w-[600px] text-primary-foreground/80 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Join thousands of students and educators at Siklab Academy today.
                </p>
              </div>
              <div className="w-full max-w-sm space-y-2">
                <Button size="lg" variant="secondary" className="w-full text-primary font-bold">
                  Create Your Account
                </Button>
                <p className="text-xs text-primary-foreground/60">
                  Free for students. No credit card required to explore.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t bg-white">
        <p className="text-xs text-muted-foreground">© 2024 Siklab Academy. All rights reserved.</p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link className="text-xs hover:underline underline-offset-4" href="#">Terms of Service</Link>
          <Link className="text-xs hover:underline underline-offset-4" href="#">Privacy</Link>
        </nav>
      </footer>
    </div>
  );
}
