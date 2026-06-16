import { ButtonComponent } from "@/components/common/Button";
import { Tab, Tabs } from "@mui/material";
import { memo, SyntheticEvent } from "react";

interface TabActionsProps {
  statusWork: number;
  permissions: any;
  onNewSchedule: (scheduleData: any) => Promise<void> | void;
  onValidate: () => void;
  onConfirm: () => void;
  onRejected: () => void;
  valueTab: number;
  handleChange: (
    event: SyntheticEvent<Element, Event>,
    newValue: number,
  ) => void;
  feasibilityExists: any[];
  canSeeTabs: boolean;
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
    canSeeTabs,
  }: TabActionsProps) => {
    const canValidateOrConfirm =
      permissions?.permissao_edicao && permissions?.tipo_usuario !== "PARCEIRA";

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
          {canSeeTabs && (
            <Tab value={0} label="Custos" className="xl:text-lg" />
          )}
          <Tab value={1} label="Programações" className="xl:text-lg" />
          <Tab value={2} label="Reprovações" className="xl:text-lg" />
          <Tab value={3} label="Relatórios execuções" className="xl:text-lg" />
          <Tab value={4} label="Restrições Publicação" className="xl:text-lg" />
          {canSeeTabs && (
            <Tab value={5} label="Serviços" className="xl:text-lg" />
          )}
        </Tabs>

        {valueTab === 1 && canSeeTabs && (
          <div className="flex justify-center items-center flex-row">
            <div className="px-4 mt-2">
              <ButtonComponent
                onClick={onNewSchedule}
                disabled={
                  statusWork === 2 ||
                  statusWork === 3 ||
                  feasibilityExists?.length === 0 ||
                  !permissions.permissao_edicao
                }
                text="Nova programação"
              />
            </div>
            <div className="px-4 mt-2">
              <ButtonComponent
                onClick={onRejected}
                disabled={
                  statusWork === 2 || statusWork === 3 || !canValidateOrConfirm
                }
                text="Reprovar programação"
              />
            </div>
            <div className="px-4 mt-2">
              <ButtonComponent
                onClick={onValidate}
                disabled={statusWork !== 43 || !canValidateOrConfirm}
                text="Validar programação"
              />
            </div>

            <div className="px-4 mt-2">
              <ButtonComponent
                onClick={onConfirm}
                disabled={statusWork !== 37 || !canValidateOrConfirm}
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
