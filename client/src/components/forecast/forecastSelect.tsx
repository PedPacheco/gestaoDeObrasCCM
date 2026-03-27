"use client";

import { useRouter, useSearchParams } from "next/navigation";
import dayjs from "dayjs";

import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Box,
  Typography,
} from "@mui/material";

type Snapshot = {
  id: number;
  nomeArquivo: string;
  geradoEm?: string;
  filtros?: any;
};

type Props = {
  snapshots: Snapshot[];
  selectedId: number | null;
};

export function SnapshotSelect({ snapshots, selectedId }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

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

  // 🔹 snapshot selecionado (para renderValue)
  const selectedSnapshot = snapshots.find((s) => s.id === selectedId);

  return (
    <FormControl fullWidth size="medium" sx={{ maxWidth: 460, my: 2 }}>
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
              {/* 🔹 Nome */}
              <Typography fontSize={16} fontWeight={500}>
                {snapshot.nomeArquivo}
              </Typography>

              {/* 🔹 Período (exemplo de campo descritivo) */}
              {snapshot.filtros?.dataInicial && snapshot.filtros?.dataFinal && (
                <Typography fontSize={14} color="text.secondary">
                  Período:{" "}
                  {dayjs(snapshot.filtros.dataInicial).format("DD/MM/YYYY")} -{" "}
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
  );
}
