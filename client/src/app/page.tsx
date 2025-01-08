import { fetchData } from "@/actions/fetchData.action";
import { fetchFilters } from "@/actions/fetchFilters.action";
import MainHome from "@/components/home/MainHome";
import { Header } from "@/components/layout/Header";
import { Transform } from "@/utils/transform";
import { cookies } from "next/headers";
import { Suspense } from "react";
import { LoadingComponent } from "@/components/common/Loading";

export default async function Home() {
  const cookieStore = await cookies();
  const cookieParams = cookieStore.get("goalsFilters")?.value;

  let params = cookieParams ? JSON.parse(cookieParams) : undefined;

  if (params) {
    params = Transform(params);
  }

  const [filters, homeData] = await Promise.all([
    fetchFilters({
      regional: true,
      parceira: true,
      tipo: true,
    }),

    fetchData(
      `${process.env.NEXT_PUBLIC_API_URL}/metas`,
      params,
      cookieStore.get("token")?.value
    ),
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
      <div className="relative z-0 flex h-full w-full overflow-hidden">
        <div className="relative flex max-w-full flex-1 flex-col overflow-hidden">
          <div className="h-full">
            <Header />
            <main className="w-full h-full lg:overflow-y-hidden mt-16">
              <div className="flex flex-col items-center overflow-y-auto h-full">
                <h1 className="text-4xl font-bold text-zinc-800 p-2">
                  EDP São Paulo - Gestão de obras CCM
                </h1>
                <h2 className="text-2xl font-semibold text-zinc-700">
                  Metas EDP
                </h2>
                <Suspense fallback={<LoadingComponent color="text-black" />}>
                  <MainHome
                    filtersData={filters}
                    data={data.data}
                    columns={columnMapping}
                  />
                </Suspense>
              </div>
            </main>
          </div>
        </div>
      </div>
    </>
  );
}
