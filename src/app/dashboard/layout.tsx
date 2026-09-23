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
  LogOut,
  Sparkles,
  History,
  ShieldCheck,
  Bell,
  HelpCircle
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
  SidebarInset
} from '@/components/ui/sidebar';
import { Toaster } from '@/components/ui/toaster';
import { useUser, useFirestore, useDoc } from '@/firebase';
import { doc } from 'firebase/firestore';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useUser();
  const firestore = useFirestore();
  const { data: userData } = useDoc(user && firestore ? doc(firestore, 'users', user.uid) : null);

  const menuItems = [
    { title: 'Term management', icon: GraduationCap, href: '/admin/terms' },
    { title: 'Manage users', icon: Users, href: '/admin/users' },
    { title: 'Campus Registry', icon: ShieldCheck, href: '/admin/registry' },
    { title: 'All requests', icon: History, href: '/admin' },
    { title: 'Attendance reports', icon: BookOpen, href: '/admin/reports' },
    { title: 'Audit log', icon: History, href: '/admin/logs' },
    { title: 'System settings', icon: Settings, href: '/admin/settings' },
  ];

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-background overflow-hidden">
        <Sidebar className="border-none sidebar-gradient text-white">
          <SidebarHeader className="h-24 flex flex-col justify-center px-8">
            <Link href="/" className="flex items-center gap-3">
              <div className="bg-white/10 p-2 rounded-xl border border-white/20">
                <GraduationCap className="h-6 w-6 text-accent" />
              </div>
              <div className="flex flex-col">
                <span className="font-black text-lg tracking-tighter leading-none">AMA</span>
                <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Student Portal</span>
              </div>
            </Link>
          </SidebarHeader>

          <SidebarContent className="px-4 py-8">
            <div className="flex flex-col items-center gap-4 mb-12">
              <div className="relative p-1 rounded-3xl border-2 border-accent">
                <Avatar className="h-24 w-24 rounded-[1.5rem] bg-accent flex items-center justify-center">
                  <span className="text-4xl font-black text-white">{userData?.fullName?.[0] || 'S'}</span>
                </Avatar>
              </div>
              <div className="text-center">
                <h3 className="font-black text-accent tracking-tighter text-lg uppercase">{userData?.fullName || 'SYSTEM ADMINISTRATOR'}</h3>
                <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">{userData?.role || 'ADMIN'}</p>
              </div>
            </div>

            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu className="gap-2">
                  {menuItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton 
                        asChild 
                        isActive={pathname === item.href}
                        className={`h-14 rounded-2xl px-6 transition-all duration-300 ${
                          pathname === item.href 
                            ? 'bg-white/10 text-accent font-black shadow-lg' 
                            : 'text-white/50 hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        <Link href={item.href} className="flex items-center gap-4">
                          <item.icon className={`h-5 w-5 ${pathname === item.href ? 'text-accent' : ''}`} />
                          <span className="text-sm font-bold uppercase tracking-wide">{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="p-8">
            <div className="flex items-center justify-center">
              <div className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                <span className="text-xs font-black text-white/20">N</span>
              </div>
            </div>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset className="flex flex-col h-full overflow-auto bg-background">
          <header className="h-24 flex items-center justify-between px-10 header-ama sticky top-0 z-40 text-white shadow-2xl">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                 <div className="h-12 w-12 bg-white/20 rounded-2xl flex items-center justify-center border border-white/30">
                    <GraduationCap className="h-7 w-7" />
                 </div>
                 <div className="flex flex-col">
                    <span className="font-black text-2xl tracking-tighter leading-none italic">AMA</span>
                    <span className="text-[10px] font-bold text-white/70 uppercase tracking-widest">Student Portal</span>
                 </div>
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              <Button variant="ghost" size="icon" className="h-12 w-12 rounded-2xl hover:bg-white/10 text-white/80">
                <Bell className="h-6 w-6" />
              </Button>
              <Button className="h-12 px-6 rounded-2xl bg-accent hover:bg-accent/90 text-white font-black gap-2 shadow-lg">
                <HelpCircle className="h-5 w-5" /> TUTORIAL
              </Button>
              <Button variant="ghost" size="icon" className="h-12 w-12 rounded-2xl hover:bg-white/10 text-white/80">
                <LogOut className="h-6 w-6" />
              </Button>
            </div>
          </header>

          <main className="flex-1 p-10 max-w-[1600px] mx-auto w-full">
            {children}
          </main>
          <Toaster />
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
