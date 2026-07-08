import { DisplayFile, ExistingFile } from "@/types/feasibility";

export type FeasibilityWorkflowStatus = "adicao" | "aprovacao" | "aprovado";

export const FEASIBILITY_STATUS_WORK_ADICAO = ["45", "42"];
export const FEASIBILITY_STATUS_WORK_APROVACAO = "46";

export function getFeasibilityWorkflowStatus(
  idStatus: string | number,
): FeasibilityWorkflowStatus {
  const value = String(idStatus);

  if (FEASIBILITY_STATUS_WORK_ADICAO.find((item) => item === value))
    return "adicao";
  if (value === FEASIBILITY_STATUS_WORK_APROVACAO) return "aprovacao";
  return "aprovado";
}

export function existingToDisplay(file: ExistingFile): DisplayFile {
  const name = file.caminho_arquivo.split("/").pop() ?? file.caminho_arquivo;

  return {
    name,
    size: null,
    remoteId: file.id,
  };
}

export function fileToDisplay(file: File): DisplayFile {
  return {
    name: file.name,
    size: file.size,
    raw: file,
  };
}
