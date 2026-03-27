import dayjs from "dayjs";
import { cookies } from "next/headers";

import { fetchData } from "@/actions/fetchData.action";
import { EmotionCacheProvider } from "@/theme/emotionCache";
import { MonthlySummaryTableColumn } from "../../programacao/resumo-mensal/page";
import { MonthlyForecastSummaryTable } from "@/components/scheduleComponents/monthlyForecastSummary/monthlyForecastSummaryTable";
import { SnapshotSelect } from "@/components/forecast/forecastSelect";

export const dynamic = "force-dynamic";

type Snapshot = {
  id: number;
  nomeArquivo: string;
  geradoEm?: string;
};

export default async function ForecastReportPage({
  searchParams,
}: {
  searchParams: Promise<{ snapshotId?: string }>;
}) {
  const params = await searchParams;

  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  // 🔹 1. Buscar lista de snapshots
  const initialResponse = await fetchData(
    `${process.env.NEXT_PUBLIC_API_URL}/forecast/snapshot`,
    {},
    token,
    { cache: "no-store" },
  );

  const snapshots: Snapshot[] = initialResponse.data ?? [];

  // 🔹 2. Ordenar (mais recente primeiro)
  const snapshotsSorted = [...snapshots].sort((a, b) => b.id - a.id);

  const latestId = snapshotsSorted.length ? snapshotsSorted[0].id : null;

  const selectedId = params.snapshotId ? Number(params.snapshotId) : latestId;

  // 🔹 Empty state
  if (!latestId) {
    return (
      <EmotionCacheProvider>
        <div className="w-full h-[60vh] flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">
              Nenhum relatório encontrado
            </h2>
            <p className="text-gray-500">
              Ainda não existem snapshots gerados para exibição.
            </p>
          </div>
        </div>
      </EmotionCacheProvider>
    );
  }

  // 🔹 4. Buscar snapshot selecionado
  const summaryData = await fetchData(
    `${process.env.NEXT_PUBLIC_API_URL}/forecast/snapshot/${selectedId}`,
    {},
    token,
    { cache: "no-store" },
  );

  const columnsFirstSummary: MonthlySummaryTableColumn[] = [
    { key: "dataProg", label: "Data", format: "date" },
    { key: "dia_semana", label: "Dia da Semana", format: "weekday" },
    { key: "qtdeWorks", label: "Qtd. Obras", format: "number" },
    { key: "teams", label: "Qtd. Equipes", format: "number" },
    {
      label: "Meta (Meta 100%)",
      children: [
        { key: "financialGoal", label: "Valor", format: "currency" },
        { key: "diaryGoal", label: "% Dia", format: "percent" },
      ],
    },
    {
      label: "Planejado (R$)",
      children: [
        { key: "serviceMoPlan", label: "Serviço", format: "currency" },
        { key: "materialMoPlan", label: "Material", format: "currency" },
      ],
    },
    {
      label: "Programado (R$)",
      children: [
        { key: "serviceMoProg", label: "Serviço", format: "currency" },
        { key: "materialMoProg", label: "Material", format: "currency" },
      ],
    },
    {
      label: "Pendente SAP (R$)",
      children: [
        { key: "serviceMoPend", label: "Serviço", format: "currency" },
        { key: "materialMoPend", label: "Material", format: "currency" },
      ],
    },
    {
      label: "Forecast (R$)",
      children: [
        { key: "serviceMoForecast", label: "Serviço", format: "currency" },
        { key: "materialMoForecast", label: "Material", format: "currency" },
      ],
    },
    {
      label: "Executado (R$)",
      children: [
        { key: "serviceMoExec", label: "Serviço", format: "currency" },
        { key: "materialMoExec", label: "Material", format: "currency" },
      ],
    },
    { key: "diff", label: "Prog x Exec (%)", format: "percent" },
  ];

  const columnsSecondSummary: MonthlySummaryTableColumn[] = [
    { key: "grupo", label: "Grupo" },
    { key: "turma", label: "Parceira" },
    { key: "qtdeWorks", label: "Qtd. Obras", format: "number" },
    {
      label: "Planejado (R$)",
      children: [
        { key: "totalServiceMoPlan", label: "Serviço", format: "currency" },
        { key: "totalMaterialMoPlan", label: "Material", format: "currency" },
      ],
    },
    {
      label: "Programado (R$)",
      children: [
        { key: "totalServiceMoProg", label: "Serviço", format: "currency" },
        { key: "totalMaterialMoProg", label: "Material", format: "currency" },
      ],
    },
    {
      label: "Pendente SAP (R$)",
      children: [
        { key: "totalServiceMoPend", label: "Serviço", format: "currency" },
        { key: "totalMaterialMoPend", label: "Material", format: "currency" },
      ],
    },
    {
      label: "Executado (R$)",
      children: [
        { key: "totalServiceMoExec", label: "Serviço", format: "currency" },
        { key: "totalMaterialMoExec", label: "Material", format: "currency" },
      ],
    },
    { key: "diff", label: "Prog x Exec (%)", format: "percent" },
  ];

  return (
    <EmotionCacheProvider>
      <div className="w-full flex flex-col px-4 overflow-y-auto">
        {/* 🔹 Select */}
        <SnapshotSelect snapshots={snapshotsSorted} selectedId={selectedId} />

        {/* 🔹 Tabelas */}
        <div className="w-full flex flex-col xl:flex-row gap-4 h-[85%]">
          <MonthlyForecastSummaryTable
            columns={columnsFirstSummary}
            data={summaryData.data.diario.summary}
            totals={summaryData.data.diario.totals}
            isFirstSummary={true}
          />

          <MonthlyForecastSummaryTable
            columns={columnsSecondSummary}
            data={summaryData.data.grupo.summary}
            totals={summaryData.data.grupo.totals}
            isFirstSummary={false}
          />
        </div>
      </div>
    </EmotionCacheProvider>
  );
}
