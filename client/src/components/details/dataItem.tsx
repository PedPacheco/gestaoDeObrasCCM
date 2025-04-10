"use client";

interface DataItemProps {
  label: string;
  value: string;
  status?: string;
}

export default function DataItem({ label, value, status }: DataItemProps) {
  return (
    <div className="flex items-center justify-between mb-3 max-w-96 w-[342px] h-12 border border-zinc-700 border-solid px-2 rounded-md">
      <p className="h-full flex items-center justify-start xl:text-lg font-light min-w-40 text-start border-r border-zinc-700 border-solid">
        {label}
      </p>
      <p className="flex-1 font-medium min-w-32 px-2 lg:min-w-36 text-center">
        {value}
      </p>
      {status && (
        <p className="zl:text-lg font-medium min-w-4 text-end lg:text-start">
          {status}
        </p>
      )}
    </div>
  );
}
