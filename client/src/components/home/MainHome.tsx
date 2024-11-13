"use client";

import { useState } from "react";
import GoalsTable from "./GoalsTable";
import HomePageFilters from "./HomePageFilters";
import ModalGoals from "./GoalsModal";
import { fetchData } from "@/services/fetchData";
import { MainInterface } from "@/interfaces/mainInterface";

interface filters {
  regional: { id: string; regional: string }[];
  parceira: { id: string; turma: string }[];
  tipo: { id: string; tipo_obra: string; id_grupo: number }[];
}

export default function MainHome({
  filters,
  data,
  token,
  columns,
}: MainInterface<filters>) {
  const [filteredGoals, setFilteredGoals] = useState(data);
  const [open, setOpen] = useState(false);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  async function fetchGoals(params: Record<string, string>) {
    const response = await fetchData(
      `${process.env.NEXT_PUBLIC_API_URL}/metas`,
      params,
      token
    );
    setFilteredGoals(response.data);
  }

  return (
    <>
      <div className="mt-6 w-4/5 flex flex-col">
        <HomePageFilters
          data={filters}
          onApplyFilters={fetchGoals}
          openModal={handleOpen}
        />
      </div>

      <GoalsTable goals={filteredGoals} columnMapping={columns} />

      <ModalGoals
        columns={columns}
        goals={filteredGoals}
        handleClose={handleClose}
        open={open}
      />
    </>
  );
}
