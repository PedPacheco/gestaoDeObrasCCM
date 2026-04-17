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
    newValue: number,
  ) => void;
  feasibilityExists: any[];
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
    feasibilityExists,
  }: TabActionsProps) => {
    return (
      <div className="flex items-center justify-between">
        <Tabs
          value={valueTab}
          onChange={handleChange}
          aria-label="basic tabs example"
          variant="scrollable"
          scrollButtons="auto"
          className="flex-1 mt-4"
        >
          <Tab label="Custos" className="xl:text-lg" />
          <Tab label="Programações" className="xl:text-lg" />
          <Tab label="Reprovações" className="xl:text-lg" />
          <Tab label="Relatórios execuções" className="xl:text-lg" />
          <Tab label="Restrições Publicação" className="xl:text-lg" />
          <Tab label="Serviços" className="xl:text-lg" />
        </Tabs>

        {valueTab === 1 && (
          <div className="flex justify-center items-center flex-row">
            <div className="px-4 mt-2">
              <ButtonComponent
                onClick={onNewSchedule}
                disabled={
                  statusWork === 2 ||
                  statusWork === 3 ||
                  feasibilityExists?.length === 0 ||
                  permissions.permissao === "Sem permissão"
                }
                text="Nova programação"
              />
            </div>
            <div className="px-4 mt-2">
              <ButtonComponent
                onClick={onRejected}
                disabled={
                  statusWork === 2 ||
                  statusWork === 3 ||
                  permissions?.permissao_visualizacao === "parcial" ||
                  permissions.permissao === "Sem permissão"
                }
                text="Reprovar programação"
              />
            </div>
            <div className="px-4 mt-2">
              <ButtonComponent
                onClick={onValidate}
                disabled={
                  statusWork !== 43 ||
                  permissions?.permissao_visualizacao === "parcial" ||
                  permissions.permissao === "Sem permissão"
                }
                text="Validar programação"
              />
            </div>

            <div className="px-4 mt-2">
              <ButtonComponent
                onClick={onConfirm}
                disabled={
                  statusWork !== 37 ||
                  permissions?.permissao_visualizacao === "parcial" ||
                  permissions.permissao === "Sem permissão"
                }
                text="Confirmar programação"
              />
            </div>
          </div>
        )}
      </div>
    );
  },
);

TabActions.displayName = "TabActions";

export default TabActions;
