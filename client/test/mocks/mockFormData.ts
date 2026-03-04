import { ExecutionReportData } from "@/hooks/useExecutionServicesForm";

export const mockExecutionReport: ExecutionReportData = {
  id: 1,
  idUser: 10,
  supervisor: "Carlos Silva",
  partialConnectionReleased: true,
  startTime: "08:00",
  finishTime: "17:30",
  startContact: "07:50",
  endContact: "17:45",
  delayJustification: "Atraso devido a condições climáticas",
  hasEquipmentInstalled: true,
  appliedEquipment: [
    {
      equipment: "Transformador 75kVA",
      power: "75",
      patrimony: "PAT-001",
      installation: "Poste 12",
      type: "DEFAULT",
    },
    {
      equipment: "Chave Fusível",
      power: "15",
      patrimony: "PAT-002",
      installation: "Poste 14",
      type: "CS",
    },
  ],
  hasEquipmentRemoved: true,
  equipmentRemoved: [
    {
      equipment: "Transformador 50kVA",
      power: "50",
      patrimony: "PAT-010",
      installation: "Poste 08",
      type: "DEFAULT",
    },
  ],
  changesExecution: true,
  generalObservation: "Execução realizada conforme planejamento atualizado.",
  reason: "Mudança de escopo solicitada pelo cliente",
  provisionalKeyInstalled: true,
  provisionalKeyReference: "CK-12345",
  provisionalKeyWithdrawn: false,
  provisionalKeyReferenceWithdrawn: "",
};

export const mockExecutionReportMinimal = {
  id: 2,
  idUser: 20,
  supervisor: "",
  partialConnectionReleased: false,
  startTime: "09:00",
  finishTime: "12:00",
  hasEquipmentInstalled: false,
  appliedEquipment: [],
  hasEquipmentRemoved: false,
  equipmentRemoved: [],
  changesExecution: false,
  provisionalKeyInstalled: false,
};
