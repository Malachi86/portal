import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { BookOpen, CheckCircle, Clock, GraduationCap, TrendingUp, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const activeCourses = [
    { id: 1, title: 'Introduction to React.js', progress: 65, lastAccessed: '2 hours ago' },
    { id: 2, title: 'Modern Graphic Design', progress: 12, lastAccessed: 'Yesterday' },
    { id: 3, title: 'Advanced Typography', progress: 0, lastAccessed: 'Never' },
  ];

  const stats = [
    { title: 'Courses in Progress', value: '3', icon: BookOpen, color: 'text-primary' },
    { title: 'Lessons Completed', value: '18', icon: CheckCircle, color: 'text-accent' },
    { title: 'Hours Learned', value: '42.5', icon: Clock, color: 'text-blue-500' },
    { title: 'Certificates Earned', value: '1', icon: GraduationCap, color: 'text-purple-500' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold tracking-tight text-primary">Welcome back, Jane!</h2>
        <p className="text-muted-foreground">You've completed 75% of your weekly learning goal. Keep it up!</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="border-none shadow-sm bg-white hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 border-none shadow-sm bg-white">
          <CardHeader>
            <CardTitle>Continue Learning</CardTitle>
            <CardDescription>Pick up where you left off in your active courses.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {activeCourses.map((course) => (
              <div key={course.id} className="group relative flex flex-col gap-2 p-4 rounded-xl border hover:border-primary/50 hover:bg-primary/5 transition-all">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <h3 className="font-semibold">{course.title}</h3>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" /> Last active: {course.lastAccessed}
                    </p>
                  </div>
                  <Link href={`/courses/${course.id}`}>
                    <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                      Continue <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
                <div className="flex items-center gap-4">
                  <Progress value={course.progress} className="h-2" />
                  <span className="text-sm font-medium min-w-[3rem]">{course.progress}%</span>
                </div>
              </div>
            ))}
            <Link href="/courses" className="block">
              <Button variant="outline" className="w-full">View All Enrolled Courses</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="col-span-3 border-none shadow-sm bg-white">
          <CardHeader>
            <CardTitle>Upcoming Assessments</CardTitle>
            <CardDescription>Quizzes and assignments due soon.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/30">
              <div className="h-10 w-10 rounded-full bg-accent/20 flex items-center justify-center text-accent">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium">React Hooks Quiz</p>
                <p className="text-xs text-muted-foreground">Due tomorrow, 11:59 PM</p>
              </div>
              <Button size="sm">Take Quiz</Button>
            </div>
            <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/30 opacity-60">
              <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                <PenTool className="h-5 w-5" />
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium">Design Portfolio V1</p>
                <p className="text-xs text-muted-foreground">Due in 3 days</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
