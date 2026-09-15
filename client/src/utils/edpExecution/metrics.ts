import {
  EdpReport,
  ExecutionPoint,
  ParsedReport,
  PartnerReport,
  TeamMember,
} from "@/types/edpExecution";

// Limite de referência para resistência de aterramento na distribuição.
export const LIMITE_ATERRAMENTO_OHM = 10;

export interface CountItem {
  name: string;
  value: number;
}

export interface CriticalPoint extends ExecutionPoint {
  origem: string;
  parceira: string;
  fileName: string;
}

export interface AbsentMember extends TeamMember {
  fileName: string;
}

export interface ExecutionMetrics {
  totalRelatorios: number;
  totalEdp: number;
  totalParceiro: number;
  obras: string[];
  municipios: CountItem[];
  tiposObra: CountItem[];

  pontosTotal: number;
  pontosExecutados: number;
  pontosParciais: number;
  pontosNaoExecutados: number;
  pontosComRestricao: number;
  taxaExecucao: number;
  statusExecucao: CountItem[];
  restricoes: CountItem[];
  responsabilidades: CountItem[];
  pontosCriticos: CriticalPoint[];

  membrosTotal: number;
  membrosPresentes: number;
  membrosAusentes: number;
  equipesAusentes: number;
  taxaPresenca: number;
  presencaPorParceira: {
    parceira: string;
    presentes: number;
    ausentes: number;
    taxa: number;
  }[];
  ausentes: AbsentMember[];

  tempoMedioDeslocamento: number | null;
  tempoMedioObra: number | null;
  tempoMedioPausa: number | null;
  tempoMedioVolta: number | null;
  tempoMedioProdutivo: number | null;
  temposPorObra: {
    label: string;
    Deslocamento: number;
    Execução: number;
    Pausas: number;
    Volta: number;
  }[];
  pausasPorMotivo: CountItem[];

  aterramentoPontos: { label: string; valor: number; acima: boolean }[];
  aterramentoAcima: number;
  aterramentoTotal: number;
  aterramentoMedia: number | null;

  equipamentosAplicados: number;
  equipamentosRemovidos: number;
  equipamentosPorTipo: {
    name: string;
    Aplicados: number;
    Removidos: number;
  }[];

  dpRegistros: number;
  dpComAtraso: number;
  dpAtrasoMedio: number | null;
  dpChaveProvisoria: number;

  tiposEquipe: CountItem[];
  tiposVeiculo: CountItem[];
  relatoriosPorDia: { data: string; EDP: number; Parceiro: number }[];

  alteracoesExecucao: number;
}

const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const isYes = (value: string) => normalize(value) === "sim";

