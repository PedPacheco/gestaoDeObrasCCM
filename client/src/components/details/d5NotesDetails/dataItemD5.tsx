"use client";

import { formatDateToInput } from "@/utils/formatValue";
import { ReactNode, useEffect, useId, useState } from "react";

export type FieldVariant = "read" | "edit";

interface FieldShellProps {
  label?: string;
  labelId?: string;
  children: ReactNode;
  variant?: FieldVariant;
  /** ocupa altura automática (observação) */
  auto?: boolean;
  trailing?: ReactNode;
  className?: string;
  disabled?: boolean;
}

export function FieldShell({
  label,
  labelId,
  children,
  variant = "read",
  auto = false,
  trailing,
  className = "",
  disabled,
}: FieldShellProps) {
  const isEdit = variant === "edit";

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div
      className={`group flex w-full flex-col rounded-lg border border-solid border-zinc-700 px-3 py-1.5 transition-colors
        ${auto ? "min-h-[4.25rem]" : "h-[4.25rem] justify-center"}
        ${
          isEdit && !disabled && mounted ? "bg-white" : "bg-zinc-100"
        } ${className}`}
    >
      {label && (
        <div className="flex items-center justify-between gap-2">
          <p
            id={labelId}
            title={label}
            className="truncate text-base xl:text-lg font-semibold uppercase leading-tight tracking-wide "
          >
            {label}
          </p>
          {trailing}
        </div>
      )}

      <div className="mt-0.5 flex min-w-0 flex-1 items-center">{children}</div>
    </div>
  );
}

interface DataItemProps {
  label?: string;
  value: string | number | null | undefined;
  status?: string;
  background?: string;
  isEdit?: boolean;
  onEdit?: (item: string) => void;
  disabled?: boolean;
}

export default function D5DataItem({
  label,
  value,
  status,
  background,
  isEdit,
  onEdit,
  disabled,
}: DataItemProps) {
  const [mounted, setMounted] = useState(false);
  const labelId = useId();

  useEffect(() => setMounted(true), []);

  const editable = Boolean(isEdit && !disabled && mounted);
  const text =
    value === null || value === undefined || value === ""
      ? null
      : String(value);

  return (
    <FieldShell
      label={label}
      labelId={labelId}
      variant={editable ? "edit" : "read"}
      trailing={
        status ? (
          <span className="shrink-0 rounded-full bg-zinc-200 px-2 py-0.5 font-semibold uppercase">
            {status}
          </span>
        ) : null
      }
    >
      {editable ? (
        <input
          type="text"
          aria-labelledby={labelId}
          value={text ?? ""}
          placeholder="dd/mm/aaaa"
          onChange={(e) => onEdit?.(formatDateToInput(e.target.value))}
          className={`w-full bg-transparent text-base xl:text-lg font-semibold placeholder:font-normal placeholder:text-zinc-400 focus:outline-none ${background ?? ""}`}
        />
      ) : (
        <p
          title={text ?? undefined}
          className={`w-full truncate text-base xl:text-lg ${background ?? ""}`}
        >
          {text ?? "Sem informação"}
        </p>
      )}
    </FieldShell>
  );
}

export function SummaryD5DataItem({
  label,
  value,
}: {
  label: string;
  value: string | number | null | undefined;
}) {
  const text =
    value === null || value === undefined || value === ""
      ? null
      : String(value);

  return (
    <FieldShell label={label} className="!border-zinc-400 !bg-zinc-50">
      <p className="w-full truncate text-lg font-bold text-zinc-400">
        {text ?? "—"}
      </p>
    </FieldShell>
  );
}
