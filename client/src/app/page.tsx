import { Suspense } from "react";

import { LoadingComponent } from "@/components/common/Loading";
import { Header } from "@/components/layout/Header";
import Image from "next/image";

export default function Home() {
  return (
    <>
      <div className="relative z-0 flex min-h-screen">
        <div className="relative flex max-w-full min-h-screen flex-1 flex-col ">
          <Header />
          <main className="flex-1 overflow-y-auto bg-[url(/fundo.png)] bg-cover bg-center bg-no-repeat">
            <div className="flex flex-col items-center justify-center min-h-full">
              <Image
                src="/logo-sigo.png"
                alt="Logo SIGO"
                className="w-1/3 h-auto mr-5"
                width={100}
                height={150}
              />
              <Suspense
                fallback={<LoadingComponent color="text-black" />}
              ></Suspense>
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
