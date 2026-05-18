import { BreadcrumpsComponent } from "@/components/common/Breadcrumbs";
import { Header } from "@/components/layout/Header";
import { AuthGuard } from "@/guard/authGuard";
import { EmotionCacheProvider } from "@/theme/emotionCache";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <EmotionCacheProvider>
        {/* CONTAINER RAIZ */}
        <div className="flex h-screen w-full overflow-hidden">
          <div className="flex flex-1 flex-col overflow-hidden">
            {/* HEADER */}
            <Header />

            {/* MAIN */}
            <main className="flex-1 overflow-auto">
              <div className="flex flex-col items-center min-h-full">
                {/* BREADCRUMBS */}
                <div className="py-2 w-4/5 shrink-0 flex justify-center">
                  <BreadcrumpsComponent />
                </div>

                <span className="border-b border-solid border-zinc-300 w-full shrink-0" />

                {/* CONTEÚDO DINÂMICO */}
                {children}
              </div>
            </main>
          </div>
        </div>
      </EmotionCacheProvider>
    </AuthGuard>
  );
}
