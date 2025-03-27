import { cookies } from "next/headers";
import { Suspense } from "react";

import { fetchData } from "@/actions/fetchData.action";
import { fetchFilters } from "@/actions/fetchFilters.action";
import { LoadingComponent } from "@/components/common/Loading";
import MainHome from "@/components/goalsComponents/MainGoals";
import { Header } from "@/components/layout/Header";
import { Transform } from "@/utils/transform";

export default async function Home() {
  return (
    <>
      <div className="relative z-0 flex min-h-screen">
        <div className="relative flex max-w-full min-h-screen flex-1 flex-col">
          <Header />
          <main className="flex-1 overflow-y-auto ">
            <div className="flex flex-col items-center">
              <h1 className="text-4xl font-bold text-zinc-800 p-2">
                EDP São Paulo - Gestão de obras CCM
              </h1>
              <h2 className="text-2xl font-semibold text-zinc-700">
                Metas EDP
              </h2>
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
