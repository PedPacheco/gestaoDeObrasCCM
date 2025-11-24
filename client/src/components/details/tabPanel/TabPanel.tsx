"use client";

import {
  startTransition,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { useScheduleForm } from "@/hooks/useScheduleForm";
import { useScheduleHandlers } from "@/hooks/useScheduleHandlers";
import { useUser } from "@/contexts/userContext";
import { ModalsManager, ModalsManagerRef } from "../modals/detailsModals";
import TabActions from "./tabsActions";
import WorkCostPanelItem from "../panelItems/workCostPanelItem";
import SchedulePanelItem from "../panelItems/schedulePanelItem";
import ExecutionReportPanelItem from "../panelItems/executionReportPanelItem";
import { Paper } from "@mui/material";

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

function CustomTabPanel({
  children,
  value,
  index,
  ...other
}: CustomTabPanelProps) {
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
  const modalsRef = useRef<ModalsManagerRef>(null);

  const [value, setValue] = useState(0);
  const [data, setData] = useState<Record<string, any>>(workData);

  const [editingSchedule, setEditingSchedule] = useState<any>();
  const [editingExecutionReport, setEditingExecutionReport] = useState<any>();

  const [isInsert, setIsInsert] = useState(true);
  const [executionReportIsInsert, setExecutionReportIsInsert] = useState(true);

  const scheduleForm = useScheduleForm({
    data: editingSchedule,
    executionData: editingExecutionReport,
    options,
  });

  const {
    handleConfirm,
    handleDelete,
    handleExecutionReportDelete,
    handleValidated,
    handleReject,
    rejectedSchedule,
    setConfirmedSchedule,
    setValidatedSchedule,
    setRejectedSchedule,
  } = useScheduleHandlers({
    data,
    idWork: id,
    setError: (msg) => modalsRef.current?.showError(msg),
    setSuccess: (msg) => modalsRef.current?.showSuccess(msg),
  });

  useEffect(() => {
    const tab = localStorage.getItem("tab");
    if (tab) setValue(Number(tab));
  }, []);

  useEffect(() => {
    if (workData) setData(workData);
  }, [workData]);

  const handleChange = (_: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
    localStorage.setItem("tab", newValue.toString());
  };

  const handleEditSchedule = (scheduleData: any) => {
    setIsInsert(false);
    modalsRef.current?.handleDialog(true);
    setExecutionReportIsInsert(true);

    setEditingSchedule({
      ...scheduleData,
      exec: scheduleData.exec !== undefined ? String(scheduleData.exec) : "",
    });
  };

  const handleEditExecutionReport = (executionData: any) => {
    modalsRef.current?.handleExecutionDialog(true);
    setExecutionReportIsInsert(false);
    setIsInsert(false);
    setEditingExecutionReport(executionData);
  };

  const handleCloseDialog = () => {
    scheduleForm.resetForm();
    setIsInsert(true);
    setEditingExecutionReport(undefined);
    setEditingSchedule(undefined);
    modalsRef.current?.handleExecutionDialog(false);
    modalsRef.current?.handleDialog(false);
  };

  return (
    <div className="w-full xl:h-full flex justify-center items-start">
      <div className="w-[95%] mx-auto max-h-[620px] xl:max-h-full xl:h-[90%] shadow-lg flex flex-col">
        <div className="border-b border-solid border-zinc-300">
          <TabActions
            onConfirm={handleConfirm}
            onValidate={handleValidated}
            onRejected={() => modalsRef.current?.handleRejectedModalOpen(true)}
            onNewSchedule={() => modalsRef.current?.handleDialog(true)}
            permissions={permissions}
            statusWork={data?.id_status}
            valueTab={value}
            handleChange={handleChange}
          />
        </div>

        <div className="flex flex-1 overflow-auto">
          <Suspense fallback={<p>carregando informações....</p>}>
            <CustomTabPanel value={value} index={0}>
              <WorkCostPanelItem data={data} />
            </CustomTabPanel>

            <CustomTabPanel value={value} index={1}>
              <SchedulePanelItem
                data={data.programacoes}
                onEdit={handleEditSchedule}
                onDelete={(id) =>
                  modalsRef.current?.openConfirmDeleteSchedule(id)
                }
                statusWork={data.id_status}
                setConfirmedSchedule={setConfirmedSchedule}
                setValidatedSchedule={setValidatedSchedule}
                setRejectedSchedule={setRejectedSchedule}
                setData={setData}
              />
            </CustomTabPanel>

            <CustomTabPanel value={value} index={2}>
              <ExecutionReportPanelItem
                data={executionReportData}
                onDelete={(id) =>
                  modalsRef.current?.openConfirmDeleteExecution(id)
                }
                onEdit={handleEditExecutionReport}
              />
            </CustomTabPanel>

            <CustomTabPanel value={value} index={3}>
              Em breve
            </CustomTabPanel>
          </Suspense>
        </div>
      </div>

      <ModalsManager
        ref={modalsRef}
        idWork={data?.id}
        statusWork={data.id_status}
        options={options}
        scheduleForm={scheduleForm}
        isInsert={isInsert}
        rejectedSchedule={rejectedSchedule}
        handleReject={handleReject}
        executionReportIsInsert={executionReportIsInsert}
        onCloseDialog={handleCloseDialog}
        onConfirmDelete={handleDelete}
        onConfirmExecutionDelete={handleExecutionReportDelete}
      />
    </div>
  );
}
