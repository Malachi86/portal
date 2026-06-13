import { PlaceHolderImages } from '@/lib/placeholder-images';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, Clock, Users, BookOpen } from 'lucide-react';

export default function CoursesPage() {
  const courses = [
    {
      id: 1,
      title: 'Introduction to React.js',
      description: 'Master the fundamentals of React, hooks, and modern component architecture.',
      instructor: 'Dr. Sarah Smith',
      rating: 4.8,
      students: 1205,
      duration: '12h 30m',
      level: 'Beginner',
      imageId: 'course-coding'
    },
    {
      id: 2,
      title: 'Modern Graphic Design',
      description: 'Learn visual hierarchy, color theory, and layout design with industry-standard tools.',
      instructor: 'Marc Johnson',
      rating: 4.9,
      students: 856,
      duration: '8h 15m',
      level: 'Intermediate',
      imageId: 'course-design'
    },
    {
      id: 3,
      title: 'Advanced Mathematics for Engineers',
      description: 'Complex variables, differential equations, and linear algebra applications.',
      instructor: 'Prof. Alex Turner',
      rating: 4.5,
      students: 420,
      duration: '24h 45m',
      level: 'Advanced',
      imageId: 'course-math'
    },
    {
      id: 4,
      title: 'Digital Marketing Essentials',
      description: 'A comprehensive guide to SEO, SEM, and social media strategy for business growth.',
      instructor: 'Lisa Wong',
      rating: 4.7,
      students: 2300,
      duration: '10h 0m',
      level: 'Beginner',
      imageId: 'hero-learning'
    }
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-2">
          <h2 className="text-3xl font-bold tracking-tight text-primary">Course Catalog</h2>
          <p className="text-muted-foreground">Expand your knowledge with our wide range of professional courses.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">Filter</Button>
          <Button variant="outline" size="sm">Sort</Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {courses.map((course) => {
          const img = PlaceHolderImages.find(p => p.id === course.imageId);
          return (
            <Card key={course.id} className="flex flex-col overflow-hidden border-none shadow-sm hover:shadow-lg transition-all group">
              <div className="relative aspect-video overflow-hidden">
                <Image
                  src={img?.imageUrl || ""}
                  alt={course.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <Badge className="absolute top-2 right-2 bg-white/90 text-primary border-none shadow-sm">
                  {course.level}
                </Badge>
              </div>
              <CardHeader className="p-5 pb-0">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <span className="font-medium text-accent uppercase tracking-wider">{course.instructor}</span>
                </div>
                <CardTitle className="text-xl line-clamp-1">{course.title}</CardTitle>
                <CardDescription className="line-clamp-2 mt-2">{course.description}</CardDescription>
              </CardHeader>
              <CardContent className="p-5 flex-1 space-y-4">
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" /> {course.rating}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {course.duration}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" /> {course.students} students
                  </span>
                </div>
              </CardContent>
              <CardFooter className="p-5 pt-0">
                <Link href={`/courses/${course.id}`} className="w-full">
                  <Button className="w-full bg-primary hover:bg-primary/90">View Course</Button>
                </Link>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
