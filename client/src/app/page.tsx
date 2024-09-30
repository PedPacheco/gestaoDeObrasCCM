import MainHome from "@/components/home/MainHome";
import { Header } from "@/components/layout/Header";
import { fetchData } from "@/services/fetchData";
import { fetchFilters } from "@/services/fetchFilters";
import { cookies } from "next/headers";

export default async function Home() {
  const filters = await fetchFilters({
    regional: true,
    parceira: true,
    tipo: true,
  });

  const cookieStore = cookies();

  const { data, token } = await fetchData(
    `${process.env.NEXT_PUBLIC_API_URL}http://localhost:3333/metas`,
    undefined,
    cookieStore.get("token")?.value
  );

  return (
    <>
      <div className="relative z-0 flex h-full w-full overflow-hidden">
        <div className="relative flex max-w-full flex-1 flex-col overflow-hidden">
          <div className="h-full">
            <Header />
            <main className="w-full h-full overflow-y-auto lg:overflow-y-hidden mt-16">
              <div className="flex flex-col items-center h-full">
                <h1 className="text-4xl font-bold text-zinc-800 p-2">
                  EDP São Paulo - Gestão de obras CCM
                </h1>
                <h2 className="text-2xl font-semibold text-zinc-700">
                  Metas EDP
                </h2>
                <MainHome filters={filters} goals={data} token={token} />
              </div>
            </main>
          </div>
        </div>
      </div>
    </>
  );
}
