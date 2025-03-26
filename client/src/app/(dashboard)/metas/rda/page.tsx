import { fetchData } from "@/actions/fetchData.action";
import { fetchFilters } from "@/actions/fetchFilters.action";
import MainRdaGoals from "@/components/goalsComponents/rdaGoals/mainRdaGoals";
import { Transform } from "@/utils/transform";
import { cookies } from "next/headers";

export default async function RdaGoals() {
  const cookieStore = await cookies();
  const cookieParams = cookieStore.get("bt0GoalsFilters")?.value;
  const token = cookieStore.get("token")?.value;

  let params = cookieParams ? JSON.parse(cookieParams) : undefined;

  if (params) {
    params = Transform(params);
  } else {
    params = { ano: "2025" };
  }

  const [filters, rdaGoalsData] = await Promise.all([
    fetchFilters({
      regional: true,
      parceira: true,
      empreendimento: true,
    }),

    fetchData(`${process.env.NEXT_PUBLIC_API_URL}/metas/rda`, params, token),
  ]);

  const { data } = rdaGoalsData;

  const columns = {
    regional: "Regional",
    tipo_obra: "Tipo de obra",
    turma: "Contratada",
    empreendimento: "Empreendimento",
    anocalc: "Ano",
    descricao: "Descrição",
    jan_meta_fisico: "Jan",
    fev_meta_fisico: "Fev",
    mar_meta_fisico: "Mar",
    abr_meta_fisico: "Abr",
    mai_meta_fisico: "Mai",
    jun_meta_fisico: "Jun",
    jul_meta_fisico: "Jul",
    ago_meta_fisico: "Ago",
    set_meta_fisico: "Set",
    out_meta_fisico: "Out",
    nov_meta_fisico: "Nov",
    dez_meta_fisico: "Dez",
    total: "Total",
    carteira: "Carteira",
  };

  return (
    <MainRdaGoals
      columns={columns}
      data={data}
      filtersData={filters}
      token={token}
    />
  );
}
