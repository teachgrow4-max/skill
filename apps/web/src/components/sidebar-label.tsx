"use client";

import { cn } from "@skilltego/utils";
import { useSidebar } from "@/providers/sidebar-provider";

export function SidebarLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  const { collapsed } = useSidebar();
  return <span className={cn("hidden truncate", !collapsed && "xl:inline", className)}>{children}</span>;
}
