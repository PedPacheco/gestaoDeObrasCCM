import {
  useCallback,
  useState,
  startTransition,
  useRef,
  ChangeEvent,
} from "react";
import { useRouter } from "next/navigation";

import {
  deleteAllServices,
  deleteService,
  importServicesSpreadsheet,
} from "@/actions/services";

import { useFeedback } from "@/hooks/useFeedback";

interface UseReviewActionsProps {
  workId: number;
  clearStorage: () => void;
  removeStorageItem: (id: number) => void;
  readOnly: boolean;
}

export function useReviewActions({
  workId,
  clearStorage,
  removeStorageItem,
  readOnly = false,
}: UseReviewActionsProps) {
  const router = useRouter();

  const { showSuccess, showError } = useFeedback();

  const [importing, setImporting] = useState(false);

  const importInputRef = useRef<HTMLInputElement>(null);

  const handleImportClick = () => {
    if (readOnly || importing) return;
    importInputRef.current?.click();
  };

  const importSpreadsheet = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      setImporting(true);

      try {
        const file = event.target.files?.[0];
        event.target.value = "";

        if (!file) return;

        setImporting(true);

        const formData = new FormData();
        formData.append("file", file);

        const response = await importServicesSpreadsheet(workId, formData);

        if (!response.success) {
          showError(
            response.error || "Erro ao importar planilha ponto a ponto",
          );

          return false;
        }

        showSuccess("Serviços/materiais importados com sucesso", () => {
          startTransition(() => {
            router.refresh();
          });
        });

        return true;
      } catch (error: any) {
        showError(error?.message || "Erro ao importar planilha ponto a ponto");

        return false;
      } finally {
        setImporting(false);
      }
    },
    [router, showError, showSuccess, workId],
  );

  const deleteItem = useCallback(
    async (id: number) => {
      const response = await deleteService(id, workId);

      if (!response.success) {
        showError(response.error);

        return false;
      }

      showSuccess(
        response.message || "Serviço/material removido com sucesso",
        () => {
          startTransition(() => {
            removeStorageItem(id);

            router.refresh();
          });
        },
      );

      return true;
    },
    [router, workId, removeStorageItem, showError, showSuccess],
  );

  const deleteAll = useCallback(async () => {
    try {
      const response = await deleteAllServices(workId);

      if (!response.success) {
        showError(response.error);

        return false;
      }

      showSuccess(
        response.message || "Serviços/materiais removidos com sucesso",
        () => {
          startTransition(() => {
            clearStorage();

            router.refresh();
          });
        },
      );

      return true;
    } catch (error: any) {
      showError(error?.message || "Erro ao remover serviços/materiais");

      return false;
    }
  }, [router, workId, clearStorage, showError, showSuccess]);

  return {
    importInputRef,
    importing,
    importSpreadsheet,
    deleteItem,
    deleteAll,
    handleImportClick,
  };
}
