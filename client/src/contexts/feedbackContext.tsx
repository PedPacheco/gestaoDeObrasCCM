"use client";

import {
  createContext,
  useCallback,
  useMemo,
  useState,
  ReactNode,
} from "react";
import { ExclamationCircleIcon } from "@heroicons/react/20/solid";
import ModalComponent from "@/components/common/Modal";
import ErrorModal from "@/components/common/ErrorModal";

type FeedbackType = "success" | "error";

interface FeedbackState {
  type: FeedbackType;
  message: string;
  onClose?: () => void;
}

interface FeedbackContextValue {
  showSuccess: (message: string, onClose?: () => void) => void;
  showError: (message: string) => void;
}

export const FeedbackContext = createContext<FeedbackContextValue | null>(null);

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);

  const showSuccess = useCallback((message: string, onClose?: () => void) => {
    setFeedback({ type: "success", message, onClose });
  }, []);

  const showError = useCallback((message: string) => {
    setFeedback({ type: "error", message });
  }, []);

  const close = useCallback(() => {
    if (feedback?.onClose) {
      feedback.onClose();
    }

    setFeedback(null);
  }, [feedback]);

  const value = useMemo(
    () => ({
      showSuccess,
      showError,
    }),
    [showSuccess, showError],
  );

  return (
    <FeedbackContext.Provider value={value}>
      {children}

      {feedback?.type === "success" && (
        <ModalComponent title="Sucesso" open={true} onClose={close}>
          <span className="text-center text-lg text-gray-700 dark:text-gray-200 mb-6">
            {feedback.message}
          </span>
        </ModalComponent>
      )}

      {feedback?.type === "error" && (
        <ErrorModal
          open={true}
          message={feedback.message}
          onClose={close}
          icon={<ExclamationCircleIcon width={48} height={48} />}
        />
      )}
    </FeedbackContext.Provider>
  );
}
