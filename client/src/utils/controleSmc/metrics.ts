import { NucleoSmcRow } from "@/types/controleSmc";

const normalize = (value: string) => value.trim().toLowerCase();

export function isRestricaoAtiva(status: string): boolean {
  const value = normalize(status);
  return value.startsWith("bloque") || value.startsWith("aguardando");
}

export function isChiCritico(status: string): boolean {
  return normalize(status).startsWith("critico") || normalize(status).startsWith("crítico");
}

function average(values: number[]): number {
  if (!values.length) return 0;
  return Math.round((values.reduce((acc, v) => acc + v, 0) / values.length) * 10) / 10;
}

function countBy(rows: NucleoSmcRow[], pick: (row: NucleoSmcRow) => string) {
  const counts = new Map<string, number>();
  rows.forEach((row) => {
    const key = pick(row).trim();
    if (!key) return;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  });
  return [...counts.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

export interface RegionalProgress {
  label: string;
  Construção: number;
  Regularização: number;
  Desativação: number;
}

export interface ControleSmcMetrics {
  total: number;
  regionaisCount: number;
  municipiosCount: number;
  ucsPlanejadasTotal: number;
  ligacoesExecutadasTotal: number;
  ligacoesNotasBaixadasTotal: number;
  progressoConstrucaoMedio: number;
  progressoRegularizacaoMedio: number;
  progressoDesativacaoMedio: number;
  chiSaturacao: number;
  chiLimiteTotal: number;
  chiConsumidoTotal: number;
  nucleosComRestricao: number;
  nucleosChiCritico: number;
  statusCounts: { name: string; value: number }[];
  regionalCounts: { name: string; value: number }[];
  parceiraCounts: { name: string; value: number }[];
  restricaoPorTipo: { name: string; value: number }[];
  progressoPorRegional: RegionalProgress[];
}

export function buildControleSmcMetrics(rows: NucleoSmcRow[]): ControleSmcMetrics {
  const total = rows.length;

  const regionais = new Set(rows.map((r) => r.regional).filter(Boolean));
  const municipios = new Set(rows.map((r) => r.municipio).filter(Boolean));

  const ucsPlanejadasTotal = rows.reduce((acc, r) => acc + (r.ucsPlanejadasConstrucaoMtBt ?? 0), 0);
  const ligacoesExecutadasTotal = rows.reduce((acc, r) => acc + (r.ligacoesExecutadasCampo ?? 0), 0);
  const ligacoesNotasBaixadasTotal = rows.reduce((acc, r) => acc + (r.ligacoesNotasBaixadas ?? 0), 0);

  const progressoConstrucaoMedio = average(
    rows.map((r) => r.statusAndamentoConstrucao).filter((v): v is number => v !== null),
  );
  const progressoRegularizacaoMedio = average(
    rows.map((r) => r.statusAndamentoRegularizacao).filter((v): v is number => v !== null),
  );
  const progressoDesativacaoMedio = average(
    rows.map((r) => r.statusAndamentoDesativacao).filter((v): v is number => v !== null),
  );

  const comLimiteChi = rows.filter((r) => (r.chiLimiteBtzero ?? 0) > 0);
  const chiLimiteTotal = comLimiteChi.reduce((acc, r) => acc + (r.chiLimiteBtzero ?? 0), 0);
  const chiConsumidoTotal = comLimiteChi.reduce((acc, r) => acc + (r.chiConsumidoBtzero ?? 0), 0);
  const chiSaturacao = chiLimiteTotal > 0 ? Math.round((chiConsumidoTotal / chiLimiteTotal) * 100) : 0;

  const nucleosComRestricao = rows.filter(
    (r) => isRestricaoAtiva(r.meioAmbienteStatus) || isRestricaoAtiva(r.poderPublicoStatus),
  ).length;
  const nucleosChiCritico = rows.filter((r) => isChiCritico(r.chiStatus)).length;

  const statusCounts = countBy(rows, (r) => r.statusNucleo);
  const regionalCounts = countBy(rows, (r) => r.regional);
  const parceiraCounts = countBy(rows, (r) => r.parceiraResponsavel).slice(0, 10);

  const restricaoPorTipo = [
    { name: "Meio Ambiente", value: rows.filter((r) => isRestricaoAtiva(r.meioAmbienteStatus)).length },
    { name: "Poder Público", value: rows.filter((r) => isRestricaoAtiva(r.poderPublicoStatus)).length },
    { name: "CHI crítico", value: nucleosChiCritico },
  ];

  const regionalGroups = new Map<string, NucleoSmcRow[]>();
  rows.forEach((row) => {
    if (!row.regional) return;
    const list = regionalGroups.get(row.regional) ?? [];
    list.push(row);
    regionalGroups.set(row.regional, list);
  });

  const progressoPorRegional: RegionalProgress[] = [...regionalGroups.entries()]
    .map(([label, group]) => ({
      label,
      Construção: average(group.map((r) => r.statusAndamentoConstrucao).filter((v): v is number => v !== null)),
      Regularização: average(
        group.map((r) => r.statusAndamentoRegularizacao).filter((v): v is number => v !== null),
      ),
      Desativação: average(group.map((r) => r.statusAndamentoDesativacao).filter((v): v is number => v !== null)),
    }))
    .sort((a, b) => a.label.localeCompare(b.label));

  return {
    total,
    regionaisCount: regionais.size,
    municipiosCount: municipios.size,
    ucsPlanejadasTotal,
    ligacoesExecutadasTotal,
    ligacoesNotasBaixadasTotal,
    progressoConstrucaoMedio,
    progressoRegularizacaoMedio,
    progressoDesativacaoMedio,
    chiSaturacao,
    chiLimiteTotal,
    chiConsumidoTotal,
    nucleosComRestricao,
    nucleosChiCritico,
    statusCounts,
    regionalCounts,
    parceiraCounts,
    restricaoPorTipo,
    progressoPorRegional,
  };
}
