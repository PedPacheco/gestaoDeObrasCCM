"use client";

import {
  startTransition,
  Suspense,
  useCallback,
  useEffect,
  useState,
} from "react";

import { deleteExecutionReport } from "@/actions/executionReport.action";
import {
  ConfirmedSchedule,
  deleteSchedule,
  ValidatedSchedule,
} from "@/actions/schedules";
import { useScheduleForm } from "@/hooks/useScheduleForm";
import { ExclamationCircleIcon } from "@heroicons/react/20/solid";
import { Tab, Tabs } from "@mui/material";

import { ButtonComponent } from "../common/Button";
import ConfirmationModalComponent from "../common/confirmationModal";
import ErrorModal from "../common/ErrorModal";
import ModalComponent from "../common/Modal";
import { ExecutionReportDialog } from "./executionReportDialog/executionReportDialog";
import ExecutionReportPanelItem from "./panelItems/executionReportPanelItem";
import SchedulePanelItem from "./panelItems/schedulePanelItem";
import WorkCostPanelItem from "./panelItems/workCostPanelItem";
import ScheduleFormDialog from "./scheduleDialog/dialog";
import { useUser } from "@/contexts/userContext";

interface CustomTabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

interface TabPanelProps {
  workData: Record<string, any>;
  executionReportData: Record<string, any>[];
  options: any;
  id: string;
}

function CustomTabPanel(props: CustomTabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
      className="overflow-y-auto flex-1"
    >
      {value === index && children}
    </div>
  );
}

