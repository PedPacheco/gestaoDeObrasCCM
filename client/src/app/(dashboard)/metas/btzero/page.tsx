import { cookies } from "next/headers";

import { fetchData } from "@/actions/fetchData.action";
import { fetchFilters } from "@/actions/fetchFilters.action";
import { Transform } from "@/utils/transform";
import MainGoals from "@/components/goalsComponents/MainGoals";

export default async function Bt0Goals() {
  const cookieStore = await cookies();
  const cookieParams = cookieStore.get("bt0GoalsFilters")?.value;
  const token = cookieStore.get("token")?.value;

  let params = cookieParams ? JSON.parse(cookieParams) : undefined;

  if (params) {
    params = Transform(params);
  } else {
    params = { ano: "2025", btzero: true };
  }

  const [filters, bt0GoalsData] = await Promise.all([
    fetchFilters({
      regional: true,
      parceira: true,
      tipo: true,
    }),

    fetchData(`${process.env.NEXT_PUBLIC_API_URL}/metas`, params, token),
  ]);

  const { data } = bt0GoalsData;

  const columns = {
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
    <MainGoals
      columns={columns}
      data={data}
      filtersData={filters}
      token={token}
      typeGoals="bt0"
    />
  );
}
