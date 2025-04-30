import { Header } from "@/components/layout/Header";

export default function Home() {
  return (
    <>
      <div className="relative z-0 flex min-h-screen  bg-center bg-no-repeat bg-cover bg-[url(/edp-background.png)]">
        <div className="relative flex max-w-full min-h-screen flex-1 flex-col ">
          <Header />
        </div>
      </div>
    </>
  );
}
