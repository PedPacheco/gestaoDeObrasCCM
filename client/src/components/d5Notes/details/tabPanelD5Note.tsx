"use client";

import { Suspense, useState } from "react";

import { ButtonComponent } from "@/components/common/Button";
import { Tab, Tabs } from "@mui/material";

import SchedulesD5NotePanelItem from "./schedulesD5NotePanelItem";

export type schedulesDataType = {
  id: number;
  criado_em: Date;
  data_prog: Date;
  hora_ini: Date;
  hora_ter: Date;
  prog: number;
  exec: number;
  equipe_lm: number;
  equipe_lv: number;
  equipe_reg: number;
  chave_provisoria: boolean;
  chi: number;
  num_dp: string | null;
  tipo_servico: string | null;
  observacao_execucao: string | null;
  observacao_programacao: string | null;
  usuarioCriador: string | null;
  usuarioModificador: string | null;
  restricao: string;
  tecnico: string;
  responsavel_restricao: string | null;
};

interface D5NotesTabPanelProps {
  schedulesData: schedulesDataType[];
}

export function D5NotesTabPanel({ schedulesData }: D5NotesTabPanelProps) {
  const [value, setValue] = useState<number>(0);

  const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
    if (![0, 1].includes(newValue)) {
      return;
    }

    setValue(newValue);
    localStorage.setItem("tab", newValue.toString());
  };

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      {/* Tabs */}
      <div className="shrink-0 border-b border-solid border-zinc-300">
        <div className="flex min-w-0 items-center justify-between">
          <Tabs
            value={value}
            onChange={handleChange}
            aria-label="Tabs da nota D5"
            variant="scrollable"
            scrollButtons="auto"
            className="min-w-0 flex-1"
          >
            <Tab
              value={0}
              label="Programações"
              className="text-sm xl:text-lg"
            />

            <Tab
              value={1}
              label="Relatórios Execução"
              className="text-sm xl:text-lg"
            />
          </Tabs>

          {value === 0 && (
            <div className="shrink-0 px-2 md:px-4">
              <ButtonComponent
                onClick={() => console.log("abrir modal para nova programação")}
                text="Nova programação"
              />
            </div>
          )}
        </div>
      </div>

      {/* Conteúdo */}
      <div className="relative min-h-0 min-w-0 flex-1 overflow-hidden">
        <Suspense fallback={<p>Carregando informações...</p>}>
          <div
            role="tabpanel"
            hidden={value !== 0}
            id="simple-tabpanel-0"
            aria-labelledby="simple-tab-0"
            className="absolute inset-0 min-h-0 min-w-0 overflow-auto"
          >
            <SchedulesD5NotePanelItem data={schedulesData} />
          </div>

          <div
            role="tabpanel"
            hidden={value !== 1}
            id="simple-tabpanel-1"
            aria-labelledby="simple-tab-1"
            className="absolute inset-0 min-h-0 min-w-0 overflow-auto"
          >
            <div className="p-4">Relatório de execução</div>
          </div>
        </Suspense>
      </div>
    </div>
  );
}
