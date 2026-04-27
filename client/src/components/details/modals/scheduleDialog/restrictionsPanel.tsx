import "dayjs/locale/pt-br";

import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

import { FormData } from "@/hooks/details/useScheduleForm";
import {
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers";

dayjs.extend(utc);

interface RestrictionsPanelProps {
  formData: any;
  formErrors: Record<string, string>;
  options: {
    restricao: Array<{ id: number; restricao: string; tipo_restricao: string }>;
  };
  onInputChange: (field: keyof FormData) => (event: any) => void;
  disabledFields: () => boolean;
}

export function RestrictionsPanel({
  formData,
  formErrors,
  options,
  onInputChange,
  disabledFields,
}: RestrictionsPanelProps) {
  const disabled = disabledFields();

  return (
    <Box sx={{ p: 2 }}>
      {/* === BLOCO 1 === */}
      <Typography variant="h6" mb={2}>
        1ª Restrição
      </Typography>

      <FormControl
        fullWidth
        margin="normal"
        error={!!formErrors.idProgRestriction1}
      >
        <InputLabel>1° Restrição</InputLabel>
        <Select
          value={formData.idProgRestriction1 || 1}
          onChange={onInputChange("idProgRestriction1")}
          label="1° Restrição"
          disabled={disabled}
        >
          {options.restricao
            .filter((value) => value.tipo_restricao === "PROGRAMAÇÃO")
            .map((value) => (
              <MenuItem key={value.id} value={value.id}>
                {value.restricao}
              </MenuItem>
            ))}
        </Select>
        {formErrors.idProgRestriction1 && (
          <Typography color="error" variant="caption">
            {formErrors.idProgRestriction1}
          </Typography>
        )}
      </FormControl>

      <FormControl
        fullWidth
        margin="normal"
        error={!!formErrors.responsiblityProg}
      >
        <InputLabel>1° Responsabilidade</InputLabel>
        <Select
          value={formData.responsiblityProg || ""}
          onChange={onInputChange("responsiblityProg")}
          label="1° Responsabilidade"
          disabled={disabled}
        >
          <MenuItem value="">Selecione</MenuItem>
          <MenuItem value="Edp">Edp</MenuItem>
          <MenuItem value="Parceira">Parceira</MenuItem>
        </Select>
        {formErrors.responsiblityProg && (
          <Typography color="error" variant="caption">
            {formErrors.responsiblityProg}
          </Typography>
        )}
      </FormControl>

      <TextField
        fullWidth
        label="1° Nome do responsável"
        value={formData.responsibleName || ""}
        onChange={onInputChange("responsibleName")}
        margin="normal"
        disabled={disabled}
        error={!!formErrors.responsibleName}
        helperText={formErrors.responsibleName}
      />

      <TextField
        fullWidth
        label="1° Área do responsável"
        value={formData.responsibleArea || ""}
        onChange={onInputChange("responsibleArea")}
        margin="normal"
        disabled={disabled}
        error={!!formErrors.responsibleArea}
        helperText={formErrors.responsibleArea}
      />

      <FormControl
        fullWidth
        margin="normal"
        error={!!formErrors.restrictionStatus}
      >
        <InputLabel>1° Status da restrição</InputLabel>
        <Select
          value={formData.restrictionStatus || ""}
          onChange={onInputChange("restrictionStatus")}
          label="1° Status da restrição"
          disabled={disabled}
        >
          <MenuItem value="">Selecione</MenuItem>
          <MenuItem value="Pendente">Pendente</MenuItem>
          <MenuItem value="Resolvido">Resolvido</MenuItem>
          <MenuItem value="Em análise">Em análise</MenuItem>
        </Select>
        {formErrors.restrictionStatus && (
          <Typography color="error" variant="caption">
            {formErrors.restrictionStatus}
          </Typography>
        )}
      </FormControl>

      <DatePicker
        label="1° Data de resolução"
        value={
          formData.resolutionDate ? dayjs.utc(formData.resolutionDate) : null
        }
        onChange={(v) =>
          onInputChange("resolutionDate")(
            v ? dayjs(v).utc().toISOString() : null,
          )
        }
        format="DD/MM/YYYY"
        disabled={disabled}
        slotProps={{
          textField: {
            fullWidth: true,
            margin: "normal",
            error: !!formErrors.resolutionDate,
            helperText: formErrors.resolutionDate,
          },
        }}
      />

      {/* === BLOCO 2 === */}
      <Typography variant="h6" mt={4} mb={2}>
        2ª Restrição
      </Typography>

      <FormControl
        fullWidth
        margin="normal"
        error={!!formErrors.idProgRestriction2}
      >
        <InputLabel>2° Restrição</InputLabel>
        <Select
          value={formData.idProgRestriction2 || 1}
          onChange={onInputChange("idProgRestriction2")}
          label="2° Restrição"
          disabled={disabled}
        >
          {options.restricao
            .filter((value) => value.tipo_restricao === "PROGRAMAÇÃO")
            .map((value) => (
              <MenuItem key={value.id} value={value.id}>
                {value.restricao}
              </MenuItem>
            ))}
        </Select>
        {formErrors.idProgRestriction2 && (
          <Typography color="error" variant="caption">
            {formErrors.idProgRestriction2}
          </Typography>
        )}
      </FormControl>

      <FormControl
        fullWidth
        margin="normal"
        error={!!formErrors.responsibilityProg2}
      >
        <InputLabel>2° Responsabilidade</InputLabel>
        <Select
          value={formData.responsibilityProg2 || ""}
          onChange={onInputChange("responsiblityProg2")}
          label="2° Responsabilidade"
          disabled={disabled}
        >
          <MenuItem value="">Selecione</MenuItem>
          <MenuItem value="Edp">Edp</MenuItem>
          <MenuItem value="Parceira">Parceira</MenuItem>
        </Select>
        {formErrors.responsibilityProg2 && (
          <Typography color="error" variant="caption">
            {formErrors.responsibilityProg2}
          </Typography>
        )}
      </FormControl>

      <TextField
        fullWidth
        label="2° Nome do responsável"
        value={formData.responsibleName2 || ""}
        onChange={onInputChange("responsibleName2")}
        margin="normal"
        disabled={disabled}
        error={!!formErrors.responsibleName2}
        helperText={formErrors.responsibleName2}
      />

      <TextField
        fullWidth
        label="2° Área do responsável"
        value={formData.responsibleArea2 || ""}
        onChange={onInputChange("responsibleArea2")}
        margin="normal"
        disabled={disabled}
        error={!!formErrors.responsibleArea2}
        helperText={formErrors.responsibleArea2}
      />

      <FormControl
        fullWidth
        margin="normal"
        error={!!formErrors.restrictionStatus2}
      >
        <InputLabel>2° Status da restrição</InputLabel>
        <Select
          value={formData.restrictionStatus2 || ""}
          onChange={onInputChange("restrictionStatus2")}
          label="2° Status da restrição"
          disabled={disabled}
        >
          <MenuItem value="">Selecione</MenuItem>
          <MenuItem value="Pendente">Pendente</MenuItem>
          <MenuItem value="Resolvido">Resolvido</MenuItem>
          <MenuItem value="Em análise">Em análise</MenuItem>
        </Select>
        {formErrors.restrictionStatus2 && (
          <Typography color="error" variant="caption">
            {formErrors.restrictionStatus2}
          </Typography>
        )}
      </FormControl>

      <DatePicker
        label="2° Data de resolução"
        value={
          formData.resolutionDate2 ? dayjs.utc(formData.resolutionDate2) : null
        }
        onChange={(v) =>
          onInputChange("resolutionDate2")(
            v ? dayjs(v).utc().toISOString() : null,
          )
        }
        disabled={disabled}
        format="DD/MM/YYYY"
        slotProps={{
          textField: {
            fullWidth: true,
            margin: "normal",
            error: !!formErrors.resolutionDate2,
            helperText: formErrors.resolutionDate2,
          },
        }}
      />
    </Box>
  );
}
