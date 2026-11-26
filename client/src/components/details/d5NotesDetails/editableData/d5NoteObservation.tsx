"use client";

import { useD5NoteEdit } from "@/hooks/useD5Edit";

export function D5NoteObservation() {
  const { form, setField, readOnly } = useD5NoteEdit();

  return (
    <div className="flex h-16 min-w-0 items-stretch rounded-md border border-solid border-zinc-700">
      <label
        htmlFor="observacao"
        className="flex w-32 shrink-0 items-center justify-center border-r border-solid border-zinc-700 px-2 text-center text-sm font-semibold md:text-base xl:text-lg"
      >
        Observação
      </label>

      <textarea
        id="observacao"
        name="observacao"
        rows={3}
        value={form.observacao}
        readOnly={readOnly}
        onChange={(e) => setField("observacao", e.target.value)}
        className="min-h-16 min-w-0 flex-1 resize-y bg-transparent p-2 text-left text-base font-medium focus:outline-none md:text-lg"
      />
    </div>
  );
}
