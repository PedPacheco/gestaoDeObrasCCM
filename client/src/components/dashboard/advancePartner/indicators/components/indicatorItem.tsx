import { AdvancePartnerIndicator } from "../types";
import {
  FarolColor,
  formatDelta,
  formatValue,
  getFarolColor,
  roundDelta,
} from "../utils";

const EPS = 1e-9;

type DeltaTone = "positive" | "negative" | "neutral";

const DELTA_STYLES: Record<DeltaTone, string> = {
  positive: "bg-green-500/20 text-green-400",
  negative: "bg-red-500/20 text-red-400",
  neutral: "bg-zinc-500/20 text-zinc-300",
};

const FAROL_LABEL: Record<FarolColor, string> = {
  "bg-green-500": "Meta atingida",
  "bg-yellow-500": "Próximo da meta",
  "bg-red-500": "Abaixo da meta",
  "bg-zinc-500": "Sem meta definida",
};

// function getDeltaTone(delta: number, direction: "up" | "down"): DeltaTone {
//   if (Math.abs(delta) < EPS) return "neutral";
//   const improved = direction === "down" ? delta < 0 : delta > 0;
//   return improved ? "positive" : "negative";
// }

export function IndicatorItem({
  indicator,
}: {
  indicator: AdvancePartnerIndicator;
}) {
  const { baseline, current, target, format, withoutCurrency } = indicator;
  const direction = indicator.direction ?? "up";

  const hasDelta = baseline != null && current != null;
  const delta = hasDelta ? roundDelta(current - baseline, format) : null;
  const tone: DeltaTone =
    delta == null || delta === 0
      ? "neutral"
      : (direction === "down" ? delta < 0 : delta > 0)
        ? "positive"
        : "negative";
  const farol = getFarolColor(current, target, direction);

  return (
    <li className="py-2 first:pt-0 last:pb-0">
      <span className="text-base font-medium text-zinc-100">
        {indicator.name}
      </span>

      <div className="mt-2 grid grid-cols-[repeat(4,minmax(0,1fr))_auto] items-end gap-x-3">
        <Metric label="Base">
          <span className="text-zinc-200">
            {formatValue(baseline, format, withoutCurrency)}
          </span>
        </Metric>

        <Metric label="Atual">
          <span className="text-zinc-200">
            {formatValue(current, format, withoutCurrency)}
          </span>
        </Metric>

        <Metric label="Delta">
          {delta == null ? (
            <span className="text-zinc-500">—</span>
          ) : (
            <span
              className={`inline-flex items-center rounded-full px-1.5 py-0.5 font-medium ${DELTA_STYLES[tone]}`}
            >
              {formatDelta(delta, format, withoutCurrency)}
            </span>
          )}
        </Metric>

        <Metric label="Meta">
          <span className="text-zinc-200">
            {formatValue(target, format, withoutCurrency)}
          </span>
        </Metric>

        <span
          role="img"
          aria-label={FAROL_LABEL[farol]}
          title={FAROL_LABEL[farol]}
          className={`mb-1 h-3 w-3 shrink-0 rounded-full ${farol}`}
        />
      </div>
    </li>
  );
}

function Metric({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <p className="text-sm text-zinc-500">{label}</p>
      <p
        className="truncate text-sm"
        title={typeof children === "string" ? children : undefined}
      >
        {children}
      </p>
    </div>
  );
}
