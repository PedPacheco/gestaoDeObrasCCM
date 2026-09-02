import {
  formatDelta,
  formatValue,
  getFarolColor,
  IndicatorFormat,
} from "../utils";

export interface AdvancePartnerIndicator {
  pillar: string;
  name: string;
  baseline: number;
  current: number;
  target: number | null;
  format: IndicatorFormat;
  withoutCurrency?: boolean;
  direction?: "up" | "down";
}

export function IndicatorItem({
  indicator,
}: {
  indicator: AdvancePartnerIndicator;
}) {
  const direction = indicator.direction ?? "up";
  const delta = indicator.current - indicator.baseline;
  const farol = getFarolColor(indicator.current, indicator.target, direction);

  const isImprovement = direction === "down" ? delta <= 0 : delta >= 0;

  return (
    <li className="py-2 first:pt-0 last:pb-0">
      <div className="flex items-start justify-between gap-2">
        <span className="text-base font-medium text-zinc-100">
          {indicator.name}
        </span>
      </div>
      <div className="mt-2 grid grid-cols-5 gap-16">
        <div>
          <p className="text-sm text-zinc-500">Base</p>

          <p className="text-sm text-zinc-200 text-nowrap">
            {formatValue(
              indicator.baseline,
              indicator.format,
              indicator?.withoutCurrency,
            )}
          </p>
        </div>

        <div>
          <p className="text-sm text-zinc-500">Atual</p>

          <p className="text-sm font-semibold text-white text-nowrap">
            {formatValue(
              indicator.current,
              indicator.format,
              indicator?.withoutCurrency,
            )}
          </p>
        </div>

        <div>
          <p className="text-sm text-zinc-500">Delta</p>

          <span
            className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-sm font-medium text-nowrap ${
              isImprovement
                ? "bg-green-500/20 text-green-400"
                : "bg-red-500/20 text-red-400"
            }`}
          >
            {formatDelta(delta, indicator.format, indicator?.withoutCurrency)}
          </span>
        </div>

        <div>
          <p className="text-sm text-zinc-500">Meta</p>

          <p className="text-sm text-cyan-300 text-nowrap">
            {formatValue(
              indicator.target,
              indicator.format,
              indicator?.withoutCurrency,
            )}
          </p>
        </div>

        <span className={`h-3 w-3 mt-4 rounded-full ${farol}`} />
      </div>
    </li>
  );
}
