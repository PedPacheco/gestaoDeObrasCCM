"use client";

import "dayjs/locale/pt-br";

import dayjs from "dayjs";
import { useEffect, useState } from "react";

import { useUser } from "@/contexts/userContext";
import { buildPublicationRestrictionPayload } from "@/utils/transform";
import { PlusIcon, TrashIcon } from "@heroicons/react/20/solid";
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
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { permission } from "process";

interface RestrictionDrawerProps {
  open: boolean;
  onClose: () => void;
  data: any | null;
  onSave: (updated: any) => void;
  restrictionsValues: any[];
  idWork?: number;
  idParceira: number;
  isInsert: boolean;
}

const INITIAL_FORM_DATA = {
  id: 1,
  idRestriction: 1,
  responsibility: null,
  responsibleName: null,
  restrictionStatus: null,
  resolutionDate: null,
  observation: null,
  constructionObservation: null,
};

const RESPONSIBLE_ENGINEERS = [
  { id: 64, name: "Juliana Escobar Viacava", idParceira: 2 },
  { id: 66, name: "Henrique de Oliveira Batista", idParceira: 4 },
  { id: 80, name: "Marcos de Siqueira Mesquita", idParceira: 16 },
  { id: 80, name: "Marcos de Siqueira Mesquita", idParceira: 9 },
  { id: 94, name: "Diego Melegari", idParceira: 7 },
  { id: 94, name: "Diego Melegari", idParceira: 9 },
  { id: 94, name: "Diego Melegari", idParceira: 17 },
  { id: 130, name: "Jefferson Pereira Facioli da Silva", idParceira: 13 },
];

export default function RestrictionDrawer({
  open,
  onClose,
  data,
  onSave,
  restrictionsValues,
  idWork,
  idParceira,
  isInsert,
}: RestrictionDrawerProps) {
  const [form, setForm] = useState<any[]>([INITIAL_FORM_DATA]);

  const { user, permissions } = useUser();

  const responsibleEnginner = RESPONSIBLE_ENGINEERS.find(
    (enginner) => enginner.idParceira === idParceira,
  );

  useEffect(() => {
    if (!user) return;

    if (data) {
      const formattedData = buildPublicationRestrictionPayload(
        data,
        RESPONSIBLE_ENGINEERS,
        user.id,
      );
      setForm(formattedData);
    } else {
      setForm([
        {
          ...INITIAL_FORM_DATA,
          responsibleName: responsibleEnginner?.name,
          idUser: user?.id,
          id: idWork,
        },
      ]);
    }
  }, [data, idWork, responsibleEnginner?.name, user]);

  const handleChange = (index: number, field: string, value: any) => {
    setForm((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    );
  };

  const handleSave = () => {
    const cleanedForm = form.map((item) =>
      Object.fromEntries(
        Object.entries(item).map(([key, value]) => [
          key,
          value === "" ? null : value,
        ]),
      ),
    );

    if (data) {
      onSave(cleanedForm[0]);
    } else {
      onSave(cleanedForm);
    }

    onClose();
  };

  const addRestriction = () => {
    setForm((prev) => {
      return [
        ...prev,
        {
          ...INITIAL_FORM_DATA,
          id: idWork,
          idUser: user?.id,
          responsibleName: responsibleEnginner?.name,
        },
      ];
    });
  };

  const removeRestriction = () => {
    setForm((prev) => {
      if (prev.length === 1) return prev; // impede remover a última
      return prev.slice(0, -1);
    });
  };

  return (
    <Drawer anchor="left" open={open} onClose={onClose}>
      <Box sx={{ width: 420, p: 3 }}>
        <Typography variant="h5" fontWeight="bold" mb={2}>
          Editar Restrição
        </Typography>

        <Divider />

        {form.map((restriction, index) => (
          <div key={index}>
            <Typography variant="h6" mt={2}>
              Restrição
            </Typography>

            <FormControl fullWidth margin="normal">
              <InputLabel>Restrição</InputLabel>
              <Select
                disabled={
                  !permissions?.is_admin &&
                  ![7].includes(permissions?.id_area ?? -1)
                }
                value={restriction.idRestriction || 1}
                onChange={(e) =>
                  handleChange(index, "idRestriction", e.target.value)
                }
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
                disabled={
                  !permissions?.is_admin &&
                  ![7].includes(permissions?.id_area ?? -1)
                }
                value={restriction.responsibility || ""}
                onChange={(e) =>
                  handleChange(index, "responsibility", e.target.value)
                }
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
              disabled
              margin="normal"
            />

            <FormControl fullWidth margin="normal">
              <InputLabel>Status da restrição</InputLabel>
              <Select
                value={restriction.restrictionStatus || ""}
                onChange={(e) =>
                  handleChange(index, "restrictionStatus", e.target.value)
                }
                label="Status da restrição"
              >
                <MenuItem className="p-4" value=""></MenuItem>
                <MenuItem value="Pendente">Pendente</MenuItem>
                <MenuItem value="Resolvido">Resolvido</MenuItem>
                <MenuItem value="Em análise">Em análise</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Observação Publicação"
              value={restriction.observation || ""}
              onChange={(e) =>
                handleChange(index, "observation", e.target.value)
              }
              disabled={
                !(
                  permissions?.is_admin ||
                  [7].includes(permissions?.id_area ?? -1)
                )
              }
              margin="normal"
            />

            <TextField
              fullWidth
              label="Observação construção"
              value={restriction.constructionObservation || ""}
              onChange={(e) =>
                handleChange(index, "constructionObservation", e.target.value)
              }
              disabled={
                !permissions?.is_admin &&
                permissions?.id_area !== 8 &&
                !permissions?.permissao_edicao
              }
              margin="normal"
            />

            {data && (
              <LocalizationProvider
                dateAdapter={AdapterDayjs}
                adapterLocale="pt-br"
              >
                <DatePicker
                  label="Data resolução"
                  disabled={
                    !permissions?.is_admin &&
                    permissions?.id_area !== 8 &&
                    !permissions?.permissao_edicao
                  }
                  value={
                    restriction.resolutionDate
                      ? dayjs(restriction.resolutionDate, "DD/MM/YYYY")
                      : null
                  }
                  onChange={(value) =>
                    handleChange(
                      index,
                      "resolutionDate",
                      value ? value.format("DD/MM/YYYY") : null,
                    )
                  }
                  format="DD/MM/YYYY"
                  slotProps={{ textField: { size: "small", fullWidth: true } }}
                />
              </LocalizationProvider>
            )}
          </div>
        ))}

        <div className="flex justify-between items-center mt-4">
          <Button
            variant="contained"
            onClick={handleSave}
            className={isInsert ? "w-40" : "w-full"}
          >
            Salvar Restrição
          </Button>

          {isInsert && (
            <div className="flex gap-2">
              <Button
                variant="contained"
                color="primary"
                onClick={addRestriction}
              >
                <PlusIcon />
              </Button>

              <Button
                variant="contained"
                color="error"
                onClick={removeRestriction}
                disabled={
                  form.length <= 1 ||
                  !permissions?.is_admin ||
                  ![7].includes(permissions?.id_area ?? -1)
                }
              >
                <TrashIcon />
              </Button>
            </div>
          )}
        </div>
      </Box>
    </Drawer>
  );
}
