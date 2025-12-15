"use client";

import dayjs from "dayjs";
import { useEffect, useState } from "react";

import {
  Box,
  Button,
  Divider,
  Drawer,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers";
import "dayjs/locale/pt-br";
import { buildPublicationRestrictionPayload } from "@/utils/transform";

interface RestrictionDrawerProps {
  open: boolean;
  onClose: () => void;
  data: any | null;
  onSave: (updated: any) => void;
  restrictionsValues: any[];
}

export const INITIAL_FORM_DATA = {
  idWork: 1,
  idRestriction: 1,
  responsibility: null,
  responsibleName: null,
  restrictionStatus: null,
};

export default function RestrictionDrawer({
  open,
  onClose,
  data,
  onSave,
  restrictionsValues,
}: RestrictionDrawerProps) {
  const [form, setForm] = useState<any[]>([INITIAL_FORM_DATA]);

  useEffect(() => {
    if (data) {
      const formattedData = buildPublicationRestrictionPayload(data);

      setForm(formattedData);
    }
  }, [data]);

  const handleChange = (field: string, value: any) => {
    setForm((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    onSave(form);
    onClose();
  };

  const addRestriction = () => {
    setForm((prev) => {
      return [...prev, INITIAL_FORM_DATA];
    });
  };

  return (
    <Drawer anchor="right" open={open} onClose={onClose}>
      <Box sx={{ width: 420, p: 3 }}>
        <Typography variant="h5" fontWeight="bold" mb={2}>
          Editar Restrição
        </Typography>

        <Divider />

        {/* === BLOCO 1 === */}

        {form.map((restriction) => (
          <>
            <Typography variant="h6" mt={2}>
              Restrição
            </Typography>

            <FormControl fullWidth margin="normal">
              <InputLabel>Restrição</InputLabel>
              <Select
                value={restriction.idRestriction || 1}
                onChange={(e) => handleChange("idRestriction", e.target.value)}
                label="Restrição"
              >
                {restrictionsValues.map((value, index) => (
                  <MenuItem key={index} value={value.id}>
                    {value.restricao}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth margin="normal">
              <InputLabel>Responsabilidade</InputLabel>
              <Select
                value={restriction.responsibility || ""}
                onChange={(e) => handleChange("responsibility", e.target.value)}
                label="Responsabilidade"
              >
                <MenuItem className="p-4" value=""></MenuItem>
                <MenuItem value="Edp">Edp</MenuItem>
                <MenuItem value="Parceira">Parceira</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Nome do responsável"
              value={restriction.responsibleName || ""}
              onChange={(e) => handleChange("responsibleName", e.target.value)}
              margin="normal"
            />

            <FormControl fullWidth margin="normal">
              <InputLabel>Status da restrição</InputLabel>
              <Select
                value={restriction.restrictionStatus || ""}
                onChange={(e) =>
                  handleChange("restrictionStatus", e.target.value)
                }
                label="Status da restrição"
              >
                <MenuItem className="p-4" value=""></MenuItem>
                <MenuItem value="Pendente">Pendente</MenuItem>
                <MenuItem value="Resolvido">Resolvido</MenuItem>
                <MenuItem value="Em análise">Em análise</MenuItem>
              </Select>
            </FormControl>
          </>
        ))}

        <div className="flex justify-between">
          <Button
            variant="contained"
            sx={{ mt: 4 }}
            onClick={handleSave}
            className="w-40"
          >
            Salvar Alterações
          </Button>

          <Button
            variant="contained"
            sx={{ mt: 4 }}
            className="w-40"
            onClick={addRestriction}
          >
            Adiconar restrição
          </Button>
        </div>
      </Box>
    </Drawer>
  );
}
