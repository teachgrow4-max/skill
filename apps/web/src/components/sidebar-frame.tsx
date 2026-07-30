"use client";

import { ChevronLeft } from "lucide-react";
import { cn } from "@skilltego/utils";
import { useSidebar } from "@/providers/sidebar-provider";

export function SidebarFrame({ children }: { children: React.ReactNode }) {
  const { collapsed, toggle } = useSidebar();

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-30 hidden w-[72px] flex-col border-r border-border bg-background/80 backdrop-blur-xl transition-[width] duration-300 md:flex",
        !collapsed && "xl:w-[260px]",
      )}
    >
      {children}
      <button
        type="button"
        onClick={toggle}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        className="absolute -right-3 top-20 hidden size-6 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-sm transition-colors hover:text-foreground xl:flex"
      >
        <ChevronLeft className={cn("size-3.5 transition-transform duration-300", collapsed && "rotate-180")} />
      </button>
    </aside>
  );
}
