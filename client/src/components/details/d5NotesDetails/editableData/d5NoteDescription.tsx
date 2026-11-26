interface D5NoteDescriptionProps {
  value?: string | null;
}

export default function D5NoteDescription({ value }: D5NoteDescriptionProps) {
  return (
    <div className="flex h-16 min-w-0 items-stretch rounded-md border border-solid border-zinc-700">
      <label
        htmlFor="descricao"
        className="flex w-32 shrink-0 items-center justify-center border-r border-solid border-zinc-700 px-2 text-center text-sm font-semibold md:text-base xl:text-lg"
      >
        Descrição
      </label>

      <textarea
        id="descricao"
        name="descricao"
        rows={3}
        value={value ?? ""}
        readOnly
        className="min-h-16 min-w-0 flex-1 resize-y bg-transparent p-2 text-left text-base font-medium focus:outline-none md:text-lg "
      />
    </div>
  );
}