function countBy(values: string[]): CountItem[] {
  const counts = new Map<string, number>();

  values
    .map((value) => value.trim())
    .filter(Boolean)
    .forEach((value) => counts.set(value, (counts.get(value) ?? 0) + 1));

  return [...counts.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

function average(values: number[]): number | null {
  if (!values.length) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function formatMinutes(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return "—";

  const total = Math.round(value);
  const hours = Math.floor(total / 60);
  const minutes = total % 60;

  if (!hours) return `${minutes}min`;
  return `${hours}h ${String(minutes).padStart(2, "0")}min`;
}

export function partnerOf(report: ParsedReport): string {
  if (report.kind === "PARCEIRO") return report.parceira || "—";
  return report.membros.find((member) => member.parceira)?.parceira || "—";
}

export function totalPausaMin(report: PartnerReport): number {
  return report.pausas.reduce((sum, pause) => sum + (pause.duracaoMin ?? 0), 0);
}

export function buildMetrics(reports: ParsedReport[]): ExecutionMetrics {
  const edpReports = reports.filter(
    (report): report is EdpReport => report.kind === "EDP",
  );
  const partnerReports = reports.filter(
    (report): report is PartnerReport => report.kind === "PARCEIRO",
  );

  const pontos = reports.flatMap((report) => report.pontos);
  const membros = edpReports.flatMap((report) => report.membros);

  const executados = pontos.filter((point) => isYes(point.executado));
  const parciais = pontos.filter(
    (point) => normalize(point.executado) === "parcial",
  );
  const naoExecutados = pontos.filter(
    (point) => normalize(point.executado) === "nao",
  );
  const comRestricao = pontos.filter((point) => point.restricao.trim());

  const membrosConferidos = membros.filter((member) => !member.equipeAusente);
  const presentes = membrosConferidos.filter((member) => member.presente);

  const presencaMap = new Map<string, { presentes: number; ausentes: number }>();
  membrosConferidos.forEach((member) => {
    const key = member.parceira || "—";
    const current = presencaMap.get(key) ?? { presentes: 0, ausentes: 0 };

    if (member.presente) current.presentes += 1;
    else current.ausentes += 1;

    presencaMap.set(key, current);
  });

  const deslocamentos = partnerReports
    .map((report) => report.cronograma.deslocMin)
    .filter((value): value is number => value !== null);

  const obrasMin = partnerReports
    .map((report) => report.cronograma.obraMin)
    .filter((value): value is number => value !== null);

  const voltas = [
    ...partnerReports.map((report) => report.cronograma.voltaMin),
    ...edpReports.map((report) => report.voltaMin),
  ].filter((value): value is number => value !== null);

  const pausasTotais = partnerReports.map(totalPausaMin);

  const produtivos = partnerReports
    .map((report) =>
      report.cronograma.obraMin === null
        ? null
        : Math.max(report.cronograma.obraMin - totalPausaMin(report), 0),
    )
    .filter((value): value is number => value !== null);

  const aterramentoPontos = partnerReports.flatMap((report) =>
    report.aterramento
      .filter((point) => point.medicaoOhm !== null)
      .map((point) => ({
        label: `${report.obra.ovNota || report.sigla || "—"} · P${point.numeroPonto || "?"}`,
        valor: point.medicaoOhm as number,
        acima: (point.medicaoOhm as number) > LIMITE_ATERRAMENTO_OHM,
      })),
  );

  const equipamentos = partnerReports.flatMap((report) => report.equipamentos);
  const equipamentosTipoMap = new Map<
    string,
    { Aplicados: number; Removidos: number }
  >();

  equipamentos.forEach((equipment) => {
    const key = equipment.equipamento || "—";
    const current = equipamentosTipoMap.get(key) ?? {
      Aplicados: 0,
      Removidos: 0,
    };

    if (normalize(equipment.situacao) === "aplicado") current.Aplicados += 1;
    if (normalize(equipment.situacao) === "removido") current.Removidos += 1;

    equipamentosTipoMap.set(key, current);
  });

  const dps = reports
    .map((report) => report.dp)
    .filter((dp): dp is NonNullable<typeof dp> => dp !== null);

  const atrasos = dps
    .map((dp) => dp.atrasoMin)
    .filter((value): value is number => value !== null && value > 0);

  const diasMap = new Map<string, { EDP: number; Parceiro: number }>();
  reports.forEach((report) => {
    const key = report.data || "—";
    const current = diasMap.get(key) ?? { EDP: 0, Parceiro: 0 };

    if (report.kind === "EDP") current.EDP += 1;
    else current.Parceiro += 1;

    diasMap.set(key, current);
  });

  const pausas = partnerReports.flatMap((report) => report.pausas);
  const pausaMotivoMap = new Map<string, number>();
  pausas.forEach((pause) => {
    const key = pause.motivo || "Sem motivo";
    pausaMotivoMap.set(
      key,
      (pausaMotivoMap.get(key) ?? 0) + (pause.duracaoMin ?? 0),
    );
  });

  return {
    totalRelatorios: reports.length,
    totalEdp: edpReports.length,
    totalParceiro: partnerReports.length,
    obras: [
      ...new Set(
        [
          ...partnerReports.map((report) => report.obra.ovNota),
          ...pontos.map((point) => point.ov),
        ].filter(Boolean),
      ),
    ],
    municipios: countBy(partnerReports.map((report) => report.obra.municipio)),
    tiposObra: countBy(partnerReports.map((report) => report.obra.tipo)),

    pontosTotal: pontos.length,
    pontosExecutados: executados.length,
    pontosParciais: parciais.length,
    pontosNaoExecutados: naoExecutados.length,
    pontosComRestricao: comRestricao.length,
    taxaExecucao: pontos.length
      ? (executados.length / pontos.length) * 100
      : 0,
    statusExecucao: [
      { name: "Executado", value: executados.length },
      { name: "Parcial", value: parciais.length },
      { name: "Não executado", value: naoExecutados.length },
    ].filter((item) => item.value > 0),
    restricoes: countBy(pontos.map((point) => point.restricao)),
    responsabilidades: countBy(pontos.map((point) => point.responsabilidade)),
    pontosCriticos: reports.flatMap((report) =>
      report.pontos
        .filter((point) => !isYes(point.executado) || point.restricao.trim())
        .map((point) => ({
          ...point,
          origem: report.kind === "EDP" ? "EDP" : "Parceiro",
          parceira: partnerOf(report),
          fileName: report.fileName,
        })),
    ),

    membrosTotal: membrosConferidos.length,
    membrosPresentes: presentes.length,
    membrosAusentes: membrosConferidos.length - presentes.length,
    equipesAusentes: membros.filter((member) => member.equipeAusente).length,
    taxaPresenca: membrosConferidos.length
      ? (presentes.length / membrosConferidos.length) * 100
      : 0,
    presencaPorParceira: [...presencaMap.entries()]
      .map(([parceira, values]) => ({
        parceira,
        ...values,
        taxa:
          values.presentes + values.ausentes
            ? (values.presentes / (values.presentes + values.ausentes)) * 100
            : 0,
      }))
      .sort((a, b) => b.presentes + b.ausentes - (a.presentes + a.ausentes)),
    ausentes: edpReports.flatMap((report) =>
      report.membros
        .filter((member) => !member.presente)
        .map((member) => ({ ...member, fileName: report.fileName })),
    ),

    tempoMedioDeslocamento: average(deslocamentos),
    tempoMedioObra: average(obrasMin),
    tempoMedioPausa: average(pausasTotais.filter((value) => value > 0)),
    tempoMedioVolta: average(voltas),
    tempoMedioProdutivo: average(produtivos),
    temposPorObra: partnerReports.map((report) => {
      const pausa = totalPausaMin(report);
      const obra = report.cronograma.obraMin ?? 0;

      return {
        label: report.obra.ovNota || report.sigla || report.fileName,
        Deslocamento: Math.round(report.cronograma.deslocMin ?? 0),
        Execução: Math.round(Math.max(obra - pausa, 0)),
        Pausas: Math.round(pausa),
        Volta: Math.round(report.cronograma.voltaMin ?? 0),
      };
    }),
    pausasPorMotivo: [...pausaMotivoMap.entries()]
      .map(([name, value]) => ({ name, value: Math.round(value) }))
      .sort((a, b) => b.value - a.value),

    aterramentoPontos,
    aterramentoAcima: aterramentoPontos.filter((point) => point.acima).length,
    aterramentoTotal: aterramentoPontos.length,
    aterramentoMedia: average(aterramentoPontos.map((point) => point.valor)),

    equipamentosAplicados: equipamentos.filter(
      (equipment) => normalize(equipment.situacao) === "aplicado",
    ).length,
    equipamentosRemovidos: equipamentos.filter(
      (equipment) => normalize(equipment.situacao) === "removido",
    ).length,
    equipamentosPorTipo: [...equipamentosTipoMap.entries()]
      .map(([name, values]) => ({ name, ...values }))
      .sort(
        (a, b) =>
          b.Aplicados + b.Removidos - (a.Aplicados + a.Removidos),
      ),

    dpRegistros: dps.filter((dp) => dp.horaInicio || dp.horaConclusao).length,
    dpComAtraso: atrasos.length,
    dpAtrasoMedio: average(atrasos),
    dpChaveProvisoria: dps.filter((dp) => isYes(dp.chaveProvisoria)).length,

    tiposEquipe: countBy(partnerReports.map((report) => report.tipoEquipe)),
    tiposVeiculo: countBy(partnerReports.map((report) => report.tipoVeiculo)),
    relatoriosPorDia: [...diasMap.entries()]
      .map(([data, values]) => ({ data, ...values }))
      .sort((a, b) => {
        const [dayA, monthA, yearA] = a.data.split("/");
        const [dayB, monthB, yearB] = b.data.split("/");
        return (
          `${yearA}${monthA}${dayA}`.localeCompare(`${yearB}${monthB}${dayB}`)
        );
      }),

    alteracoesExecucao:
      partnerReports.filter((report) => isYes(report.cronograma.alteracao))
        .length +
      edpReports.filter((report) => isYes(report.asBuild?.alteracao ?? ""))
        .length,
  };
}
