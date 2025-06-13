"use client";

import { Tab, Tabs } from "@mui/material";
import { Suspense, useEffect, useState } from "react";
import WorkCostPanelItem from "./panelItems/workCostPanelItem";
import SchedulePanelItem from "./panelItems/schedulePanelItem";
import { ButtonComponent } from "../common/Button";
import ScheduleFormDialog from "./dialog";
import ErrorModal from "../common/ErrorModal";
import { ExclamationCircleIcon } from "@heroicons/react/20/solid";
import ModalComponent from "../common/Modal";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function CustomTabPanel(props: TabPanelProps) {
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

export default function TabPanel({ props }: Record<string, any>) {
  const [value, setValue] = useState(0);
  const [data, setData] = useState<Record<string, any>>(props);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [openModal, setOpenModal] = useState<boolean>(false);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  const toggleDialog = () => setIsDialogOpen((prev) => !prev);
  const toggleModal = () => setOpenModal((prev) => !prev);

  useEffect(() => {
    if (props) {
      setData(props);
    }
  }, [props]);

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
              <Tab label="Serviços" />
            </Tabs>

            {value === 1 && (
              <div className="px-4">
                <ButtonComponent
                  onClick={toggleDialog}
                  text="Nova programação"
                />
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
              <SchedulePanelItem data={data.programacoes} />
            </CustomTabPanel>
            <CustomTabPanel value={value} index={2}>
              Item four
            </CustomTabPanel>
          </Suspense>
        </div>
      </div>

      <ModalComponent title="Sucesso" onClose={toggleModal} open={openModal}>
        <span className="font-semibold text-xl">{success}</span>
      </ModalComponent>

      <ScheduleFormDialog
        open={isDialogOpen}
        onClose={toggleDialog}
        idWork={data?.id}
        IsInsert={true}
        setError={setError}
        setSuccess={setSuccess}
        setOpenModal={setOpenModal}
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
