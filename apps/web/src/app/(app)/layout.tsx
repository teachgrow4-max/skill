import { AppSidebar } from "@/components/app-sidebar";
import { AppTopBar } from "@/components/app-top-bar";
import { AppBottomNav } from "@/components/app-bottom-nav";
import { SidebarAwareMain } from "@/components/sidebar-aware-main";
import { SidebarProvider } from "@/providers/sidebar-provider";
import { DailyCheckIn } from "@/features/gamification/components/daily-check-in";
import { CreatePostFab } from "@/features/posts/components/create-post-fab";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="min-h-screen">
        <DailyCheckIn />
        <AppSidebar />
        <SidebarAwareMain>
          <AppTopBar />
          <main className="mx-auto w-full max-w-2xl flex-1 px-4 pb-20 pt-4 md:pb-6 md:pt-6">{children}</main>
        </SidebarAwareMain>
        <AppBottomNav />
        <CreatePostFab />
      </div>
    </SidebarProvider>
  );
}
