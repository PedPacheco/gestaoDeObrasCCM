"use client";

import React from "react";
import {
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  FormHelperText,
  Typography,
  Box,
} from "@mui/material";
import { FormData } from "@/hooks/details/useScheduleForm";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";

import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

dayjs.extend(utc);

interface ScheduleDataCardProps {
  formData: FormData;
  formErrors?: Record<string, string>;
  disabledFields: () => boolean;
  onInputChange: (field: keyof FormData) => (event: any) => void;
  options: {
    tecnico: Array<{ id: number; tecnico: string }>;
    restricao: Array<{ id: number; restricao: string; tipo_restricao: string }>;
  };
}

export function ScheduleDataCard({
  formData,
  formErrors = {},
  disabledFields,
  onInputChange,
  options,
}: ScheduleDataCardProps) {
  const disabled = disabledFields();

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5">
      <h2 className="mb-4 text-xs font-medium uppercase tracking-wider text-gray-500">
        Dados da programação
      </h2>

      {/* Linha 2: Horário início + Horário fim + CHI */}
      <div className="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <TextField
          label="Data da programação"
          type="date"
          value={formData.dataProg ?? ""}
          onChange={onInputChange("dataProg")}
          disabled={disabled}
          size="small"
          fullWidth
          error={!!formErrors["dataProg"]}
          helperText={formErrors["dataProg"]}
        />

        <TextField
          label="Horário início"
          type="time"
          value={formData.startTime ?? ""}
          onChange={onInputChange("startTime")}
          disabled={disabled}
          size="small"
          fullWidth
          error={!!formErrors["startTime"]}
          helperText={formErrors["startTime"]}
        />

        <TextField
          label="Horário fim"
          type="time"
          value={formData.finishTime ?? ""}
          onChange={onInputChange("finishTime")}
          disabled={disabled}
          size="small"
          fullWidth
          error={!!formErrors["finishTime"]}
          helperText={formErrors["finishTime"]}
        />

        <TextField
          label="CHI"
          type="number"
          value={formData.chi ?? ""}
          onChange={onInputChange("chi")}
          disabled={disabled}
          size="small"
          fullWidth
          error={!!formErrors["chi"]}
          helperText={formErrors["chi"]}
        />
      </div>

      {/* Linha 3: Equipamento + Número DP */}
      <div className="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <TextField
          label="Equipamento"
          value={formData.equipment ?? ""}
          onChange={onInputChange("equipment")}
          disabled={disabled}
          size="small"
          fullWidth
          placeholder="Equipamento"
          error={!!formErrors["equipment"]}
          helperText={formErrors["equipment"]}
        />

        <FormControl
          size="small"
          fullWidth
          disabled={disabled}
          error={!!formErrors["tipo_servico"]}
        >
          <InputLabel>Tipo de serviço</InputLabel>
          <Select
            value={formData.serviceType ?? ""}
            label="Tipo de serviço"
            onChange={onInputChange("serviceType")}
          >
            <MenuItem value="LV">LV</MenuItem>
            <MenuItem value="SE">SE</MenuItem>
            <MenuItem value="LD">LD</MenuItem>
          </Select>
          {formErrors["serviceType"] && (
            <FormHelperText>{formErrors["serviceType"]}</FormHelperText>
          )}
        </FormControl>

        <TextField
          label="Número DP"
          value={formData.numDp ?? ""}
          onChange={onInputChange("numDp")}
          disabled={disabled}
          size="small"
          fullWidth
          placeholder="Número DP"
          error={!!formErrors["numDp"]}
          helperText={formErrors["numDp"]}
        />

        <FormControl
          size="small"
          fullWidth
          disabled={disabled}
          error={!!formErrors["tecnico_responsavel"]}
        >
          <InputLabel>Técnico responsável</InputLabel>
          <Select
            value={formData.idTechnical}
            label="Técnico Responsável"
            disabled={disabledFields()}
            onChange={onInputChange("idTechnical")}
          >
            {options.tecnico.map((tec) => (
              <MenuItem key={tec.id} value={tec.id}>
                {tec.tecnico}
              </MenuItem>
            ))}
          </Select>
          {formErrors["tecnico_responsavel"] && (
            <FormHelperText>{formErrors["tecnico_responsavel"]}</FormHelperText>
          )}
        </FormControl>
      </div>

      <LocalizationProvider dateAdapter={AdapterDayjs}>
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
            error={!!formErrors.responsibilityProg}
          >
            <InputLabel>1° Responsabilidade</InputLabel>
            <Select
              value={formData.responsibilityProg || ""}
              onChange={onInputChange("responsibilityProg")}
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
              formData.resolutionDate
                ? dayjs.utc(formData.resolutionDate)
                : null
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
              onChange={onInputChange("responsibilityProg2")}
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
              formData.resolutionDate2
                ? dayjs.utc(formData.resolutionDate2)
                : null
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
      </LocalizationProvider>

      {/* Linha 6: Observação */}
      <TextField
        label="Observação"
        value={formData.observation ?? ""}
        onChange={onInputChange("observation")}
        disabled={disabled}
        multiline
        minRows={2}
        size="small"
        fullWidth
        placeholder="Observação da programação..."
        className="mt-1"
      />
    </div>
  );
}
