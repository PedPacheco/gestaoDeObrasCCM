"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { z } from "zod";

import { EquipmentData } from "@/components/details/modals/executionReportDialog/EquipmentPanel";
import {
  executionReportSchema,
  validationExecutionService,
} from "@/validations/validationExecutionServices";
import { transformExecutionReport } from "@/utils/transform";

export const staticValidationSchema = validationExecutionService(false);
export type FormData = z.infer<typeof staticValidationSchema>;
export type ExecutionReportData = z.infer<typeof executionReportSchema>;

export const INITIAL_EXECUTION_REPORT: ExecutionReportData = {
  id: 0,
  idUser: 0,
  supervisor: "",
  partialConnectionReleased: false,
  startTime: "00:00",
  finishTime: "00:00",
  startContact: "",
  endContact: "",
  delayJustification: "",
  hasEquipmentInstalled: false,
  appliedEquipment: [],
  hasEquipmentRemoved: false,
  equipmentRemoved: [],
  changesExecution: false,
  generalObservation: "",
  reason: "",
  provisionalKeyInstalled: false,
  provisionalKeyReference: "",
  provisionalKeyWithdrawn: null,
};

type ExecutionContext = {
  idWork: number;
  idSchedule: number;
  finishTime?: string;
  serviceType?: string;
};

export type ExecutionEditableData = {
  idExecutionRestriction: number;
  responsibility?: string;
  executionObservation?: string;
};

interface UseExecutionServiceFormProps {
  enabled?: boolean;
  data?: FormData | null;
  executionReportDataExisting?: ExecutionReportData;
}

export interface UseExecutionServiceFormReturn {
  editableData: {
    idExecutionRestriction: number;
    responsibility?: string;
    executionObservation?: string;
  };
  executionReportData: ExecutionReportData;
  formErrors: Record<string, string>;
  expanded: string | false;
  setFormErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  handleEditableChange: (
    field: keyof ExecutionEditableData,
  ) => (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleExecutionReportChange: (
    field: keyof ExecutionReportData,
  ) => (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleAccordionChange: (
    panel: string,
  ) => (_: unknown, isExpanded: boolean) => void;
  onEquipmentChange: (
    field: "appliedEquipment" | "equipmentRemoved",
    index: number,
    subField: keyof EquipmentData,
    value: string,
  ) => void;
  onAddEquipment: (
    field: "appliedEquipment" | "equipmentRemoved",
    type?: "DEFAULT" | "CS",
    insertIndex?: number,
  ) => void;
  onRemoveEquipment: (
    field: "appliedEquipment" | "equipmentRemoved",
    index: number,
  ) => void;
  buildPayload: () => FormData;
  resetForm: () => void;
}

export const useExecutionServiceForm = ({
  enabled,
  data,
  executionReportDataExisting,
}: UseExecutionServiceFormProps): UseExecutionServiceFormReturn => {
  const executionContext = useMemo<ExecutionContext>(
    () => ({
      idWork: data?.idWork ?? 0,
      idSchedule: data?.idSchedule ?? 0,
      finishTime: data?.finishTime ?? "17:00",
      serviceType: data?.serviceType,
    }),
    [data],
  );

  const [editableData, setEditableData] = useState<ExecutionEditableData>({
    idExecutionRestriction: 1,
    responsibility: "",
    executionObservation: "",
  });

  const [expanded, setExpanded] = useState<string | false>("panel1");

  useEffect(() => {
    if (executionReportDataExisting) {
      const executionReportDataMapped = transformExecutionReport(
        executionReportDataExisting,
      );

      setExecutionReportData(executionReportDataMapped);
    }

    if (!enabled || !data) return;

    setEditableData({
      idExecutionRestriction: data.idExecutionRestriction ?? 1,
      responsibility: data.responsibility || "",
      executionObservation: data.executionObservation || "",
    });
  }, [enabled, data, executionReportDataExisting]);

  const [executionReportData, setExecutionReportData] =
    useState<ExecutionReportData>(INITIAL_EXECUTION_REPORT);

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const handleEditableChange =
    (field: keyof ExecutionEditableData) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setEditableData((prev) => ({
        ...prev,
        [field]: event.target.value,
      }));
    };

  const handleExecutionReportChange =
    (field: keyof ExecutionReportData) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value =
        event.target.type === "checkbox"
          ? event.target.checked
          : event.target.value;

      setExecutionReportData((prev) => ({
        ...prev,
        [field]: value,
      }));
    };

  const handleAccordionChange = useCallback(
    (panel: string) => (_: any, isExpanded: boolean) => {
      setExpanded(isExpanded ? panel : false);
    },
    [],
  );

  const onEquipmentChange = (
    field: "appliedEquipment" | "equipmentRemoved",
    index: number,
    subField: keyof EquipmentData,
    value: string,
  ) => {
    setExecutionReportData((prev) => {
      const updated = [...prev[field]];
      updated[index] = {
        ...updated[index],
        [subField]: value,
      };

      return {
        ...prev,
        [field]: updated,
      };
    });
  };

  const onAddEquipment = (
    field: "appliedEquipment" | "equipmentRemoved",
    type: "DEFAULT" | "CS" = "DEFAULT",
    insertIndex?: number,
  ) => {
    const newEquipment: EquipmentData = {
      equipment: "",
      power: "",
      patrimony: "",
      installation: "",
      type,
    };

    setExecutionReportData((prev) => {
      const list = prev[field];

      const updated =
        insertIndex !== undefined
          ? [
              ...list.slice(0, insertIndex + 1),
              newEquipment,
              ...list.slice(insertIndex + 1),
            ]
          : [...list, newEquipment];

      return {
        ...prev,
        [field]: updated,
      };
    });
  };

  const onRemoveEquipment = (
    field: "appliedEquipment" | "equipmentRemoved",
    index: number,
  ) => {
    setExecutionReportData((prev) => {
      const updated = [...prev[field]];
      updated.splice(index, 1);

      return {
        ...prev,
        [field]: updated,
      };
    });
  };

  const buildPayload = useCallback(
    (): FormData => ({
      idWork: executionContext.idWork,
      idSchedule: executionContext.idSchedule,
      finishTime: executionContext.finishTime ?? "17:00",
      serviceType: executionContext.serviceType,

      idExecutionRestriction: editableData.idExecutionRestriction,
      responsibility: editableData.responsibility,
      executionObservation: editableData.executionObservation,

      executionReport: executionReportData,
    }),
    [executionContext, editableData, executionReportData],
  );

  const resetForm = useCallback(() => {
    setEditableData({
      idExecutionRestriction: 1,
      responsibility: undefined,
    });
    setExecutionReportData(INITIAL_EXECUTION_REPORT);
    setFormErrors({});
  }, []);

  return {
    /* dados */
    editableData,
    executionReportData,
    formErrors,
    expanded,

    /* setters */
    setFormErrors,

    /* handlers */
    handleEditableChange,
    handleExecutionReportChange,
    handleAccordionChange,
    onEquipmentChange,
    onAddEquipment,
    onRemoveEquipment,

    /* helpers */
    buildPayload,
    resetForm,
  };
};
