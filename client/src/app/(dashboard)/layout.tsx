import { BreadcrumpsComponent } from "@/components/common/Breadcrumbs";
import { Header } from "@/components/layout/Header";
import { EmotionCacheProvider } from "@/theme/emotionCache";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <EmotionCacheProvider>
      <div className="relative z-0 flex min-h-screen w-full">
        <div className="relative flex min-h-screen max-w-full flex-1 flex-col">
          <Header />

          <main className="overflow-y-auto h-[calc(100vh-3.5rem)]">
            <div className="flex h-full flex-col items-center">
              <div className="py-2 w-4/5">
                <BreadcrumpsComponent />
              </div>

              <span className="border-b border-solid border-zinc-300 w-full"></span>

              {children}
            </div>
          </main>
        </div>
      </div>
    </EmotionCacheProvider>
  );
}
