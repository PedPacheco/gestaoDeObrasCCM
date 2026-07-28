import { DisplayFile, FeasibilityDataInterface } from "@/types/feasibility";

export type FeasibilityWorkflowStatus = "adicao" | "aprovacao" | "aprovado";

export const FEASIBILITY_STATUS_WORK_ADICAO = ["45", "42"];
export const FEASIBILITY_STATUS_WORK_APROVACAO = "46";

export function getFeasibilityWorkflowStatus(
  idStatus: string | number,
  feasibilityDate: string | null,
  feasibilityStatus: string | null,
  feasibilityAproved: boolean,
): FeasibilityWorkflowStatus {
  const value = String(idStatus);

  const feasibilityNotSent =
    feasibilityDate === null && feasibilityStatus === "FALTA VIABILIDADE";

  if (
    FEASIBILITY_STATUS_WORK_ADICAO.find((item) => item === value) &&
    feasibilityNotSent &&
    !feasibilityAproved
  )
    return "adicao";
  if (!feasibilityNotSent && !feasibilityAproved) return "aprovacao";

  return "aprovado";
}

export function existingToDisplay(filename: string): DisplayFile {
  return {
    name: filename,
    size: null,
  };
}

export function fileToDisplay(file: File): DisplayFile {
  return {
    name: file.name,
    size: file.size,
    raw: file,
  };
}
