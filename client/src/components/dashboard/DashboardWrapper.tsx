"use client";

import { useSidebar } from "@/contexts/sidebarContext";

// PG Applies sidebar-aware margin so the dashboard content shifts correctly when the sidebar opens
export default function DashboardWrapper({ children }: { children: React.ReactNode }) {
  const { open } = useSidebar();

  return (
    <div
      className="flex flex-1 flex-col overflow-hidden transition-all duration-300 ease-in-out"
      style={{ marginLeft: open ? "256px" : "0px" }}
    >
      {children}
    </div>
  );
}
