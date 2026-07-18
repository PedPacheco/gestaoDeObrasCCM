import { FeedbackContext } from "@/contexts/feedbackContext";
import { useContext } from "react";

export function useFeedback() {
  const context = useContext(FeedbackContext);

  if (!context) {
    throw new Error("useFeedback must be used within FeedbackProvider");
  }

  return context;
}
