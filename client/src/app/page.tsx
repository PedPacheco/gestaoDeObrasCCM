import { cookies } from "next/headers";
import { Suspense } from "react";

import { fetchData } from "@/actions/fetchData.action";
import { fetchFilters } from "@/actions/fetchFilters.action";
import { LoadingComponent } from "@/components/common/Loading";
import MainHome from "@/components/home/MainHome";
import { Header } from "@/components/layout/Header";
import { Transform } from "@/utils/transform";

export default async function Home() {
  const cookieStore = await cookies();
  const cookieParams = cookieStore.get("goalsFilters")?.value;
  const token = cookieStore.get("token")?.value;

  let params = cookieParams ? JSON.parse(cookieParams) : undefined;

  if (params) {
    params = Transform(params);
  } else {
    params = { ano: "2025" };
  }

  const [filters, homeData] = await Promise.all([
    fetchFilters({
      regional: true,
      parceira: true,
      tipo: true,
    }),

    fetchData(`${process.env.NEXT_PUBLIC_API_URL}/metas`, params, token),
  ]);

  const { data } = homeData;

  const columnMapping = {
    regional: "Regional",
    tipo_obra: "Tipo de obra",
    turma: "Contratada",
    anocalc: "Ano",
    teste: "Teste",
    jan: "Jan",
    fev: "Fev",
    mar: "Mar",
    abr: "Abr",
    mai: "Mai",
    jun: "Jun",
    jul: "Jul",
    ago: "Ago",
    set: "Set",
    out: "Out",
    nov: "Nov",
    dez: "Dez",
    total: "Total",
    carteira: "Carteira",
  };

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
              <Suspense fallback={<LoadingComponent color="text-black" />}>
                <MainHome
                  filtersData={filters}
                  data={data}
                  token={token}
                  columns={columnMapping}
                />
              </Suspense>
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
