export type ValidateSchedulesInput = {
  id: number;
  validate: boolean;
};

export type ConfirmSchedulesInput = {
  id: number;
  confirm: boolean;
};

export type RejectScheduleInput = {
  id: number;
  reject: boolean;
  reason: string;
  description: string;
};
