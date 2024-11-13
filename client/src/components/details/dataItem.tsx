"use client";

interface DataItemProps {
  label: string;
  value: string;
  status?: string;
}

export default function DataItem({ label, value, status }: DataItemProps) {
  return (
    <div className="inline-flex justify-between items-center mb-3 max-w-96">
      <p className="xl:text-lg font-light min-w-32 lg:min-w-36 text-start">
        {label}
      </p>
      <p className="xl:text-lg font-medium min-w-32 lg:min-w-36 text-start">
        {value}
      </p>
      {status && (
        <p className="zl:text-lg font-medium min-w-8 text-end lg:text-start">
          {status}
        </p>
      )}
    </div>
  );
}
