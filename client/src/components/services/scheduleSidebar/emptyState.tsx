import { ClipboardDocumentListIcon } from "@heroicons/react/20/solid";

interface EmptyStateProps {
  message: string;
}

export function EmptyState({ message }: EmptyStateProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center text-gray-400">
      <ClipboardDocumentListIcon className="h-8 w-8 opacity-40" />
      <p className="text-xs">{message}</p>
    </div>
  );
}
