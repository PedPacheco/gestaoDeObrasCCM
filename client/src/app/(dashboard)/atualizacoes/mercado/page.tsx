import { cookies } from "next/headers";

import { fetchData } from "@/actions/fetchData.action";
import { fetchFilters } from "@/actions/fetchFilters.action";
import { TableMarketWorks } from "@/components/entryComponents/importMarketWorks/tableWorksMarket";
import { ImportButtonUpdates } from "@/components/updatesComponents/importButtonUpdates";
import { UpdateButton } from "@/components/updatesComponents/updateButton";
import { EmotionCacheProvider } from "@/theme/emotionCache";
import { Box, Paper } from "@mui/material";

export const dynamic = "force-dynamic";

export default async function MarketUpdates() {
  const cookieStore = await cookies();

  const updatedTableData = cookieStore.get("marketUpdatesData")?.value;

  let data;

  if (updatedTableData) {
    data = { data: [] };
  } else {
    data = await fetchData(
      `${process.env.NEXT_PUBLIC_API_URL}/base-auxiliar/mercado`,
      undefined,
      cookieStore.get("token")?.value,
      { cache: "no-store" }
    );
  }

  const filters = await fetchFilters({
    parceira: true,
    tipo: true,
    municipio: true,
    circuito: true,
  });

  const columnMapping = {
    id: "ID",
    obra: "Obra",
    pep: "Pep",
    diagrama: "Diagrama",
    entrada: "Entrada",
    prazo: "Prazo",
    prazoTotal: "Data Prazo",
    municipio: "Mun",
    tipo: "Tipo obra",
    moEmpresa: "MO Empresa",
    moCliente: "MO Cliente",
    moPlanejada: "MO plan",
    circuito: "Circuito",
    referencia: "Referência",
  };

  const displayValue = {
    tipo: "tipo_obra",
    municipio: "municipio",
    circuito: "circuito",
  };

  return (
    <EmotionCacheProvider>
      <div className="my-6 w-full h-full flex flex-col">
        <div className="flex flex-col h-full lg:justify-between lg:items-center">
          <Paper className="p-6 mb-8 justify-start">
            <Box className="flex gap-4 flex-wrap">
              <ImportButtonUpdates storageKey="marketUpdatesData" />

              <UpdateButton storageKey="marketUpdatesData" />
            </Box>
          </Paper>

          <TableMarketWorks
            data={data.data}
            columns={columnMapping}
            selectOptionsByColumn={filters}
            displayValues={displayValue}
            storageKey="marketUpdatesData"
          />
        </div>
      </div>
    </EmotionCacheProvider>
  );
}
