import { Tab, Tabs } from "@mui/material";
import { memo, SyntheticEvent } from "react";

import { ButtonComponent } from "@/components/common/Button";

export const TAB_SCHEDULES = 0;
export const TAB_REJECTED = 1;

interface D5TabActionsProps {
  valueTab: number;
  handleChange: (
    event: SyntheticEvent<Element, Event>,
    newValue: number,
  ) => void;
  onNewSchedule: () => void;
  onRejectSchedules: () => void;
  schedulesCount: number;
  rejectedCount: number;
}

const D5TabActions = memo(
  ({
    valueTab,
    handleChange,
    onNewSchedule,
    onRejectSchedules,
    schedulesCount,
    rejectedCount,
  }: D5TabActionsProps) => {
    return (
      <div className="flex shrink-0 items-center justify-between border-b border-solid border-zinc-300">
        <Tabs
          value={valueTab}
          onChange={handleChange}
          aria-label="Abas de programações da nota D5"
          variant="scrollable"
          scrollButtons="auto"
          className="min-w-0 flex-1"
        >
          <Tab
            value={TAB_SCHEDULES}
            label={`Programações (${schedulesCount})`}
            className="xl:text-lg"
          />
          <Tab
            value={TAB_REJECTED}
            label={`Reprovações (${rejectedCount})`}
            className="xl:text-lg"
          />
        </Tabs>

        {valueTab === TAB_SCHEDULES && (
          <div className="flex shrink-0 items-center gap-2 px-4">
            <ButtonComponent
              onClick={onRejectSchedules}
              text="Reprovar programações"
            />
            <ButtonComponent onClick={onNewSchedule} text="Nova programação" />
          </div>
        )}
      </div>
    );
  },
);

D5TabActions.displayName = "D5TabActions";

export default D5TabActions;
