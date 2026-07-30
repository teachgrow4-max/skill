"use client";

import { cn } from "@skilltego/utils";
import { useSidebar } from "@/providers/sidebar-provider";

export function SidebarAwareMain({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebar();
  return (
    <div
      className={cn(
        "flex min-h-screen flex-col transition-[padding] duration-300 md:pl-[72px]",
        !collapsed && "xl:pl-[260px]",
      )}
    >
      {children}
    </div>
  );
}
