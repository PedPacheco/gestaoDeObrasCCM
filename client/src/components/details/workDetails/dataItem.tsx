"use client";

import { useEffect, useState } from "react";

interface DataItemProps {
  label?: string;
  value: string | null;
  status?: string;
  background?: string;
  isEdit?: boolean;
  onEdit?: (item: string) => void;
  disabled?: boolean;
}

function formatDateMask(value: string): string {
  const digits = value.replace(/\D/g, "");

  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`;
}

export default function DataItem({
  label,
  value,
  status,
  background,
  isEdit,
  onEdit,
  disabled,
}: DataItemProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div
      className={`flex items-center justify-between mb-3 max-w-96 w-[342px] xl:w-full xl:max-w-[90%] h-12 border border-zinc-700 border-solid rounded-md ${
        isEdit && !disabled && mounted ? "bg-white" : "bg-zinc-200"
      }`}
    >
      {label && (
        <p className="h-full w-40 flex items-center justify-start font-semibold p-1 text-center xl:text-lg">
          {label}
        </p>
      )}

      {isEdit && !disabled && mounted ? (
        <input
          type="text"
          value={value || ""}
          onChange={(e: { target: { value: string } }) =>
            onEdit?.(formatDateMask(e.target.value))
          }
          className={`flex-1 h-full min-w-36 ${background} font-medium text-center 2xl:text-lg p-2 bg-transparent focus:outline-none`}
        />
      ) : (
        <p
          className={`flex flex-1 items-center justify-center h-full min-w-36 ${background} font-medium 2xl:text-lg text-center`}
        >
          {value}
        </p>
      )}

      {status && (
        <p className="zl:text-lg font-medium text-end lg:text-start pr-2">
          {status}
        </p>
      )}
    </div>
  );
}

export function SummaryDataItem({
  label,
  value,
}: {
  label: string;
  value: string | null;
}) {
  return (
    <div className="flex items-center h-12 border border-zinc-700 border-solid rounded-md bg-zinc-200 w-full">
      <p className="h-full px-3 flex items-center font-semibold border-r border-zinc-700">
        {label}
      </p>

      <p className="flex-1 px-3 flex items-center justify-center font-medium">
        {value}
      </p>
    </div>
  );
}
