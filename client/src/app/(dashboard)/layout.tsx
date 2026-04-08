"use client";

import { BreadcrumpsComponent } from "@/components/common/Breadcrumbs";
import { Header } from "@/components/layout/Header";
import { AuthGuard } from "@/guard/authGuard";
import { EmotionCacheProvider } from "@/theme/emotionCache";
import { useSidebar } from "@/contexts/sidebarContext";

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { open } = useSidebar();

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <div
        className="flex flex-1 flex-col overflow-hidden transition-all duration-300 ease-in-out"
        style={{ marginLeft: open ? "256px" : "0px" }}
      >
        <Header />
        <main className="flex-1 overflow-hidden">
          <div className="flex h-full flex-col items-center">
            <div className="py-2 w-4/5 shrink-0">
              <BreadcrumpsComponent />
            </div>
            <span className="border-b border-solid border-zinc-300 w-full shrink-0" />
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <EmotionCacheProvider>
        <DashboardContent>{children}</DashboardContent>
      </EmotionCacheProvider>
    </AuthGuard>
  );
}
