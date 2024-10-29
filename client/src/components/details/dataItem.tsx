interface DataItemProps {
  label: string;
  value: string;
  status?: string; // status pode ser opcional
}

export default async function DataItem({
  label,
  value,
  status,
}: DataItemProps) {
  return (
    <div className="inline-flex justify-between items-center mb-3 max-w-96">
      <p className="lg:text-lg font-light min-w-32 lg:min-w-36 text-start">
        {label}
      </p>
      <p className="lg:text-lg font-medium min-w-32 lg:min-w-36 text-start">
        {value}
      </p>
      {status && (
        <p className="lg:text-lg font-medium min-w-8 text-end lg:text-start">
          {status}
        </p>
      )}
    </div>
  );
}
