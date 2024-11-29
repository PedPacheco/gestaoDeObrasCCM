import { Suspense } from "react";
import { Header } from "@/components/layout/Header";
import BreadcrumpsComponent from "@/components/common/Breadcrumbs";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative z-0 flex h-screen w-full overflow-hidden">
      <div className="relative flex h-full max-w-full flex-1 flex-col overflow-hidden">
        <div className="h-full flex flex-col">
          <Header />

          <main className="w-full flex-1 mt-16 overflow-y-auto">
            <div className="flex flex-col items-center">
              <div className="py-2 w-4/5">
                <BreadcrumpsComponent />
              </div>

              <span className="border-b border-solid border-zinc-300 w-full"></span>

              <Suspense fallback={<p>Carregando conteúdo...</p>}>
                {children}
              </Suspense>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
