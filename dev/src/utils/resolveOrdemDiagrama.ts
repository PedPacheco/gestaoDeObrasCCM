// src/utils/obras/resolveOrdemDiagrama.ts
type ObraOrdens =
  | {
      diagrama?: string | null;
      ordem_dci?: string | null;
      ordem_dca?: string | null;
      ordem_dcd?: string | null;
      ordem_dcim?: string | null;
    }
  | null
  | undefined;

export function resolveOrdemDiagrama(obra: ObraOrdens): string | null {
  return (
    obra?.diagrama ??
    obra?.ordem_dci ??
    obra?.ordem_dca ??
    obra?.ordem_dcd ??
    obra?.ordem_dcim ??
    null
  );
}
