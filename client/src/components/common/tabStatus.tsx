"use client";

import { LoadingComponent } from "./Loading";

export function TabLoading({ message }: { message: string }) {
  return (
    <div className="flex flex-1 items-center justify-center py-24">
      <div className="flex flex-col items-center gap-2">
        <div className="h-5 overflow-hidden flex items-center justify-center">
          <LoadingComponent color="text-black" />
        </div>
        <span className="text-sm text-zinc-500">{message}</span>
      </div>
    </div>
  );
}

export function TabError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 py-24">
      <span className="text-sm text-zinc-600">
        Não foi possível carregar os dados desta secção.
      </span>
      <button
        onClick={onRetry}
        className="rounded-lg bg-[#1e2f42] px-4 py-2 text-sm font-semibold text-white hover:bg-[#192535]"
      >
        Tentar novamente
      </button>
    </div>
  );
}
