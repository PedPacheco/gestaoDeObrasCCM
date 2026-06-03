import { useUser } from "@/contexts/userContext";
import { ArrowUpTrayIcon, XMarkIcon } from "@heroicons/react/20/solid";
import { Box, Button, Grid } from "@mui/material";

import { BasicInfoCard } from "./basicInfoCard";
import { EquipmentCard } from "./equipmentsCard";

import { ButtonComponent } from "@/components/common/Button";
import { useRouter } from "next/navigation";
import { schedulesSchema } from "@/validations/validationSchedules";

interface ScheduleSectionProps {
  idWork: number;
  idSchedule: number;
  isInsert: boolean;
  scheduleForm: any;
  onError: (error: string) => void;
  options: {
    tecnico: Array<{ id: number; tecnico: string }>;
    restricao: Array<{ id: number; restricao: string; tipo_restricao: string }>;
  };
  statusWork: number;
  // setOpenTeamsModal: (team: boolean) => void;
  isPending: boolean;
  handleSubmit: (data: any) => any;
}

export type scheduleFormHookReturnV2 = ReturnType<typeof schedulesSchema>;

export function ScheduleSection({
  scheduleForm,
  idWork,
  idSchedule,
  isInsert,
  onError,
  options,
  statusWork,
  isPending,
  handleSubmit,
}: ScheduleSectionProps) {
  const router = useRouter();
  const { permissions } = useUser();

  const submitButtonText = isPending ? "Salvando..." : "Salvar Programação";

  const handleCancel = () => {
    router.replace(`/detalhes/${idWork}`);
    router.refresh();
  };

  const disabledFields = () => {
    if (isInsert) {
      return (
        permissions?.tipo_usuario === "PARCEIRA" &&
        (statusWork === 3 || statusWork === 2)
      );
    }

    return permissions?.tipo_usuario === "PARCEIRA" && statusWork === 35;
  };

  return (
    <Box className="space-y-6">
      <Grid container spacing={2} justifyContent="center">
        <BasicInfoCard
          formData={scheduleForm.formData}
          disabledFields={disabledFields}
          onInputChange={scheduleForm.handleInputChange}
        />

        <EquipmentCard
          formData={scheduleForm.formData}
          disabledFields={disabledFields}
          onInputChange={scheduleForm.handleInputChange}
          options={options}
        />
      </Grid>

      <Box className="flex flex-wrap justify-end gap-4 mt-4">
        {!isInsert && (
          <>
            {" "}
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
                const validationResult = schedulesSchema().safeParse(
                  scheduleForm.formData,
                );

                if (!validationResult.success && isInsert) {
                  const fieldErrors: Record<string, string> = {};
                  validationResult.error.issues.forEach((err) => {
                    const path = err.path.join(".");
                    fieldErrors[path] = err.message;
                  });
                  scheduleForm.setFormErrors(fieldErrors);
                  onError("Erro ao salvar programação");

                  return;
                }

                // if (isInsert) {
                //   setOpenTeamsModal(true);
                // } else {
                const data = {
                  id: idSchedule,
                  ...validationResult.data,
                };

                handleSubmit(data);
                // }
              }}
              disabled={isPending}
              text="Editar programação"
            />
          </>
        )}
      </Box>
    </Box>
  );
}
