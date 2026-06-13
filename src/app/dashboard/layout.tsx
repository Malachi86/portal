"use client"

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  BookOpen, 
  LayoutDashboard, 
  Settings, 
  GraduationCap, 
  Users, 
  PenTool, 
  Menu,
  ChevronRight,
  LogOut,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Sidebar, 
  SidebarContent, 
  SidebarFooter, 
  SidebarGroup, 
  SidebarGroupContent, 
  SidebarGroupLabel, 
  SidebarHeader, 
  SidebarMenu, 
  SidebarMenuButton, 
  SidebarMenuItem, 
  SidebarProvider,
  SidebarTrigger,
  SidebarInset
} from '@/components/ui/sidebar';
import { Toaster } from '@/components/ui/toaster';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const menuItems = [
    { title: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
    { title: 'All Courses', icon: BookOpen, href: '/courses' },
    { title: 'My Progress', icon: GraduationCap, href: '/dashboard/progress' },
  ];

  const instructorItems = [
    { title: 'My Courses', icon: PenTool, href: '/instructor/courses' },
    { title: 'Quiz Generator', icon: Sparkles, href: '/instructor/quizzes/generate' },
    { title: 'Students', icon: Users, href: '/instructor/students' },
  ];

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-background overflow-hidden">
        <Sidebar className="border-r shadow-sm">
          <SidebarHeader className="border-b h-16 flex items-center px-4 bg-white/50">
            <Link href="/" className="flex items-center gap-2">
              <GraduationCap className="h-6 w-6 text-primary" />
              <span className="font-bold text-lg text-primary tracking-tight">Siklab Academy</span>
            </Link>
          </SidebarHeader>
          <SidebarContent className="bg-white/30">
            <SidebarGroup>
              <SidebarGroupLabel>Learning</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {menuItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild isActive={pathname === item.href}>
                        <Link href={item.href} className="flex items-center gap-2">
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel>Instructor tools</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {instructorItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild isActive={pathname === item.href}>
                        <Link href={item.href} className="flex items-center gap-2">
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter className="border-t p-4 bg-white/50">
            <div className="flex items-center gap-3 mb-4">
              <Avatar className="h-9 w-9 border-2 border-primary/20">
                <AvatarImage src="https://picsum.photos/seed/user/100/100" />
                <AvatarFallback>JD</AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="text-sm font-semibold">Jane Doe</span>
                <span className="text-xs text-muted-foreground">Student</span>
              </div>
            </div>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href="/settings" className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    <span>Settings</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton className="text-destructive hover:text-destructive hover:bg-destructive/10">
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset className="flex flex-col h-full overflow-auto">
          <header className="h-16 border-b flex items-center justify-between px-6 bg-white sticky top-0 z-40">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <div className="h-4 w-[1px] bg-border hidden sm:block" />
              <h1 className="text-lg font-semibold truncate">
                {pathname === '/dashboard' ? 'Overview' : 
                 pathname.includes('/courses') ? 'Courses' :
                 pathname.includes('/instructor') ? 'Instructor Portal' : 'Siklab Academy'}
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" className="relative">
                <Sparkles className="h-5 w-5 text-accent" />
                <span className="absolute top-1 right-1 h-2 w-2 bg-accent rounded-full animate-pulse" />
              </Button>
            </div>
          </header>
          <main className="flex-1 p-6 lg:p-10 max-w-7xl mx-auto w-full">
            {children}
          </main>
          <Toaster />
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
