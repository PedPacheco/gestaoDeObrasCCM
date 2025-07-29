import { cookies } from "next/headers";

import { fetchData } from "@/actions/fetchData.action";
import { fetchFilters } from "@/actions/fetchFilters.action";
import MainGoals from "@/components/goalsComponents/MainGoals";
import { Transform } from "@/utils/transform";

export const dynamic = "force-dynamic";

export default async function RdaGoals() {
  const cookieStore = await cookies();
  const cookieParams = cookieStore.get("bt0GoalsFilters")?.value;
  const token = cookieStore.get("token")?.value;

  let params = cookieParams ? JSON.parse(cookieParams) : undefined;

  if (params) {
    params = { ...Transform(params), rda: true, btzero: false };
  } else {
    params = { ano: "2025", rda: true, btzero: false };
  }

  const [filters, rdaGoalsData] = await Promise.all([
    fetchFilters({
      regional: true,
      parceira: true,
      empreendimento: true,
    }),

    fetchData(`${process.env.NEXT_PUBLIC_API_URL}/metas`, params, token),
  ]);

  const { data } = rdaGoalsData;

  const columns = {
    regional: "Regional",
    tipo_obra: "Tipo de obra",
    turma: "Contratada",
    anocalc: "Ano",
    empreendimento: "Empreendimento",
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
    <MainGoals
      columns={columns}
      data={data}
      filtersData={filters}
      token={token}
      typeGoals="rda"
    />
  );
}
