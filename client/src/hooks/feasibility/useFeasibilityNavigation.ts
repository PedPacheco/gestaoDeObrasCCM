import { SectionStatus } from "@/components/feasibility/feasibilityImport";
import { FeasibilityWorkflowStatus } from "@/utils/feasibilityWorkflow";
import {
  ArchiveBoxIcon,
  CheckBadgeIcon,
  ClipboardDocumentCheckIcon,
  DocumentArrowUpIcon,
  PlusCircleIcon,
} from "@heroicons/react/20/solid";
import {
  ForwardRefExoticComponent,
  RefAttributes,
  SVGProps,
  useMemo,
} from "react";

interface useFeasibilityNavigationProps {
  workflowStatus: FeasibilityWorkflowStatus;
  pointByPoint: boolean;
  isEditable: boolean;
  uploadStatus: SectionStatus;
  reviewStatus: SectionStatus | undefined;
  hasRejections: boolean;
}

type HeroIcon = ForwardRefExoticComponent<
  Omit<SVGProps<SVGSVGElement>, "ref"> & {
    title?: string;
    titleId?: string;
  } & RefAttributes<SVGSVGElement>
>;

export interface NavSection {
  id: string;
  label: string;
  icon: HeroIcon;
}

export function useFeasibilityNavigation({
  isEditable,
  pointByPoint,
  workflowStatus,
  uploadStatus,
  reviewStatus,
  hasRejections,
}: useFeasibilityNavigationProps) {
  const navSections: NavSection[] = useMemo(
    () => [
      { id: "upload", label: "Arquivos", icon: DocumentArrowUpIcon },
      ...(isEditable && pointByPoint
        ? [
            {
              id: "itens-adicionais",
              label: "Itens adicionais",
              icon: PlusCircleIcon,
            },
          ]
        : []),
      ...(pointByPoint
        ? [
            {
              id: "revisao",
              label: "Revisão",
              icon: ClipboardDocumentCheckIcon,
            },
          ]
        : []),
      ...(workflowStatus === "aprovacao"
        ? [{ id: "aprovacao", label: "Aprovação", icon: CheckBadgeIcon }]
        : []),
      { id: "reprovacoes", label: "Reprovações", icon: ArchiveBoxIcon },
    ],
    [isEditable, pointByPoint, workflowStatus],
  );

  const statusById: Record<string, SectionStatus | undefined> = useMemo(
    () => ({
      upload: uploadStatus,
      "itens-adicionais": "pending",
      revisao: reviewStatus,
      aprovacao: workflowStatus === "aprovacao" ? "attention" : undefined,
      reprovacoes: hasRejections ? "attention" : undefined,
    }),
    [uploadStatus, reviewStatus, workflowStatus, hasRejections],
  );

  const stepSections = useMemo(
    () => navSections.filter((section) => section.id !== "reprovacoes"),
    [navSections],
  );

  const completedCount = useMemo(
    () =>
      stepSections.filter((section) => statusById[section.id] === "complete")
        .length,
    [statusById, stepSections],
  );

  return { navSections, statusById, stepSections, completedCount };
}
