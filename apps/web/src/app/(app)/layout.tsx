import { AppSidebar } from "@/components/app-sidebar";
import { AppTopBar } from "@/components/app-top-bar";
import { AppBottomNav } from "@/components/app-bottom-nav";
import { DailyCheckIn } from "@/features/gamification/components/daily-check-in";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <DailyCheckIn />
      <AppSidebar />
      <div className="flex min-h-screen flex-col md:pl-20 xl:pl-64">
        <AppTopBar />
        <main className="mx-auto w-full max-w-2xl flex-1 px-4 pb-20 pt-4 md:pb-6 md:pt-6">{children}</main>
      </div>
      <AppBottomNav />
    </div>
  );
}
