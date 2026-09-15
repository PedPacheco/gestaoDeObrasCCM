import ExcelJS from "exceljs";

import {
  DpSheet,
  EdpReport,
  EquipmentRow,
  ExecutionPoint,
  GroundingPoint,
  LocationEvent,
  ParsedReport,
  PartnerReport,
  Pause,
  TeamMember,
} from "@/types/edpExecution";

type Row = Record<string, string>;

const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .toLowerCase()
    .trim();

function cellText(value: ExcelJS.CellValue): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return String(value);
  if (typeof value === "boolean") return value ? "Sim" : "Não";
  if (value instanceof Date) return value.toLocaleDateString("pt-BR");

  const cell = value as unknown as Record<string, unknown>;

  if (Array.isArray(cell.richText)) {
    return (cell.richText as { text: string }[])
      .map((part) => part.text)
      .join("")
      .trim();
  }
  if (cell.result !== undefined) return cellText(cell.result as ExcelJS.CellValue);
  if (typeof cell.text === "string") return cell.text.trim();

  return String(value).trim();
}

// Lê a aba em linhas indexadas pelo cabeçalho normalizado da linha 1, para o
// dashboard não quebrar caso o app mobile reordene ou renomeie colunas.
function readRows(sheet: ExcelJS.Worksheet | undefined): Row[] {
  if (!sheet) return [];

  const headers: string[] = [];
  sheet.getRow(1).eachCell({ includeEmpty: true }, (cell, col) => {
    headers[col] = normalize(cellText(cell.value));
  });

  const rows: Row[] = [];
  sheet.eachRow({ includeEmpty: false }, (row, index) => {
    if (index === 1) return;

    const parsed: Row = {};
    let hasContent = false;

    row.eachCell({ includeEmpty: true }, (cell, col) => {
      const key = headers[col];
      if (!key) return;

      const text = cellText(cell.value);
      parsed[key] = text;
      if (text) hasContent = true;
    });

    if (hasContent) rows.push(parsed);
  });

  return rows;
}

const get = (row: Row | undefined, ...keys: string[]): string => {
  if (!row) return "";
  for (const key of keys) {
    const value = row[normalize(key)];
    if (value) return value;
  }
  return "";
};

