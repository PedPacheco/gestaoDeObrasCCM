import { ReactNode } from "react";

type SectionStatus = "complete" | "pending" | "attention";

interface CardSectionProps {
  id?: string;
  title: string;
  description?: string;
  icon?: ReactNode;
  status?: SectionStatus;
  children: ReactNode;
}

const STATUS_CONFIG: Record<
  SectionStatus,
  { label: string; dot: string; text: string }
> = {
  complete: {
    label: "Concluído",
    dot: "bg-[#53FF75]",
    text: "text-[#3f7a17]",
  },
  pending: {
    label: "Pendente",
    dot: "bg-zinc-300",
    text: "text-zinc-500",
  },
  attention: {
    label: "Requer atenção",
    dot: "bg-amber-400",
    text: "text-amber-600",
  },
};

export function CardSection({
  id,
  title,
  description,
  icon,
  status,
  children,
}: CardSectionProps) {
  const statusConfig = status ? STATUS_CONFIG[status] : null;

  return (
    <section
      id={id}
      className="scroll-mt-28 rounded-2xl border border-zinc-200 bg-white shadow-sm"
    >
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-zinc-100 px-6 py-5">
        <div className="flex items-start gap-3">
          {icon && (
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#53FF75]/10 text-[#3f7a17]">
              {icon}
            </div>
          )}
          <div>
            <h2 className="text-base font-semibold text-zinc-900">{title}</h2>
            {description && (
              <p className="mt-0.5 text-sm text-zinc-500">{description}</p>
            )}
          </div>
        </div>

        {statusConfig && (
          <span
            className={`flex shrink-0 items-center gap-1.5 rounded-full border border-zinc-200 px-2.5 py-1 text-xs font-medium ${statusConfig.text}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${statusConfig.dot}`} />
            {statusConfig.label}
          </span>
        )}
      </div>

      <div className="p-6">{children}</div>
    </section>
  );
}
