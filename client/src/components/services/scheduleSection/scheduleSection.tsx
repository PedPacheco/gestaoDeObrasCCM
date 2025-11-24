import { useUser } from "@/contexts/userContext";
import { ArrowUpTrayIcon, XMarkIcon } from "@heroicons/react/20/solid";
import { Box, Button, Grid } from "@mui/material";
import { useState } from "react";
import { BasicInfoCard } from "./basicInfoCard";
import { EquipmentCard } from "./equipmentsCard";
import { RestrictionsCard } from "./restrictionsCard";
import { useScheduleFormV2 } from "@/hooks/useScheduleFormV2";
import { useScheduleSubmitV2 } from "@/hooks/useScheduleSubmitV2";
import { ButtonComponent } from "@/components/common/Button";
import { schedulesSchemaV2 } from "@/validations/validationSchedulesV2";
import { useRouter } from "next/navigation";

const INITIAL_FORM_DATA = {
  id: 0,
  dataProg: new Date().toISOString().split("T")[0],
  startTime: "08:00",
  finishTime: "17:00",
  prog: 0,
  exec: null,
  serviceType: "LV",
  observation: "",
  equipment: "",
  chi: 0,
  numDp: "",
  temporaryKey: false,
  lmTeam: 0,
  regulTeam: 0,
  lvTeam: 0,
  idTechnical: 1,
  idExecutionRestriction: 1,
  responsibility: "",
};

interface ScheduleSectionProps {
  idWork: number;
  isInsert: boolean;
  scheduleData: any;
  onError: (error: string) => void;
  onSuccess: (success: string) => void;
  onModalOpen: (open: boolean) => void;
  onIdScheduleExisting: (idSchedule: string | null) => void;
  options: {
    tecnico: Array<{ id: number; tecnico: string }>;
    restricao: Array<{ id: number; restricao: string }>;
  };
  statusWork: number;
}

export type ScheduleFormHookReturnV2 = ReturnType<typeof useScheduleFormV2>;

export function ScheduleSection({
  idWork,
  isInsert,
  scheduleData,
  onError,
  onSuccess,
  onModalOpen,
  onIdScheduleExisting,
  options,
  statusWork,
}: ScheduleSectionProps) {
  const [editingExecutionReport, setEditingExecutionReport] = useState<any>();

  const router = useRouter();

  const { permissions } = useUser();

  const spacingValue = isInsert ? 3 : 2;

  const scheduleForm = useScheduleFormV2({
    data: scheduleData,
    executionData: editingExecutionReport,
    options,
  });

  const { handleSubmit, isPending } = useScheduleSubmitV2({
    formData: scheduleForm.formData,
    executionReportData: scheduleForm.executionReportData,
    idWork,
    isInsert,
    onError,
    onSuccess,
    onModalOpen,
    setFormErrors: scheduleForm.setFormErrors,
    onIdScheduleExisting,
  });

  const submitButtonText = isPending ? "Salvando..." : "Salvar Programação";

  const handleCancel = () => {
    router.replace(`/detalhes/${idWork}`);
    router.refresh();
  };

  const disabledFields = () => {
    if (isInsert) {
      return (
        permissions?.permissao_visualizacao === "parcial" &&
        (statusWork === 3 || statusWork === 2)
      );
    }

    return (
      permissions?.permissao_visualizacao === "parcial" && statusWork === 35
    );
  };

  return (
    <Box className="space-y-6">
      <Grid
        container
        spacing={spacingValue}
        className={spacingValue ? "flex justify-between" : ""}
      >
        <BasicInfoCard
          formData={scheduleForm.formData}
          disabledFields={disabledFields}
          isInsert={isInsert}
          onInputChange={scheduleForm.handleInputChange}
        />

        <EquipmentCard
          formData={scheduleForm.formData}
          disabledFields={disabledFields}
          isInsert={isInsert}
          onInputChange={scheduleForm.handleInputChange}
        />

        {!isInsert && (
          <RestrictionsCard
            formData={scheduleForm.formData}
            options={options}
            disabledFields={disabledFields}
            onInputChange={scheduleForm.handleInputChange}
          />
        )}
      </Grid>

      <Box className="flex flex-wrap justify-end gap-4 mt-4">
        <Button
          variant="contained"
          color="inherit"
          startIcon={<XMarkIcon className="w-5 h-5 text-white" />}
          onClick={handleCancel}
          className="bg-gray-700 hover:bg-gray-800 text-white"
        >
          CANCELAR
        </Button>

        <ButtonComponent
          styled="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded"
          startIcon={<ArrowUpTrayIcon className="w-5 h-5 text-white" />}
          onClick={() => {
            const validationResult = schedulesSchemaV2(isInsert).safeParse(
              scheduleForm.formData
            );

            if (!validationResult.success) {
              const fieldErrors: Record<string, string> = {};
              validationResult.error.issues.forEach((err) => {
                const path = err.path.join(".");
                fieldErrors[path] = err.message;
              });
              scheduleForm.setFormErrors(fieldErrors);
              onError("Erro ao salvar programação");

              return;
            }
            scheduleForm.setFormErrors({});

            handleSubmit(validationResult.data, "schedule");
          }}
          disabled={isPending}
          text={submitButtonText}
        />
      </Box>
    </Box>
  );
}
