"use client";

import { useRouter, useSearchParams } from "next/navigation";
import dayjs, { Dayjs } from "dayjs";
import { useEffect, useState } from "react";

import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Box,
  Typography,
} from "@mui/material";

import { ButtonComponent } from "../common/Button";
import { useUser } from "@/contexts/userContext";
import { DateFilter } from "../common/DateFilter";

type Snapshot = {
  id: number;
  nomeArquivo: string;
  geradoEm?: string;
  filtros?: any;
};

type Props = {
  snapshots: Snapshot[];
  selectedId: number | null;
  token?: string;
};

export function SnapshotSelect({ snapshots, selectedId, token }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { permissions } = useUser();

  const [startDate, setStartDate] = useState<Dayjs | null>(null);
  const [endDate, setEndDate] = useState<Dayjs | null>(null);

  // ✅ Sincroniza estado com URL (UX importante)
  useEffect(() => {
    const start = searchParams.get("startDate");
    const end = searchParams.get("endDate");

    if (start) setStartDate(dayjs(start));
    if (end) setEndDate(dayjs(end));
  }, [searchParams]);

  // ✅ Atualiza snapshot selecionado
  const handleChange = (event: SelectChangeEvent) => {
    const newId = event.target.value;

    const params = new URLSearchParams(searchParams.toString());

    if (newId) {
      params.set("snapshotId", newId);
    } else {
      params.delete("snapshotId");
    }

    router.push(`?${params.toString()}`);
  };

  // ✅ Aplicar filtro de datas
  const handleApplyFilter = () => {
    const params = new URLSearchParams(searchParams.toString());

    if (startDate) {
      params.set("startDate", startDate.format("YYYY-MM-DD"));
    } else {
      params.delete("startDate");
    }

    if (endDate) {
      params.set("endDate", endDate.format("YYYY-MM-DD"));
    } else {
      params.delete("endDate");
    }

    router.push(`?${params.toString()}`);
  };

  // ✅ Deletar snapshot
  const handleDelete = async () => {
    if (!selectedId) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/forecast/snapshot/${selectedId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error("Erro ao excluir snapshot");
      }

      const params = new URLSearchParams(searchParams.toString());
      params.delete("snapshotId");

      router.push(`?${params.toString()}`);
      router.refresh();
    } catch (error) {
      console.error(error);
    }
  };

  const selectedSnapshot = snapshots.find((s) => s.id === selectedId);

  return (
    <div className="w-full px-4 flex justify-between">
      <div className="flex flex-row w-full items-center">
        {/* ✅ Filtro de data */}
        <DateFilter
          endDate={endDate}
          startDate={startDate}
          setEndDate={setEndDate}
          setStartDate={setStartDate}
          size="w-48"
          spacing="my-6 ml-4"
        />

        {/* ✅ Botão de aplicar filtro */}
        <ButtonComponent
          text="Filtrar"
          styled="my-6 ml-4 w-40"
          onClick={handleApplyFilter}
        />

        {/* ✅ Select de snapshots */}
        <FormControl
          fullWidth
          size="medium"
          sx={{ maxWidth: 460, my: 2, mx: 6 }}
        >
          <InputLabel id="snapshot-select-label" className="text-xl">
            Selecione o relatório
          </InputLabel>

          <Select
            labelId="snapshot-select-label"
            value={selectedId ? String(selectedId) : ""}
            label="Selecione o relatório"
            onChange={handleChange}
            renderValue={() => {
              if (!selectedSnapshot) return "Selecione um relatório";

              return (
                <Box>
                  <Typography fontSize={16} fontWeight={500}>
                    {selectedSnapshot.nomeArquivo}
                  </Typography>
                </Box>
              );
            }}
          >
            {snapshots.map((snapshot) => (
              <MenuItem key={snapshot.id} value={snapshot.id}>
                <Box display="flex" flexDirection="column">
                  <Typography fontSize={16} fontWeight={500}>
                    {snapshot.nomeArquivo}
                  </Typography>

                  {snapshot.filtros?.dataInicial &&
                    snapshot.filtros?.dataFinal && (
                      <Typography fontSize={14} color="text.secondary">
                        Período:{" "}
                        {dayjs(snapshot.filtros.dataInicial).format(
                          "DD/MM/YYYY",
                        )}{" "}
                        -{" "}
                        {dayjs(snapshot.filtros.dataFinal).format("DD/MM/YYYY")}
                      </Typography>
                    )}

                  {snapshot.filtros?.parceira?.length > 0 && (
                    <Typography fontSize={14} color="text.secondary">
                      Parceiras: {snapshot.filtros.parceira.join(" - ")}
                    </Typography>
                  )}

                  {snapshot.filtros?.regional?.length > 0 && (
                    <Typography fontSize={14} color="text.secondary">
                      Regionais: {snapshot.filtros.regional.join(" - ")}
                    </Typography>
                  )}

                  {snapshot.filtros?.tipo?.length > 0 && (
                    <Typography fontSize={14} color="text.secondary">
                      Tipos: {snapshot.filtros.tipo.join(" - ")}
                    </Typography>
                  )}

                  {snapshot.filtros?.grupo?.length > 0 && (
                    <Typography fontSize={14} color="text.secondary">
                      Grupos: {snapshot.filtros.grupo.join(" - ")}
                    </Typography>
                  )}
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </div>

      {/* ✅ Botão deletar */}
      {permissions?.permissao === "Total" && (
        <ButtonComponent
          text="Excluir relatório"
          styled="mb-4 mt-6 w-56"
          onClick={handleDelete}
        />
      )}
    </div>
  );
}
