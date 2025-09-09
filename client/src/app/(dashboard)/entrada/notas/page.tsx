import { cookies } from "next/headers";

import { fetchData } from "@/actions/fetchData.action";
import { fetchFilters } from "@/actions/fetchFilters.action";
import { DeleteButton } from "@/components/entryComponents/importMarketWorks/deleteButton";
import { ImportButton } from "@/components/entryComponents/importMarketWorks/importButton";
import { InsertMarketWorksButton } from "@/components/entryComponents/importMarketWorks/insertButton";
import { TableMarketWorks } from "@/components/entryComponents/importMarketWorks/tableWorksMarket";
import { Box, Paper } from "@mui/material";
import { EmotionCacheProvider } from "@/theme/emotionCache";

export const dynamic = "force-dynamic";

export default async function NotesEntry() {
  const cookieStore = await cookies();

  const updatedTableData = cookieStore.get("notesEntryData")?.value;

  let data;

  if (updatedTableData) {
    data = { data: [] };
  } else {
    data = await fetchData(
      `${process.env.NEXT_PUBLIC_API_URL}/base-auxiliar/notas`,
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
    empreendimento: true,
  });

  const columnMapping = {
    obra: "Nota",
    pep: "Pep",
    dci: "Dci",
    dcd: "Dcd",
    dca: "Dca",
    dcim: "Dcim",
    entrada: "Entrada",
    prazo: "Prazo",
    municipio: "Mun",
    tipo: "Tipo obra",
    empreendimento: "Empreendimento",
    mo_plan: "MO plan",
    qtde_plan: "Qtde Plan",
    parceira: "Parceira",
    circuito: "Circuito",
    referencia: "Referência",
  };

  const displayValue = {
    parceira: "turma",
    tipo: "tipo_obra",
    municipio: "municipio",
    circuito: "circuito",
    empreendimento: "empreendimento",
  };

  return (
    <EmotionCacheProvider>
      <div className="my-6 w-full h-full flex flex-col">
        <div className="flex flex-col h-full lg:justify-between lg:items-center">
          <Paper className="p-6 mb-8 justify-start">
            <Box className="flex gap-4 flex-wrap">
              <ImportButton storageKey="notesEntryData" />
              <DeleteButton storageKey="notesEntryData" />
              <InsertMarketWorksButton storageKey="notesEntryData" />
            </Box>
          </Paper>

          <TableMarketWorks
            data={data.data}
            columns={columnMapping}
            selectOptionsByColumn={filters}
            displayValues={displayValue}
            storageKey="notesEntryData"
          />
        </div>
      </div>
    </EmotionCacheProvider>
  );
}
