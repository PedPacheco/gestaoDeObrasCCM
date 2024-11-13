import MainHome from "@/components/home/MainHome";
import { Header } from "@/components/layout/Header";
import { fetchData } from "@/services/fetchData";
import { fetchFilters } from "@/services/fetchFilters";
import { cookies } from "next/headers";
import { Suspense } from "react";

export default async function Home() {
  const filters = await fetchFilters({
    regional: true,
    parceira: true,
    tipo: true,
  });

  const cookieStore = cookies();

  const { data, token } = await fetchData(
    `${process.env.NEXT_PUBLIC_API_URL}/metas`,
    undefined,
    cookieStore.get("token")?.value
  );

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
                <Suspense fallback={<p>Carregando conteúdo...</p>}>
                  <MainHome
                    filters={filters}
                    data={data}
                    token={token}
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
