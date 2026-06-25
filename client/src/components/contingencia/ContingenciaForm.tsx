"use client";

import dayjs from "dayjs";
import "dayjs/locale/pt-br";
import { useState } from "react";

import {
  saveContingencia,
  ContingenciaPayload,
} from "@/actions/contingencia.action";
import {
  CSDS,
  TIPOS_EQUIPE,
  TIPOS_MAO_OBRA,
} from "@/utils/contingenciaOptions";
import {
  Alert,
  Button,
  CircularProgress,
  MenuItem,
  Snackbar,
  TextField,
} from "@mui/material";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { FiltersInterface } from "@/types/filtersInterfaces";
import { SelectComponent } from "../common/Select";
import { useUser } from "@/contexts/userContext";

interface ContingenciaFormProps {
  optionsPartner: FiltersInterface;
  onSaved: () => void;
}

const fieldSx = {
  "& .MuiOutlinedInput-root": {
    backgroundColor: "#2a3a4d",
    color: "#e4e4e7",
    "& fieldset": { borderColor: "rgba(255,255,255,0.15)" },
    "&:hover fieldset": { borderColor: "rgba(255,255,255,0.3)" },
    "&.Mui-focused fieldset": { borderColor: "#53FF75" },
  },
  "& .MuiInputLabel-root": { color: "#a1a1aa", fontSize: "1rem" },
  "& .MuiInputLabel-root.Mui-focused": { color: "#53FF75" },
  "& .MuiSvgIcon-root": { color: "#a1a1aa" },
  "& input": { color: "#e4e4e7", fontSize: "1rem" },
  "& .MuiInputBase-input": { fontSize: "1rem" },
  "& .MuiSelect-select": { color: "#e4e4e7", fontSize: "1rem" },
};

const menuItemSx = { fontSize: "1rem" };

export function ContingenciaForm({
  optionsPartner,
  onSaved,
}: ContingenciaFormProps) {
  const { user } = useUser();

  const [diaDisponibilidade, setDiaDisponibilidade] =
    useState<dayjs.Dayjs | null>(null);
  const [parceira, setParceira] = useState<string>("");
  const [tipoMaoObra, setTipoMaoObra] = useState("");
  const [quantidadeMaoObra, setQuantidadeMaoObra] = useState("");
  const [tipoEquipe, setTipoEquipe] = useState("");
  const [quantidadeEquipe, setQuantidadeEquipe] = useState("");
  const [csd, setCsd] = useState("");

  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{
    open: boolean;
    severity: "success" | "error";
    message: string;
  }>({ open: false, severity: "success", message: "" });

  function resetForm() {
    setDiaDisponibilidade(null);
    setParceira("");
    setTipoMaoObra("");
    setQuantidadeMaoObra("");
    setTipoEquipe("");
    setQuantidadeEquipe("");
    setCsd("");
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (
      !diaDisponibilidade ||
      !parceira ||
      !tipoMaoObra ||
      quantidadeMaoObra === "" ||
      !tipoEquipe ||
      quantidadeEquipe === "" ||
      !csd
    ) {
      setFeedback({
        open: true,
        severity: "error",
        message: "Preencha todos os campos obrigatórios.",
      });
      return;
    }

    const payload: ContingenciaPayload = {
      dia_disponibilidade: diaDisponibilidade.format("YYYY-MM-DD"),
      idParceira: Number(parceira),
      tipo_recurso_mao_obra: tipoMaoObra,
      quantidade_mao_obra: Number(quantidadeMaoObra),
      tipo_recurso_equipe: tipoEquipe,
      quantidade_equipe: Number(quantidadeEquipe),
      disponibilizado_csd: csd,
      idUser: user?.id,
    };
    setLoading(true);
    const result = await saveContingencia(payload);
    setLoading(false);

    if (result.success) {
      setFeedback({
        open: true,
        severity: "success",
        message: result.message || "Resposta registrada com sucesso!",
      });
      resetForm();
      onSaved();
    } else {
      setFeedback({
        open: true,
        severity: "error",
        message: result.message || "Erro ao registrar resposta.",
      });
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-gradient-to-br from-[#1e2f42] to-[#192535] rounded-2xl border border-white/5 shadow-xl p-6"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="pt-br">
          <DatePicker
            label="1. Dia da disponibilidade do recurso *"
            value={diaDisponibilidade}
            onChange={(date) => setDiaDisponibilidade(date)}
            format="DD/MM/YYYY"
            slotProps={{
              textField: { size: "small", fullWidth: true, sx: fieldSx },
            }}
          />
        </LocalizationProvider>

        {/* <SelectComponent
          label="Parceira"
          menuItems={optionsPartner.parceira || []}
          selectedItem={parceira}
          setSelectedItem={(value) => setParceira(Number(value))}
          valueKey="id"
          displayKey="turma"
        /> */}

        <TextField
          select
          size="small"
          fullWidth
          label="2. Parceira *"
          value={parceira}
          onChange={(e) => setParceira(e.target.value)}
          sx={fieldSx}
        >
          {optionsPartner.parceira?.map((option) => (
            <MenuItem key={option.id} value={option.id} sx={menuItemSx}>
              {option.turma}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          select
          size="small"
          fullWidth
          label="3. Tipo de recurso - Mão de Obra *"
          value={tipoMaoObra}
          onChange={(e) => setTipoMaoObra(e.target.value)}
          sx={fieldSx}
        >
          {TIPOS_MAO_OBRA.map((option) => (
            <MenuItem key={option} value={option} sx={menuItemSx}>
              {option}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          size="small"
          fullWidth
          type="number"
          label="4. Quantidade de mão de obra disponibilizada *"
          value={quantidadeMaoObra}
          onChange={(e) => setQuantidadeMaoObra(e.target.value)}
          inputProps={{ min: 0 }}
          sx={fieldSx}
        />

        <TextField
          select
          size="small"
          fullWidth
          label="5. Tipo de recurso - Por Equipe *"
          value={tipoEquipe}
          onChange={(e) => setTipoEquipe(e.target.value)}
          sx={fieldSx}
        >
          {TIPOS_EQUIPE.map((option) => (
            <MenuItem key={option} value={option} sx={menuItemSx}>
              {option}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          size="small"
          fullWidth
          type="number"
          label="6. Quantidade de equipe disponibilizada *"
          value={quantidadeEquipe}
          onChange={(e) => setQuantidadeEquipe(e.target.value)}
          inputProps={{ min: 0 }}
          sx={fieldSx}
        />

        <TextField
          select
          size="small"
          fullWidth
          label="7. Disponibilizado ao CSD *"
          value={csd}
          onChange={(e) => setCsd(e.target.value)}
          sx={fieldSx}
        >
          {CSDS.map((option) => (
            <MenuItem key={option} value={option} sx={menuItemSx}>
              {option}
            </MenuItem>
          ))}
        </TextField>
      </div>

      <div className="mt-6 flex justify-end">
        <Button
          type="submit"
          disabled={loading}
          variant="contained"
          sx={{
            backgroundColor: "#53FF75",
            color: "#0f1a26",
            fontWeight: 700,
            fontSize: "1rem",
            px: 4,
            py: 1,
            "&:hover": { backgroundColor: "#3de062" },
          }}
        >
          {loading ? (
            <CircularProgress size={22} sx={{ color: "#0f1a26" }} />
          ) : (
            "Enviar"
          )}
        </Button>
      </div>

      <Snackbar
        open={feedback.open}
        autoHideDuration={4000}
        onClose={() => setFeedback((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert severity={feedback.severity} variant="filled">
          {feedback.message}
        </Alert>
      </Snackbar>
    </form>
  );
}
