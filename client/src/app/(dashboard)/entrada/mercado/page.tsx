import { cookies } from "next/headers";

import { fetchData } from "@/actions/fetchData.action";
import { fetchFilters } from "@/actions/fetchFilters.action";
import { DeleteButton } from "@/components/entryComponents/importMarketWorks/deleteButton";
import ImportButton from "@/components/entryComponents/importMarketWorks/importButton";
import { InsertMarketWorksButton } from "@/components/entryComponents/importMarketWorks/insertButton";
import { TableMarketWorks } from "@/components/entryComponents/importMarketWorks/tableWorksMarket";
import { Box, Paper } from "@mui/material";

export default async function MarketEntry() {
  const cookieStore = await cookies();

  const updatedTableData = cookieStore.get("marketEntryData")?.value;

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
    obra: "Obra",
    pep: "Pep",
    diagrama: "Diagrama",
    entrada: "Entrada",
    prazo: "Prazo",
    prazoTotal: "Data Prazo",
    municipio: "Mun",
    tipo: "Tipo obra",
    moPlanejada: "MO plan",
    circuito: "Circuito",
    parceira: "Parceira",
    referencia: "Referência",
  };

  const displayValue = {
    parceira: "turma",
    tipo: "tipo_obra",
    municipio: "municipio",
    circuito: "circuito",
  };

  return (
    <div className="my-6 w-full flex flex-col">
      <div className="flex flex-col lg:justify-between lg:items-center">
        <Paper className="p-6 mb-8 justify-start">
          <Box className="flex gap-4 flex-wrap">
            <ImportButton storageKey="marketEntryData" />
            <DeleteButton storageKey="marketEntryData" />
            <InsertMarketWorksButton storageKey="marketEntryData" />
          </Box>
        </Paper>

        <TableMarketWorks
          data={data.data}
          columns={columnMapping}
          selectOptionsByColumn={filters}
          displayValues={displayValue}
          storageKey="marketEntryData"
        />
      </div>
    </div>
  );
}
