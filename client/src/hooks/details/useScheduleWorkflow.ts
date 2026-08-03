"use client";

import { useState, useCallback, useMemo } from "react";

interface UseScheduleWorkflowProps {
  selectedServices: any[];
}

export function useScheduleWorkflow({
  selectedServices,
}: UseScheduleWorkflowProps) {
  // ── Team modal ───────────────────────────────────────────
  const [teamModalOpen, setTeamModalOpen] = useState(false);
  const [teamModalTarget, setTeamModalTarget] = useState<any[]>([]);

  const openTeamModal = useCallback((services: any[]) => {
    setTeamModalTarget(services);
    setTeamModalOpen(true);
  }, []);

  const closeTeamModal = useCallback(() => {
    setTeamModalOpen(false);
    setTeamModalTarget([]);
  }, []);

  // ── Sidebar summary ─────────────────────────────────────
  const selectedCount = selectedServices.length;

  const servicesWithTeam = useMemo(
    () => selectedServices.filter((s) => s.id_equipe || s.equipe),
    [selectedServices],
  );

  const servicesWithoutTeam = useMemo(
    () => selectedServices.filter((s) => !s.id_equipe && !s.equipe),
    [selectedServices],
  );

  const canCreate = selectedCount > 0;

  return {
    // Team modal
    teamModalOpen,
    teamModalTarget,
    openTeamModal,
    closeTeamModal,

    // Sidebar / summary
    selectedCount,
    servicesWithTeam,
    servicesWithoutTeam,

    // Validation
    canCreate,
  };
}
