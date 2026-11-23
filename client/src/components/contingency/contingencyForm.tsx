"use client";

import {
  ContingenciaPayload,
  saveContingencia,
} from "@/actions/contingencia.action";
import { CSDS, LABOR_TYPES, TEAMS_TYPES } from "@/constants/contingency";
import { useUser } from "@/contexts/userContext";
import { FiltersInterface } from "@/types/genericFilterSchema";
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
import dayjs from "dayjs";
import "dayjs/locale/pt-br";
import { useState } from "react";

interface ContingencyFormProps {
  partnerOptions: FiltersInterface;
  onSaved: () => void;
}

type TipoRecurso = "" | "MAO_DE_OBRA" | "EQUIPE";

const INTEGER_REGEX = /^\d*$/;

const RESOURCE_TYPES: { value: Exclude<TipoRecurso, "">; label: string }[] = [
  { value: "MAO_DE_OBRA", label: "Mão de Obra" },
  { value: "EQUIPE", label: "Equipe" },
];

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

export function ContingencyForm({
  partnerOptions,
  onSaved,
}: ContingencyFormProps) {
  const { user } = useUser();

  const [diaDisponibilidade, setDiaDisponibilidade] =
    useState<dayjs.Dayjs | null>(null);
  const [parceira, setParceira] = useState<string>("");
  const [tipoRecurso, setTipoRecurso] = useState<TipoRecurso>("");
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

  const isMaoObra = tipoRecurso === "MAO_DE_OBRA";
  const isEquipe = tipoRecurso === "EQUIPE";

  function handleIntegerChange(
    value: string,
    setter: React.Dispatch<React.SetStateAction<string>>,
  ) {
    if (INTEGER_REGEX.test(value)) {
      setter(value);
    }
  }

  function handleTipoRecursoChange(value: TipoRecurso) {
    setTipoRecurso(value);
    // Limpa os campos do tipo que deixou de estar visível
    if (value === "MAO_DE_OBRA") {
      setTipoEquipe("");
      setQuantidadeEquipe("");
    } else if (value === "EQUIPE") {
      setTipoMaoObra("");
      setQuantidadeMaoObra("");
    }
  }

  function resetForm() {
    setDiaDisponibilidade(null);
    setParceira("");
    setTipoRecurso("");
    setTipoMaoObra("");
    setQuantidadeMaoObra("");
    setTipoEquipe("");
    setQuantidadeEquipe("");
    setCsd("");
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    const camposBaseOk =
      !!diaDisponibilidade && !!parceira && !!tipoRecurso && !!csd;
    const maoObraOk = !isMaoObra || (!!tipoMaoObra && quantidadeMaoObra !== "");
    const equipeOk = !isEquipe || (!!tipoEquipe && quantidadeEquipe !== "");

    if (!camposBaseOk || !maoObraOk || !equipeOk) {
      setFeedback({
        open: true,
        severity: "error",
        message: "Preencha todos os campos obrigatórios.",
      });
      return;
    }

    const payload: ContingenciaPayload = {
      availabilityDate: diaDisponibilidade!.format("YYYY-MM-DD"),
      partnerId: Number(parceira),
      laborType: isMaoObra ? tipoMaoObra : null,
      laborQuantity: isMaoObra ? Number(quantidadeMaoObra) : null,
      teamType: isEquipe ? tipoEquipe : null,
      teamQuantity: isEquipe ? Number(quantidadeEquipe) : null,
      allocatedCsd: csd,
      userId: user?.id,
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

        <TextField
          select
          size="small"
          fullWidth
          label="2. Parceira *"
          value={parceira}
          onChange={(e) => setParceira(e.target.value)}
          sx={fieldSx}
        >
          {partnerOptions.parceira?.map((option) => (
            <MenuItem key={option.id} value={option.id} sx={menuItemSx}>
              {option.turma}
            </MenuItem>
          ))}
        </TextField>

        {/* NOVO: seleção do tipo de recurso */}
        <TextField
          select
          size="small"
          fullWidth
          label="3. Tipo de recurso *"
          value={tipoRecurso}
          onChange={(e) =>
            handleTipoRecursoChange(e.target.value as TipoRecurso)
          }
          sx={fieldSx}
        >
          {RESOURCE_TYPES.map((option) => (
            <MenuItem key={option.value} value={option.value} sx={menuItemSx}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          select
          size="small"
          fullWidth
          label="4. Disponibilizado ao CSD *"
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

        {/* Campos de Mão de Obra */}
        {isMaoObra && (
          <>
            <TextField
              select
              size="small"
              fullWidth
              label="5. Tipo de recurso - Mão de Obra *"
              value={tipoMaoObra}
              onChange={(e) => setTipoMaoObra(e.target.value)}
              sx={fieldSx}
            >
              {LABOR_TYPES.map((option) => (
                <MenuItem key={option} value={option} sx={menuItemSx}>
                  {option}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              size="small"
              fullWidth
              type="text"
              label="6. Quantidade de mão de obra disponibilizada *"
              value={quantidadeMaoObra}
              onChange={(e) =>
                handleIntegerChange(e.target.value, setQuantidadeMaoObra)
              }
              inputProps={{ inputMode: "numeric", pattern: "[0-9]*" }}
              sx={fieldSx}
            />
          </>
        )}

        {/* Campos de Equipe */}
        {isEquipe && (
          <>
            <TextField
              select
              size="small"
              fullWidth
              label="5. Tipo de recurso - Por Equipe *"
              value={tipoEquipe}
              onChange={(e) => setTipoEquipe(e.target.value)}
              sx={fieldSx}
            >
              {TEAMS_TYPES.map((option) => (
                <MenuItem key={option} value={option} sx={menuItemSx}>
                  {option}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              size="small"
              fullWidth
              type="text"
              label="6. Quantidade de equipe disponibilizada *"
              value={quantidadeEquipe}
              onChange={(e) =>
                handleIntegerChange(e.target.value, setQuantidadeEquipe)
              }
              inputProps={{ inputMode: "numeric", pattern: "[0-9]*" }}
              sx={fieldSx}
            />
          </>
        )}
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
