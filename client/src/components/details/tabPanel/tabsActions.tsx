import { ButtonComponent } from "@/components/common/Button";
import { Tab, Tabs } from "@mui/material";
import { memo, SyntheticEvent } from "react";

interface TabActionsProps {
  statusWork: number;
  permissions: any;
  onNewSchedule: () => void;
  onValidate: () => void;
  onConfirm: () => void;
  onRejected: () => void;
  valueTab: number;
  handleChange: (
    event: SyntheticEvent<Element, Event>,
    newValue: number
  ) => void;
}

const TabActions = memo(
  ({
    statusWork,
    permissions,
    handleChange,
    onValidate,
    onConfirm,
    onRejected,
    onNewSchedule,
    valueTab,
  }: TabActionsProps) => {
    return (
      <div className="flex items-center justify-between">
        <Tabs
          value={valueTab}
          onChange={handleChange}
          aria-label="basic tabs example"
          variant="scrollable"
          scrollButtons="auto"
          className="flex-1"
        >
          <Tab label="Custos" className="xl:text-lg" />
          <Tab label="Programações" className="xl:text-lg" />
          <Tab label="Relatórios execuções" className="xl:text-lg" />
          <Tab label="Serviços" className="xl:text-lg" />
        </Tabs>

        {valueTab === 1 && (
          <div className="flex justify-center items-center flex-row">
            <div className="px-4">
              <ButtonComponent
                onClick={onNewSchedule}
                disabled={statusWork === 2 || statusWork === 3}
                text="Nova programação"
              />
            </div>
            <div className="px-4">
              <ButtonComponent
                onClick={onRejected}
                disabled={
                  statusWork !== 43 ||
                  permissions?.permissao_visualizacao === "parcial"
                }
                text="Reprovar programação"
              />
            </div>
            <div className="px-4">
              <ButtonComponent
                onClick={onValidate}
                disabled={
                  statusWork !== 43 ||
                  permissions?.permissao_visualizacao === "parcial"
                }
                text="Validar programação"
              />
            </div>

            <div className="px-4">
              <ButtonComponent
                onClick={onConfirm}
                disabled={
                  statusWork !== 37 ||
                  permissions?.permissao_visualizacao === "parcial"
                }
                text="Confirmar programação"
              />
            </div>
          </div>
        )}
      </div>
    );
  }
);

TabActions.displayName = "TabActions";

export default TabActions;
