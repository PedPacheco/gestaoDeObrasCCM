import BreadcrumpsComponent from "@/components/common/Breadcrumbs";
import { Header } from "@/components/layout/Header";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="relative z-0 flex h-full w-full overflow-hidden">
      <div className="relative flex h-full max-w-full flex-1 flex-col overflow-hidden">
        <div className="h-full">
          <Header />
          <main className="w-full h-full overflow-y-auto lg:overflow-y-hidden mt-16">
            <div className="flex flex-col items-center h-full">
              <div className="py-2 w-4/5">
                <BreadcrumpsComponent />
              </div>

              <span className="border-b border-solid border-zinc-300 w-full"></span>
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
