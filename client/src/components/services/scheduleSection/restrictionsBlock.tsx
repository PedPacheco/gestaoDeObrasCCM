import { FormData } from "@/hooks/details/useScheduleForm";
import { ChevronDownIcon } from "@heroicons/react/20/solid";
import {
  Chip,
  Collapse,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from "@mui/material";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import { useState } from "react";

type RestrictionStatus = "Pendente" | "Resolvido" | "Em análise" | "";

const STATUS_COLORS: Record<
  Exclude<RestrictionStatus, "">,
  "warning" | "success" | "info"
> = {
  Pendente: "warning",
  Resolvido: "success",
  "Em análise": "info",
};

interface RestrictionBlockProps {
  index: 1 | 2;
  label: string;
  disabled: boolean;
  formData: FormData;
  formErrors: Record<string, string>;
  onInputChange: (field: keyof FormData) => (event: any) => void;
  options: {
    tecnico: Array<{ id: number; tecnico: string }>;
    restricao: Array<{ id: number; restricao: string; tipo_restricao: string }>;
  };
}

export function RestrictionBlock({
  index,
  label,
  disabled,
  formData,
  formErrors,
  onInputChange,
  options,
}: RestrictionBlockProps) {
  const [open, setOpen] = useState(false);

  const isFirst = index === 1;

  const fields = {
    idRestriction: isFirst
      ? ("idProgRestriction1" as keyof FormData)
      : ("idProgRestriction2" as keyof FormData),
    responsibility: isFirst
      ? ("responsibilityProg" as keyof FormData)
      : ("responsibilityProg2" as keyof FormData),
    responsibleName: isFirst
      ? ("responsibleName" as keyof FormData)
      : ("responsibleName2" as keyof FormData),
    responsibleArea: isFirst
      ? ("responsibleArea" as keyof FormData)
      : ("responsibleArea2" as keyof FormData),
    restrictionStatus: isFirst
      ? ("restrictionStatus" as keyof FormData)
      : ("restrictionStatus2" as keyof FormData),
    resolutionDate: isFirst
      ? ("resolutionDate" as keyof FormData)
      : ("resolutionDate2" as keyof FormData),
  };

  const errorKeys = {
    idRestriction: isFirst ? "idProgRestriction1" : "idProgRestriction2",
    responsibility: isFirst ? "responsibilityProg" : "responsibilityProg2",
    responsibleName: isFirst ? "responsibleName" : "responsibleName2",
    responsibleArea: isFirst ? "responsibleArea" : "responsibleArea2",
    restrictionStatus: isFirst ? "restrictionStatus" : "restrictionStatus2",
    resolutionDate: isFirst ? "resolutionDate" : "resolutionDate2",
  };

  const currentStatus = (formData[fields.restrictionStatus] ||
    "") as RestrictionStatus;
  const statusColor =
    currentStatus && currentStatus in STATUS_COLORS
      ? STATUS_COLORS[currentStatus as Exclude<RestrictionStatus, "">]
      : undefined;

  return (
    <div className="overflow-hidden rounded-md border border-gray-200">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between bg-gray-50 px-4 py-3 text-left hover:bg-gray-100"
      >
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-gray-400">{label}</span>
          {statusColor && currentStatus && (
            <Chip
              label={currentStatus}
              color={statusColor}
              size="small"
              variant="outlined"
              sx={{ fontSize: 11, height: 20, borderRadius: "6px" }}
            />
          )}
        </div>
        <ChevronDownIcon
          height={10}
          width={10}
          className={`text-gray-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      <Collapse in={open}>
        <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-3">
          <FormControl
            size="small"
            fullWidth
            disabled={disabled}
            error={!!formErrors[errorKeys.idRestriction]}
          >
            <InputLabel>Restrição</InputLabel>
            <Select
              value={formData[fields.idRestriction] || 1}
              label="Restrição"
              onChange={onInputChange(fields.idRestriction)}
            >
              {options.restricao
                .filter((r) => r.tipo_restricao === "PROGRAMAÇÃO")
                .map((r) => (
                  <MenuItem key={r.id} value={r.id}>
                    {r.restricao}
                  </MenuItem>
                ))}
            </Select>
            {formErrors[errorKeys.idRestriction] && (
              <FormHelperText>
                {formErrors[errorKeys.idRestriction]}
              </FormHelperText>
            )}
          </FormControl>

          <FormControl
            size="small"
            fullWidth
            disabled={disabled}
            error={!!formErrors[errorKeys.responsibility]}
          >
            <InputLabel>Responsabilidade</InputLabel>
            <Select
              value={formData[fields.responsibility] || ""}
              label="Responsabilidade"
              onChange={onInputChange(fields.responsibility)}
            >
              <MenuItem value="">Selecione</MenuItem>
              <MenuItem value="Edp">Edp</MenuItem>
              <MenuItem value="Parceira">Parceira</MenuItem>
            </Select>
            {formErrors[errorKeys.responsibility] && (
              <FormHelperText>
                {formErrors[errorKeys.responsibility]}
              </FormHelperText>
            )}
          </FormControl>

          <FormControl
            size="small"
            fullWidth
            disabled={disabled}
            error={!!formErrors[errorKeys.restrictionStatus]}
          >
            <InputLabel>Status da restrição</InputLabel>
            <Select
              value={formData[fields.restrictionStatus] || ""}
              label="Status da restrição"
              onChange={onInputChange(fields.restrictionStatus)}
            >
              <MenuItem value="">Selecione</MenuItem>
              <MenuItem value="Pendente">Pendente</MenuItem>
              <MenuItem value="Resolvido">Resolvido</MenuItem>
              <MenuItem value="Em análise">Em análise</MenuItem>
            </Select>
            {formErrors[errorKeys.restrictionStatus] && (
              <FormHelperText>
                {formErrors[errorKeys.restrictionStatus]}
              </FormHelperText>
            )}
          </FormControl>

          <TextField
            label="Nome do responsável"
            value={formData[fields.responsibleName] || ""}
            onChange={onInputChange(fields.responsibleName)}
            disabled={disabled}
            size="small"
            fullWidth
            error={!!formErrors[errorKeys.responsibleName]}
            helperText={formErrors[errorKeys.responsibleName]}
          />

          <TextField
            label="Área do responsável"
            value={formData[fields.responsibleArea] || ""}
            onChange={onInputChange(fields.responsibleArea)}
            disabled={disabled}
            size="small"
            fullWidth
            error={!!formErrors[errorKeys.responsibleArea]}
            helperText={formErrors[errorKeys.responsibleArea]}
          />

          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              label="Data de resolução"
              value={
                formData[fields.resolutionDate]
                  ? dayjs.utc(formData[fields.resolutionDate] as string)
                  : null
              }
              onChange={(v) =>
                onInputChange(fields.resolutionDate)(
                  v ? dayjs(v).utc().toISOString() : null,
                )
              }
              format="DD/MM/YYYY"
              disabled={disabled}
              slotProps={{
                textField: {
                  size: "small",
                  fullWidth: true,
                  error: !!formErrors[errorKeys.resolutionDate],
                  helperText: formErrors[errorKeys.resolutionDate],
                },
              }}
            />
          </LocalizationProvider>
        </div>
      </Collapse>
    </div>
  );
}
