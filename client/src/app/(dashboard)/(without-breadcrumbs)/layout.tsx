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
        <div className="relative z-0 flex min-h-screen">
          <div className="flex flex-1 flex-col h-screen overflow-y-auto transition-all duration-300 ease-in-out">
            <Header />

            {/* MAIN */}
            <main className="flex-1 ">{children}</main>
          </div>
        </div>
      </EmotionCacheProvider>
    </AuthGuard>
  );
}
