"use client";

import { fetchData } from "@/services/fetchData";
import GeneralListOfWorksFilters from "./GeneralListOfWorksFilters";
import GeneralListOfWorksTable from "./GeneralListOfWorksTable";
import { useState } from "react";

interface GeneralListOfWorksProps {
  data: any;
  filters: any;
  token: string;
  columnMapping: Record<string, string>;
}

export default function MainGeneralListOfWorks({
  columnMapping,
  data,
  filters,
  token,
}: GeneralListOfWorksProps) {
  const [dataFiltered, setDataFiltered] = useState(data);

  async function fetchWorks(params: {
    idRegional?: string;
    idPartners?: string;
    idType?: string;
    idCity?: string;
    idGroup?: string;
    idStatus?: string;
  }) {
    const response = await fetchData(
      "http://localhost:3333/obras",
      params,
      token,
      { cache: "no-store" }
    );

    setDataFiltered(response.data);
  }

  return (
    <>
      <div className="my-6 w-4/5 flex flex-col">
        <GeneralListOfWorksFilters data={filters} onApplyFilters={fetchWorks} />
      </div>

      <GeneralListOfWorksTable
        columnMapping={columnMapping}
        works={dataFiltered}
      />
    </>
  );
}
