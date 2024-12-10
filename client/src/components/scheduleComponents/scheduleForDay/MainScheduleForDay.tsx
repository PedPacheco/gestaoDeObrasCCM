"use client";

import nookies from "nookies";
import { useCallback, useEffect, useState } from "react";

import ModalComponent from "@/components/common/Modal";
import { TableComponent } from "@/components/common/Table";
import { MainInterface } from "@/interfaces/mainInterface";
import { fetchData } from "@/services/fetchData";

import ScheduleForDayFilters from "./ScheduleForDayFilters";
import { mountUrl } from "@/utils/mountUrl";

export default function MainSchduleForDay({
  columns,
  data,
  filters,
  token,
}: MainInterface<any>) {
  const [dataFiltered, setDataFiltered] = useState(data);
  const [open, setOpen] = useState(false);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const fetchSchedule = useCallback(
    async (params: Record<string, string | boolean>) => {
      const response = await fetchData(
        `${process.env.NEXT_PUBLIC_API_URL}/programacao/mensal`,
        params,
        token
      );

      setDataFiltered(response.data);
    },
    [token]
  );

  const generateExcel = useCallback(
    async (params: Record<string, string | boolean>) => {
      const url = mountUrl(
        `${process.env.NEXT_PUBLIC_API_URL}/exportacao/programacao`,
        params
      );

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        console.error("Erro ao gerar a planilha:", response.statusText);
        return;
      }

      const blob = await response.blob();

      const downloadUrl = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = "Exportação Programação.xlsx";
      document.body.appendChild(link);
      link.click();

      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    },
    [token]
  );

  useEffect(() => {
    const cookies = nookies.get();
    const params = cookies["scheduleForDayFilters"];

    if (params) {
      fetchSchedule(JSON.parse(params));
    }
  }, [fetchSchedule]);

  return (
    <>
      <div className="my-6 w-11/12 flex flex-col">
        <ScheduleForDayFilters
          data={filters}
          onApplyFilters={fetchSchedule}
          openModal={handleOpen}
          generateExcel={generateExcel}
        />
      </div>

      <TableComponent data={dataFiltered.data} columns={columns} />

      <ModalComponent open={open} onClose={handleClose} title="Valores totais">
        <div className="flex flex-col items-center justify-center xl:flex-row w-full">
          {Object.entries(columns)
            .slice(24)
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
                    <p>
                      {item
                        ? Number(item[column].toFixed(0)).toLocaleString(
                            "pt-br"
                          )
                        : 0}
                    </p>
                  </div>
                </div>
              );
            })}
        </div>
      </ModalComponent>
    </>
  );
}
