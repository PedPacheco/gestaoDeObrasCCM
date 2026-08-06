"use client";

import { useCallback, useMemo, useState } from "react";

export type ValidationStatus =
  | "completo"
  | "reprogramar"
  | "sem-realizacao"
  | null;

interface ServiceToValidate {
  id: number;
  prog: number;
  qtdeRealizada: string | null;
  validationStatus?: ValidationStatus;
}

interface StoredValidation {
  isValidated: boolean;
  status: Record<number, ValidationStatus>;
}

const STORAGE_PREFIX = "scheduled-services-validation";

function getStorageKey(idSchedule: number) {
  return `${STORAGE_PREFIX}:${idSchedule}`;
}

function loadFromStorage(idSchedule: number): StoredValidation | null {
  if (typeof window === "undefined") return null;

  const raw = localStorage.getItem(getStorageKey(idSchedule));
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveToStorage(idSchedule: number, data: StoredValidation) {
  if (typeof window === "undefined") return;
  localStorage.setItem(getStorageKey(idSchedule), JSON.stringify(data));
}

export function usePersistentServiceValidation(idSchedule?: number | null) {
  const [isValidated, setIsValidated] = useState(false);

  const hydrateStatuses = useCallback(
    <T extends { id: number; validationStatus?: ValidationStatus }>(
      services: T[],
    ): T[] => {
      if (!idSchedule) return services;

      const stored = loadFromStorage(idSchedule);
      if (!stored) return services;

      setIsValidated(stored.isValidated);

      return services.map((service) => ({
        ...service,
        validationStatus: stored.status[service.id] ?? null,
      }));
    },
    [idSchedule],
  );

  const validateServices = useCallback(
    <T extends ServiceToValidate>(services: T[]): T[] => {
      if (!idSchedule) return services;

      const newStatuses: Record<number, ValidationStatus> = {};

      const updatedServices = services.map((service) => {
        const real = service.qtdeRealizada?.toString();
        const plan = service.prog;

        let status: ValidationStatus;

        if (real && real === "0") {
          status = "sem-realizacao";
        } else if (Number(real) < plan || !real) {
          status = "reprogramar";
        } else {
          status = "completo";
        }

        newStatuses[service.id] = status;

        return {
          ...service,
          validationStatus: status,
        };
      });

      saveToStorage(idSchedule, { isValidated: true, status: newStatuses });

      setIsValidated(true);

      return updatedServices;
    },
    [idSchedule],
  );

  const buildSummary = useCallback(
    (services: { validationStatus?: ValidationStatus }[]) => {
      return services.reduce(
        (acc, service) => {
          if (service.validationStatus === "completo") acc.completo++;
          if (service.validationStatus === "reprogramar") acc.reprogramar++;
          if (service.validationStatus === "sem-realizacao")
            acc.semRealizacao++;
          return acc;
        },
        {
          completo: 0,
          reprogramar: 0,
          semRealizacao: 0,
        },
      );
    },
    [],
  );

  const clearValidation = useCallback(() => {
    if (!idSchedule) return;

    localStorage.removeItem(getStorageKey(idSchedule));
    setIsValidated(false);
  }, [idSchedule]);

  return {
    hydrateStatuses,
    validateServices,
    buildSummary,
    clearValidation,
    isValidated,
  };
}
