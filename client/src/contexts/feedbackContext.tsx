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
        <ModalComponent open={true} onClose={close}>
          <div className="flex flex-col items-center text-center px-6">
            {/* Ícone */}
            <div className="flex items-center justify-center rounded-full bg-green-100 p-4 dark:bg-green-900/30">
              <svg
                className="h-10 w-10 text-green-600 dark:text-green-400"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>

            {/* Título */}
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-2">
              Operação realizada com sucesso
            </h2>

            {/* Mensagem */}
            <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-md">
              {feedback.message}
            </p>
          </div>
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
