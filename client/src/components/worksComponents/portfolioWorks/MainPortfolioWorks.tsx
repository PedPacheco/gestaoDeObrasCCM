"use client";

import { fetchData } from "@/services/fetchData";
import { useState } from "react";
import PortfolioWorksFilters from "./PortfolioWorksFilters";
import ModalComponent from "@/components/common/Modal";
import { TableComponent } from "@/components/common/Table";

interface MainPortfolioWorksProps {
  data: any;
  filters: any;
  token: string;
  columns: Record<string, string>;
  url: string;
  totalValues: number;
}

export default function PortfolioWorks({
  data,
  filters,
  token,
  columns,
  url,
  totalValues,
}: MainPortfolioWorksProps) {
  const [dataFiltered, setDataFiltered] = useState(data);
  const [open, setOpen] = useState(false);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  async function fetchWorks(params: Record<string, string>) {
    const response = await fetchData(
      `${process.env.NEXT_PUBLIC_API_URL}/obras/${url}`,
      params,
      token,
      { cache: "no-store" }
    );

    setDataFiltered(response.data);
  }

  return (
    <>
      <div className="my-6 w-11/12 flex flex-col items-center">
        <PortfolioWorksFilters
          data={filters}
          onApplyFilters={fetchWorks}
          openModal={handleOpen}
        />
      </div>

      <TableComponent
        data={dataFiltered.data}
        columns={columns}
        sliceEndIndex={6}
      />

      <ModalComponent open={open} onClose={handleClose} title="Valores totais">
        <div className="flex flex-col items-center justify-center xl:flex-row w-full">
          {Object.entries(columns)
            .slice(totalValues)
            .map(([column, value]) => {
              const item = dataFiltered.data[1];

              return (
                <div
                  key={column}
                  className="flex flex-row py-2 xl:py-0 xl:mx-2"
                >
                  <span className="p-1 bg-[#212E3E] text-zinc-200 flex items-center">
                    <p>{value}</p>
                  </span>
                  <div className="p-2 border border-solid flex justify-center items-center">
                    <p>{item[column]?.toFixed(0)}</p>
                  </div>
                </div>
              );
            })}
        </div>
      </ModalComponent>
    </>
  );
}
