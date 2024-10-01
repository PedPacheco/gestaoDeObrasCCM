"use client";

import { useState } from "react";
import GoalsTable from "./GoalsTable";
import HomePageFilters from "./HomePageFilters";
import ModalGoals from "./GoalsModal";
import { fetchData } from "@/services/fetchData";

interface filters {
  regional: { id: string; regional: string }[];
  parceira: { id: string; turma: string }[];
  tipo: { id: string; tipo_obra: string; id_grupo: number }[];
}

interface MainHomeProps {
  filters: filters;
  goals: any;
  token: string;
}

export default function MainHome({ filters, goals, token }: MainHomeProps) {
  const [filteredGoals, setFilteredGoals] = useState(goals);
  const [open, setOpen] = useState(false);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  async function fetchGoals(params: Record<string, string>) {
    const response = await fetchData(
      "http://localhost:3333/metas",
      params,
      token
    );
    setFilteredGoals(response.data);
  }

  const columnMapping = {
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
    <>
      <div className="mt-6 w-4/5 flex flex-col">
        <HomePageFilters
          data={filters}
          onApplyFilters={fetchGoals}
          openModal={handleOpen}
        />
      </div>
      <div className="w-full h-full flex justify-center items-start ">
        <GoalsTable goals={filteredGoals} columnMapping={columnMapping} />
      </div>

      <ModalGoals
        columns={columnMapping}
        goals={filteredGoals}
        handleClose={handleClose}
        open={open}
      />
    </>
  );
}
