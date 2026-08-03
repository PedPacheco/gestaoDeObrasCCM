"use client";

import React, { useState } from "react";
import { useUser } from "@/contexts/userContext";
import {
  Collapse,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from "@mui/material";
import { RestrictionBlock } from "./restrictionsBlock";
import { SectionHeader } from "./sectionHeader";
import { UseScheduleFormReturn } from "@/hooks/details/useScheduleForm";
import { DatePicker } from "@mui/x-date-pickers";
import dayjs from "dayjs";

interface ScheduleSectionProps {
  isInsert: boolean;
  scheduleForm: UseScheduleFormReturn;
  options: {
    tecnico: Array<{ id: number; tecnico: string }>;
    restricao: Array<{ id: number; restricao: string; tipo_restricao: string }>;
  };
  statusWork: number;
  scheduleStatus?: string;
}

const SERVICE_TYPES = [
  "LV",
  "DP",
  "Obra livre",
  "DP + LV",
  "LV + Obra livre",
  "Regularização",
  "Desativação RD",
];

export function NewScheduleSection({
  scheduleForm,
  isInsert,
  options,
  statusWork,
  scheduleStatus,
}: ScheduleSectionProps) {
  const { permissions } = useUser();

  const { formData, formErrors, handleInputChange } = scheduleForm;

  const [mainOpen, setMainOpen] = useState(false);
  const [restrictionsOpen, setRestrictionsOpen] = useState(false);

  const disabledFields = (): boolean => {
    const isPartialPermission = permissions?.tipo_usuario === "PARCEIRA";

    if (!isPartialPermission) {
      return false;
    }

    if (isInsert) {
      return statusWork === 2 || statusWork === 3;
    }

    return scheduleStatus !== "Reprovado";
  };

  return (
    <div className="divide-y divide-gray-100 rounded-lg border border-gray-200 bg-white">
      {/* Seção: Dados da programação */}
      <SectionHeader
        title="Dados da programação"
        open={isInsert ? true : mainOpen}
        onToggle={() => setMainOpen((prev) => !prev)}
      />

      <Collapse in={isInsert ? true : mainOpen}>
        <div className="grid grid-cols-2 gap-3 p-5 sm:grid-cols-4">
          <TextField
            label="Data da programação"
            type="date"
            value={formData.dataProg ?? ""}
            onChange={handleInputChange("dataProg")}
            disabled={disabledFields()}
            size="small"
            fullWidth
            error={!!formErrors["dataProg"]}
            helperText={formErrors["dataProg"]}
          />

          <TextField
            label="Horário início"
            type="time"
            value={formData.startTime ?? ""}
            onChange={handleInputChange("startTime")}
            disabled={disabledFields()}
            size="small"
            fullWidth
            error={!!formErrors["startTime"]}
            helperText={formErrors["startTime"]}
          />

          <TextField
            label="Horário fim"
            type="time"
            value={formData.finishTime ?? ""}
            onChange={handleInputChange("finishTime")}
            disabled={disabledFields()}
            size="small"
            fullWidth
            error={!!formErrors["finishTime"]}
            helperText={formErrors["finishTime"]}
          />

          <TextField
            label="CHI"
            type="number"
            value={formData.chi ?? ""}
            onChange={handleInputChange("chi")}
            disabled={disabledFields()}
            size="small"
            fullWidth
            error={!!formErrors["chi"]}
            helperText={formErrors["chi"]}
          />

          <TextField
            label="Equipamento"
            value={formData.equipment ?? ""}
            onChange={handleInputChange("equipment")}
            disabled={disabledFields()}
            size="small"
            fullWidth
            placeholder="Equipamento"
            error={!!formErrors["equipment"]}
            helperText={formErrors["equipment"]}
          />

          <FormControl
            size="small"
            fullWidth
            disabled={disabledFields()}
            error={!!formErrors["tipo_servico"]}
          >
            <InputLabel>Tipo de serviço</InputLabel>
            <Select
              value={formData.serviceType ?? ""}
              label="Tipo de serviço"
              onChange={handleInputChange("serviceType")}
            >
              {SERVICE_TYPES.map((type) => (
                <MenuItem key={type} value={type}>
                  {type}
                </MenuItem>
              ))}
            </Select>
            {formErrors["serviceType"] && (
              <FormHelperText>{formErrors["serviceType"]}</FormHelperText>
            )}
          </FormControl>

          <TextField
            label="Número DP"
            value={formData.numDp ?? ""}
            onChange={handleInputChange("numDp")}
            disabled={disabledFields()}
            size="small"
            fullWidth
            placeholder="Número DP"
            error={!!formErrors["numDp"]}
            helperText={formErrors["numDp"]}
          />

          <FormControl
            size="small"
            fullWidth
            disabled={disabledFields()}
            error={!!formErrors["tecnico_responsavel"]}
          >
            <InputLabel>Técnico responsável</InputLabel>
            <Select
              value={formData.idTechnical}
              label="Técnico responsável"
              onChange={handleInputChange("idTechnical")}
            >
              {options.tecnico.map((tec) => (
                <MenuItem key={tec.id} value={tec.id}>
                  {tec.tecnico}
                </MenuItem>
              ))}
            </Select>
            {formErrors["tecnico_responsavel"] && (
              <FormHelperText>
                {formErrors["tecnico_responsavel"]}
              </FormHelperText>
            )}
          </FormControl>

          <TextField
            label="Observação"
            value={formData.observation ?? ""}
            onChange={handleInputChange("observation")}
            disabled={disabledFields()}
            multiline
            minRows={2}
            size="small"
            fullWidth
            placeholder="Observação da programação..."
            className="sm:col-span-4"
          />
        </div>
      </Collapse>

      {/* Seção: Restrições */}
      {!isInsert && (
        <>
          <SectionHeader
            title="Restrições"
            open={restrictionsOpen}
            onToggle={() => setRestrictionsOpen((prev) => !prev)}
          />

          <Collapse in={restrictionsOpen}>
            <div className="flex flex-col gap-2 p-5">
              <RestrictionBlock
                index={1}
                label="1ª Restrição"
                disabled={disabledFields()}
                formData={formData}
                formErrors={formErrors}
                onInputChange={handleInputChange}
                options={options}
              />
              <RestrictionBlock
                index={2}
                label="2ª Restrição"
                disabled={disabledFields()}
                formData={formData}
                formErrors={formErrors}
                onInputChange={handleInputChange}
                options={options}
              />
            </div>
          </Collapse>
        </>
      )}
    </div>
  );
}
