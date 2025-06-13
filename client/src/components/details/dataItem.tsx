"use client";

interface DataItemProps {
  label?: string;
  value: string;
  status?: string;
  background?: string;
}

export default function DataItem({
  label,
  value,
  status,
  background,
}: DataItemProps) {
  return (
    <div className="flex items-center justify-between mb-3 max-w-96 w-[342px] h-10 border border-zinc-700 border-solid rounded-md">
      {label && (
        <p className="h-full flex items-center justify-start font-semibold w-40 p-2 text-center border-r border-zinc-700 border-solid">
          {label}
        </p>
      )}
      <p
        className={`flex flex-1 items-center justify-center h-full min-w-32 lg:min-w-36 ${background} font-medium text-center`}
      >
        {value}
      </p>
      {status && (
        <p className="zl:text-lg font-medium text-end lg:text-start pr-2">
          {status}
        </p>
      )}
    </div>
  );
}