// "8,4" e "8.4" chegam do Excel como texto dependendo do formato da célula: com
// vírgula o ponto é separador de milhar, sem vírgula o ponto é o decimal.
export function toNumber(value: string): number | null {
  if (!value) return null;

  const normalized = value.includes(",")
    ? value.replace(/\./g, "").replace(",", ".")
    : value;

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

// Aceita HH:MM e HH:MM:SS — o app grava durações nos dois formatos.
export function toMinutes(value: string): number | null { 
  if (!value) return null;

  const match = value.trim().match(/^(\d{1,3}):([0-5]\d)(?::([0-5]\d))?$/);
  if (!match) return null;

  const [, hours, minutes, seconds] = match;
  return (
    Number(hours) * 60 + Number(minutes) + (seconds ? Number(seconds) / 60 : 0)
  );
}

// Diferença entre dois horários do mesmo dia (HH:MM:SS), em minutos.
function minutesBetween(start: string, end: string): number | null {
  const from = toMinutes(start);
  const to = toMinutes(end);
  if (from === null || to === null) return null;

  const diff = to - from;
  return diff >= 0 ? diff : null;
}

function parseCoordinate(value: string): number | null {
  if (!value || normalize(value) === "nao disponivel") return null;
  const parsed = Number(value.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

function parseLocation(rows: Row[]): LocationEvent[] {
  return rows.map((row) => ({
    evento: get(row, "Evento"),
    horario: get(row, "Horário"),
    latitude: parseCoordinate(get(row, "Latitude")),
    longitude: parseCoordinate(get(row, "Longitude")),
  }));
}

function parseDp(rows: Row[]): DpSheet | null {
  const row = rows[0];
  if (!row) return null;

  return {
    horaInicio: get(row, "Hora de Início"),
    horaConclusao: get(row, "Hora de Conclusão"),
    contatoInicioCOI: get(row, "Contato de Início COI"),
    contatoTerminoCOI: get(row, "Contato de Término COI"),
    justificarAtraso: get(row, "Justificar Atraso"),
    duracaoProgMin: toMinutes(get(row, "Duração Prog.")),
    duracaoRealMin: toMinutes(get(row, "Duração Real")),
    atrasoMin: toMinutes(get(row, "Atraso")),
    chaveProvisoria: get(row, "Houve chave provisória?"),
    motivoChave: get(row, "Motivo"),
    refInstalacao: get(row, "Ref. Instalação"),
    chaveRetirada: get(row, "Chave retirada?"),
    refChaveRetirada: get(row, "Ref. Chave Retirada"),
    observacoes: get(row, "Observações"),
    colaboradorEDP: get(row, "Colaborador EDP"),
    colaboradorParceira: get(row, "Colaborador Parceira"),
  };
}

function parseExecutionPoints(rows: Row[]): ExecutionPoint[] {
  return rows.map((row) => ({
    ponto: get(row, "Ponto"),
    sigla: get(row, "Sigla"),
    ov: get(row, "OV", "OV / Nota"),
    executado: get(row, "Executado?"),
    responsabilidade: get(row, "Responsabilidade"),
    restricao: get(row, "Restrição"),
    observacao: get(row, "Observação"),
  }));
}

function parseEdp(
  sheets: Map<string, ExcelJS.Worksheet>,
  id: string,
  fileName: string,
): EdpReport {
  const resumo = readRows(sheets.get("resumo"))[0];
  const volta = readRows(sheets.get("deslocamento de volta"))[0];
  const asBuild = readRows(sheets.get("as build"))[0];

  const membros: TeamMember[] = readRows(sheets.get("membros")).map((row) => {
    const nome = get(row, "Nome");
    const equipeAusente = nome.includes("Equipe ausente");

    return {
      sigla: get(row, "Sigla"),
      parceira: get(row, "Parceira"),
      nome,
      funcao: get(row, "Função"),
      presente: normalize(get(row, "Presença")) === "presente",
      equipeAusente,
    };
  });

  const fotos = asBuild
    ? [
        get(asBuild, "Foto — Visão geral da obra"),
        get(asBuild, "Foto — Visão com equipamentos instalados"),
        get(asBuild, "Foto adicional"),
      ].filter((value) => normalize(value) === "adicionada").length
    : 0;

  return {
    id,
    fileName,
    kind: "EDP",
    data: get(resumo, "Data"),
    hora: get(resumo, "Hora"),
    equipesConferidas: toNumber(get(resumo, "Equipes conferidas")) ?? 0,
    siglas: get(resumo, "Siglas")
      .split(",")
      .map((sigla) => sigla.trim())
      .filter(Boolean),
    supervisores: get(resumo, "Supervisor(es)"),
    tecnicos: get(resumo, "Técnico(s) de Segurança"),
    membros,
    pontos: parseExecutionPoints(readRows(sheets.get("execucao"))),
    localizacao: parseLocation(readRows(sheets.get("localizacao"))),
    dp: parseDp(readRows(sheets.get("dp"))),
    voltaMin: toMinutes(get(volta, "Duração")),
    asBuild: asBuild
      ? {
          alteracao: get(asBuild, "Houve alterações na execução?"),
          justificativa: get(asBuild, "Justificativa das alterações"),
          observacoes: get(asBuild, "Observações gerais"),
          fotos,
        }
      : null,
  };
}

function parsePartner(
  sheets: Map<string, ExcelJS.Worksheet>,
  id: string,
  fileName: string,
): PartnerReport {
  const composicao = readRows(sheets.get("composicao"))[0];
  const obra = readRows(sheets.get("obra"))[0];
  const cronograma = readRows(sheets.get("cronograma"))[0];

  const atividadeInicio = get(cronograma, "Atividade Início");
  const voltaInicio = get(cronograma, "Volta Início");

  const pausas: Pause[] = readRows(sheets.get("pausas")).map((row) => ({
    inicio: get(row, "Início"),
    fim: get(row, "Fim"),
    duracaoMin: toMinutes(get(row, "Duração")),
    motivo: get(row, "Motivo"),
  }));

  const aterramento: GroundingPoint[] = readRows(
    sheets.get("medicao aterramento"),
  )
    .map((row) => ({
      coordenada: get(row, "Coordenada"),  
      rua: get(row, "Rua / Avenida"),
      numeroPonto: get(row, "Nº Ponto"),
      tipoPoste: get(row, "Tipo Poste"),
      medicaoOhm: toNumber(get(row, "Medição Final (Ω)")),
      qtHastes: toNumber(get(row, "Qt. Hastes")),
    }))
    .filter((point) => point.medicaoOhm !== null);

  const equipamentos: EquipmentRow[] = readRows(sheets.get("ficha equipamento"))
    .map((row) => ({
      ponto: get(row, "Ponto"),
      situacao: get(row, "Situação"),
      equipamento: get(row, "Equipamento"),
      instalacao: get(row, "Nº Instalação"),
      potencia: get(row, "Potência/Marca"),
      patrimonio: get(row, "Patrimônio/Série"),
      tipo: get(row, "Tipo"),
    }))
    .filter((equipment) => equipment.equipamento);
 
  return {
    id,
    fileName,
    kind: "PARCEIRO",
    data: get(composicao, "Data"),
    hora: get(composicao, "Hora"),
    lider: get(composicao, "Líder"),
    sigla: get(composicao, "Sigla"),
    parceira: get(composicao, "Parceira"),
    composicao: get(composicao, "Composição"),
    tipoEquipe: get(composicao, "Tipo de Equipe"),
    placa: get(composicao, "Placa"),
    tipoVeiculo: get(composicao, "Tipo de Veículo"),
    equipe: readRows(sheets.get("equipe")).map((row) => ({
      nome: get(row, "Nome"),
      funcao: get(row, "Função"),
    })),
    obra: {
      ovNota: get(obra, "OV / Nota"),
      tipo: get(obra, "Tipo"),
      municipio: get(obra, "Município"),
      conjunto: get(obra, "Conjunto"),
      empreendimento: get(obra, "Empreendimento"),
      pep: get(obra, "PEP"),
      ordemDcd: get(obra, "Ordem DCD"),
      circuitos: get(obra, "Circuitos"),
      status: get(obra, "Status da Obra"),
    },
    cronograma: {
      deslocInicio: get(cronograma, "Deslocamento Início"),
      deslocFim: get(cronograma, "Deslocamento Fim"),
      deslocMin: toMinutes(get(cronograma, "Deslocamento Duração")),
      atividadeInicio,
      voltaInicio,
      voltaFim: get(cronograma, "Volta Fim"),
      voltaMin: toMinutes(get(cronograma, "Volta Duração")),
      obraMin: minutesBetween(atividadeInicio, voltaInicio),
      alteracao: get(cronograma, "Alteração de Execução"),
      justificativa: get(cronograma, "Justificativa da Alteração"),
      observacoes: get(cronograma, "Observações Gerais"),
    },
    pausas,
    aterramento,
    equipamentos,
    pontos: parseExecutionPoints(readRows(sheets.get("execucao"))),
    localizacao: parseLocation(readRows(sheets.get("localizacao"))),
    dp: parseDp(readRows(sheets.get("dp"))),
  };
}

export async function parseReportWorkbook(file: File): Promise<ParsedReport> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(await file.arrayBuffer());

  const sheets = new Map<string, ExcelJS.Worksheet>();
  workbook.eachSheet((sheet) => sheets.set(normalize(sheet.name), sheet));

  const id = `${file.name}-${file.lastModified}-${file.size}`;

  if (sheets.has("composicao")) return parsePartner(sheets, id, file.name);
  if (sheets.has("resumo") && sheets.has("membros")) {
    return parseEdp(sheets, id, file.name);
  }

  throw new Error(
    `"${file.name}" não é um relatório do app SIGO: nenhuma aba "Composição" (parceiro) ou "Resumo" (EDP) foi encontrada.`,
  );
}
