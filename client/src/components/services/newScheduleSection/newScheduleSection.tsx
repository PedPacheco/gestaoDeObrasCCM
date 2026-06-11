"use client";

import React from "react";
import { useUser } from "@/contexts/userContext";
import { ScheduleDataCard } from "./scheduleDataCard";

interface ScheduleSectionProps {
  isInsert: boolean;
  scheduleForm: any;
  options: {
    tecnico: Array<{ id: number; tecnico: string }>;
    restricao: Array<{ id: number; restricao: string; tipo_restricao: string }>;
  };
  statusWork: number;
}

export function NewScheduleSection({
  scheduleForm,
  isInsert,
  options,
  statusWork,
}: ScheduleSectionProps) {
  const { permissions } = useUser();

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
    <ScheduleDataCard
      formData={scheduleForm.formData}
      formErrors={scheduleForm.formErrors}
      disabledFields={disabledFields}
      onInputChange={scheduleForm.handleInputChange}
      options={options}
    />
  );
}
