"use client";

interface DataItemProps {
  label?: string;
  value: string;
  status?: string;
  background?: string;
  isEdit?: boolean;
  onEdit?: (item: string) => void;
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
}: DataItemProps) {
  return (
    <div
      className={`flex items-center justify-between mb-3 max-w-96 w-[342px] h-10 border border-zinc-700 border-solid rounded-md ${
        isEdit ? "bg-white" : "bg-zinc-200"
      }`}
    >
      {label && (
        <p className="h-full flex items-center justify-start font-semibold w-40 p-2 text-center border-r border-zinc-700 border-solid">
          {label}
        </p>
      )}

      {isEdit ? (
        <input
          type="text"
          value={value || ""}
          onChange={(e: { target: { value: string } }) =>
            onEdit?.(formatDateMask(e.target.value))
          }
          className={`flex-1 h-full min-w-32 lg:min-w-36 ${background} font-medium text-sm text-center p-2 bg-transparent focus:outline-none`}
        />
      ) : (
        <p
          className={`flex flex-1 items-center justify-center h-full min-w-32 ${background} font-medium text-sm text-center`}
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