export default function TabPanel({
  workData,
  options,
  executionReportData,
  id,
}: TabPanelProps) {
  const { permissions } = useUser();
  const [value, setValue] = useState(0);
  const [data, setData] = useState<Record<string, any>>(workData);
  const [idSchedule, setIdSchedule] = useState<number>(0);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [editingSchedule, setEditingSchedule] = useState<any>();
  const [editingExecutionReport, setEditingExecutionReport] = useState<any>();

  const [validatedSchedule, setValidatedSchedule] = useState<
    { id: number; validate: boolean }[]
  >([]);

  const [confirmedSchedule, setConfirmedSchedule] = useState<
    { id: number; confirm: boolean }[]
  >([]);

  const [IsInsert, setIsInsert] = useState<boolean>(true);
  const [executionReportIsInsert, setExecutionReportIsInsert] =
    useState<boolean>(true);

  const [openConfirmationModal, setOpenConfimartionModal] =
    useState<boolean>(false);
  const [openConfirmationModalExecution, setOpenConfimartionModalExecution] =
    useState<boolean>(false);

  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [isExecutionDialogOpen, setIsExecutionDialogOpen] =
    useState<boolean>(false);

  const [openModal, setOpenModal] = useState<boolean>(false);

  const scheduleForm = useScheduleForm({
    data: editingSchedule,
    executionData: editingExecutionReport,
    options,
  });

  useEffect(() => {
    const tab = localStorage.getItem("tab");

    if (tab) {
      setValue(Number(tab));
    }

    if (workData) {
      setData(workData);
    }

    setValidatedSchedule(
      workData.programacoes
        .filter((item: any) => item.exec === null)
        .map((item: any) => ({
          id: item.id,
          validate: false,
        }))
    );

    setConfirmedSchedule(
      workData.programacoes
        .filter((item: any) => item.exec === null)
        .map((item: any) => ({
          id: item.id,
          confirm: false,
        }))
    );
  }, [workData]);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
    localStorage.setItem("tab", newValue.toString());
  };

  const toggleModal = () => setOpenModal((prev) => !prev);

  const handleEditSchedule = (scheduleData: any) => {
    setIsInsert(false);
    setIsDialogOpen(true);
    setExecutionReportIsInsert(true);

    const updatedSchedule = {
      ...scheduleData,
      exec: scheduleData.exec !== undefined ? String(scheduleData.exec) : "",
    };

    setEditingSchedule(updatedSchedule);
  };

  const handleEditExecutionReport = (executionReportData: any) => {
    console.log(executionReportData);
    setIsExecutionDialogOpen(true);
    setExecutionReportIsInsert(false);
    setIsInsert(false);
    setEditingExecutionReport(executionReportData);
  };

  const handleCloseDialog = () => {
    scheduleForm.resetForm();
    setIsInsert(true);
    setEditingExecutionReport(undefined);
    setEditingSchedule(undefined);
    setIsExecutionDialogOpen(false);
    setIsDialogOpen(false);
  };

  const handleExecutionReportDelete = useCallback(
    (id: number) => {
      startTransition(async () => {
        try {
          const response = await deleteExecutionReport(id, data?.id);

          if (!response.success) {
            setError(response.error);
            return;
          }

          setSuccess(response.message);
          setOpenModal(true);
          setOpenConfimartionModalExecution(false);
          setIdSchedule(0);
        } catch (error: any) {
          setError(error.message);
        }
      });
    },

    [data?.id]
  );

  const handleDelete = useCallback(
    (id: number) => {
      startTransition(async () => {
        try {
          const response = await deleteSchedule(id, data?.id);

          if (!response.success) {
            setError(response.error);
            return;
          }

          setSuccess(response.message);
          setOpenModal(true);
          setOpenConfimartionModal(false);
          setIdSchedule(0);
        } catch (error: any) {
          setError(error.message);
        }
      });
    },
    [data?.id]
  );

  const handleValidated = useCallback(() => {
    startTransition(async () => {
      try {
        const response = await ValidatedSchedule(validatedSchedule, id);

        if (!response.success) {
          setError(response.error);
          return;
        }

        setSuccess(response.message);
        setOpenModal(true);
        setOpenConfimartionModal(false);
        setIdSchedule(0);
      } catch (error: any) {
        setError(error.message);
      }
    });
  }, [id, validatedSchedule]);

  const handleConfirm = useCallback(() => {
    startTransition(async () => {
      try {
        const response = await ConfirmedSchedule(confirmedSchedule, id);

        if (!response.success) {
          setError(response.error);
          return;
        }

        setSuccess(response.message);
        setOpenModal(true);
        setOpenConfimartionModal(false);
        setIdSchedule(0);
      } catch (error: any) {
        setError(error.message);
      }
    });
  }, [confirmedSchedule, id]);

  const toggleConfimartionModal = useCallback((id: number) => {
    setIdSchedule(id);
    setOpenConfimartionModal(true);
  }, []);

  const toggleConfirmationModalExecution = useCallback((id: number) => {
    setIdSchedule(id);
    setOpenConfimartionModalExecution(true);
  }, []);

  return (
    <div className="w-full flex justify-center items-start">
      <div className="w-[95%] mx-auto max-h-[620px] shadow-lg flex flex-col overflow-hidden">
        <div className="border-b border-solid border-zinc-300">
          <div className="flex items-center justify-between">
            <Tabs
              value={value}
              onChange={handleChange}
              aria-label="basic tabs example"
              variant="scrollable"
              scrollButtons="auto"
              className="flex-1"
            >
              <Tab label="Custos" />
              <Tab label="Programações" />
              <Tab label="Relatórios execuções" />
              <Tab label="Serviços" />
            </Tabs>

            {value === 1 && (
              <div className="flex justify-center items-center flex-row">
                <div className="px-4">
                  <ButtonComponent
                    onClick={() => setIsDialogOpen(true)}
                    disabled={data.id_status === 2 || data.id_status === 3}
                    text="Nova programação"
                  />
                </div>
                <div className="px-4">
                  <ButtonComponent
                    onClick={handleValidated}
                    disabled={
                      data.id_status !== 43 ||
                      permissions?.permissao_visualizacao === "parcial"
                    }
                    text="Validar programação"
                  />
                </div>

                <div className="px-4">
                  <ButtonComponent
                    onClick={handleConfirm}
                    disabled={
                      data.id_status !== 37 ||
                      permissions?.permissao_visualizacao === "parcial"
                    }
                    text="Confirmar programação"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-1">
          <Suspense fallback={<p>carregando informações....</p>}>
            <CustomTabPanel value={value} index={0}>
              <WorkCostPanelItem data={data} />
            </CustomTabPanel>
            <CustomTabPanel value={value} index={1}>
              <SchedulePanelItem
                data={data.programacoes}
                onEdit={handleEditSchedule}
                onDelete={toggleConfimartionModal}
                statusWork={data.id_status}
                setConfirmedSchedule={setConfirmedSchedule}
                setValidatedSchedule={setValidatedSchedule}
                setData={setData}
              />
            </CustomTabPanel>
            <CustomTabPanel value={value} index={2}>
              <ExecutionReportPanelItem
                data={executionReportData}
                onDelete={toggleConfirmationModalExecution}
                onEdit={handleEditExecutionReport}
              />
            </CustomTabPanel>
            <CustomTabPanel value={value} index={3}>
              Em breve
            </CustomTabPanel>
          </Suspense>
        </div>
      </div>

      <ModalComponent title="Sucesso" onClose={toggleModal} open={openModal}>
        <span className="text-center text-lg text-gray-700 dark:text-gray-200 mb-6">
          {success}
        </span>
      </ModalComponent>

      <ConfirmationModalComponent
        idSchedule={idSchedule}
        message="Você deseja realmente excluir essa programação ?"
        onClose={() => setOpenConfimartionModal(false)}
        onConfirm={handleDelete}
        open={openConfirmationModal}
        title="Exclusão de programação"
      />

      <ConfirmationModalComponent
        idSchedule={idSchedule}
        message="Você deseja realmente excluir esse relatório ?"
        onClose={() => setOpenConfimartionModalExecution(false)}
        onConfirm={handleExecutionReportDelete}
        open={openConfirmationModalExecution}
        title="Exclusão de relatório"
      />

      <ScheduleFormDialog
        open={isDialogOpen}
        onExecutionDialogOpen={setIsExecutionDialogOpen}
        onClose={handleCloseDialog}
        idWork={data?.id}
        isInsert={IsInsert}
        onError={setError}
        onSuccess={setSuccess}
        onModalOpen={setOpenModal}
        options={options}
        scheduleForm={scheduleForm}
        statusWork={data.id_status}
      />

      <ExecutionReportDialog
        open={isExecutionDialogOpen}
        onClose={handleCloseDialog}
        idWork={data?.id}
        isInsert={IsInsert}
        executionReportIsInsert={executionReportIsInsert}
        onError={setError}
        onSuccess={setSuccess}
        onModalOpen={setOpenModal}
        scheduleForm={scheduleForm}
      />

      {error && (
        <ErrorModal
          open={true}
          message={error}
          onClose={() => setError(null)}
          icon={<ExclamationCircleIcon width={48} height={48} />}
        />
      )}
    </div>
  );
}
