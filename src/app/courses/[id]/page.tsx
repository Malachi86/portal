import { PlaceHolderImages } from '@/lib/placeholder-images';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { BookOpen, CheckCircle, PlayCircle, FileText, Lock, ChevronRight, GraduationCap, Sparkles } from 'lucide-react';

export default async function CourseDetailPage({ params }: { params: { id: string } }) {
  const { id } = await params;
  
  const course = {
    id: 1,
    title: 'Introduction to React.js',
    description: 'Master the fundamentals of React, hooks, and modern component architecture with hands-on projects and deep dives.',
    instructor: 'Dr. Sarah Smith',
    instructorTitle: 'Senior Software Architect',
    instructorBio: 'Sarah has over 15 years of experience in full-stack development and has taught thousands of students worldwide.',
    rating: 4.8,
    progress: 45,
    imageId: 'course-coding',
    syllabus: [
      {
        title: 'Module 1: Getting Started',
        lessons: [
          { id: '101', title: 'Why React?', type: 'video', duration: '12:05', completed: true },
          { id: '102', title: 'Your First React App', type: 'text', duration: '15 mins', completed: true },
        ]
      },
      {
        title: 'Module 2: Components & Props',
        lessons: [
          { id: '201', title: 'Understanding Functional Components', type: 'video', duration: '18:40', completed: true },
          { id: '202', title: 'Props and State Deep Dive', type: 'video', duration: '22:15', completed: false },
          { id: '203', title: 'Mini Project: Profile Card', type: 'file', duration: 'PDF', completed: false },
        ]
      },
      {
        title: 'Module 3: Advanced Hooks',
        lessons: [
          { id: '301', title: 'The useEffect Life-cycle', type: 'video', duration: '25:00', completed: false, locked: true },
          { id: '302', title: 'Custom Hooks for Reusability', type: 'video', duration: '20:10', completed: false, locked: true },
          { id: '303', title: 'Hooks Quiz', type: 'quiz', duration: '10 questions', completed: false, locked: true },
        ]
      }
    ]
  };

  const img = PlaceHolderImages.find(p => p.id === course.imageId);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-accent/10 text-accent border-none font-bold">DEVELOPMENT</Badge>
              <span className="text-muted-foreground text-sm flex items-center gap-1">
                <BookOpen className="h-4 w-4" /> 8 Modules
              </span>
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-primary leading-tight">{course.title}</h1>
            <p className="text-lg text-muted-foreground leading-relaxed">{course.description}</p>
          </div>

          <div className="space-y-6">
            <h2 className="text-2xl font-bold border-b pb-2">Course Syllabus</h2>
            <div className="space-y-4">
              {course.syllabus.map((module, mIdx) => (
                <Card key={mIdx} className="border-none shadow-sm overflow-hidden bg-white">
                  <CardHeader className="bg-muted/30 py-4">
                    <CardTitle className="text-lg">{module.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y">
                      {module.lessons.map((lesson) => (
                        <div key={lesson.id} className={`flex items-center justify-between p-4 transition-colors ${lesson.locked ? 'opacity-50' : 'hover:bg-primary/5'}`}>
                          <div className="flex items-center gap-3">
                            <div className="text-muted-foreground">
                              {lesson.completed ? (
                                <CheckCircle className="h-5 w-5 text-green-500" />
                              ) : lesson.type === 'video' ? (
                                <PlayCircle className="h-5 w-5" />
                              ) : lesson.type === 'quiz' ? (
                                <Sparkles className="h-5 w-5 text-accent" />
                              ) : (
                                <FileText className="h-5 w-5" />
                              )}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm font-medium">{lesson.title}</span>
                              <span className="text-xs text-muted-foreground uppercase">{lesson.duration} • {lesson.type}</span>
                            </div>
                          </div>
                          {lesson.locked ? (
                            <Lock className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Button variant="ghost" size="sm" asChild>
                              <Link href={`/courses/${id}/lessons/${lesson.id}`}>
                                <ChevronRight className="h-4 w-4" />
                              </Link>
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <Card className="sticky top-24 border-none shadow-lg overflow-hidden bg-white">
            <div className="relative aspect-video">
              <Image 
                src={img?.imageUrl || ""} 
                alt={course.title} 
                fill 
                className="object-cover"
              />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
                <PlayCircle className="h-16 w-16 text-white" />
              </div>
            </div>
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2 mb-2">
                <Progress value={course.progress} className="h-2 flex-1" />
                <span className="text-sm font-bold text-primary">{course.progress}%</span>
              </div>
              <CardDescription className="text-center">You've completed 4 out of 12 lessons</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Link href={`/courses/${id}/lessons/101`}>
                <Button className="w-full bg-primary hover:bg-primary/90 text-lg py-6" size="lg">
                  Resume Learning
                </Button>
              </Link>
              <div className="pt-4 border-t space-y-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src="https://picsum.photos/seed/sarah/100/100" />
                    <AvatarFallback>SS</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold">{course.instructor}</span>
                    <span className="text-xs text-muted-foreground">{course.instructorTitle}</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground italic line-clamp-3">
                  "{course.instructorBio}"
                </p>
              </div>
            </CardContent>
            <div className="bg-muted/20 flex flex-col gap-2 border-t p-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground w-full">
                <GraduationCap className="h-4 w-4" /> Includes Certificate of Completion
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Avatar({ children, className }: { children: React.ReactNode, className?: string }) {
  return <div className={`relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full ${className}`}>{children}</div>;
}
function AvatarImage({ src }: { src: string }) {
  return <Image src={src} alt="avatar" fill className="aspect-square h-full w-full object-cover" />;
}
function AvatarFallback({ children }: { children: React.ReactNode }) {
  return <div className="flex h-full w-full items-center justify-center rounded-full bg-muted text-xs">{children}</div>;
}
