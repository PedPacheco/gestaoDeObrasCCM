export type ReportKind = "EDP" | "PARCEIRO";

export interface ExecutionPoint {
  ponto: string;
  sigla: string;
  ov: string;
  executado: string;
  responsabilidade: string;
  restricao: string;
  observacao: string;
}

export interface TeamMember {
  sigla: string;
  parceira: string;
  nome: string;
  funcao: string;
  presente: boolean;
  equipeAusente: boolean;
}

export interface LocationEvent {
  evento: string;
  horario: string;
  latitude: number | null;
  longitude: number | null;
}

export interface DpSheet {
  horaInicio: string;
  horaConclusao: string;
  contatoInicioCOI: string;
  contatoTerminoCOI: string;
  justificarAtraso: string;
  duracaoProgMin: number | null;
  duracaoRealMin: number | null;
  atrasoMin: number | null;
  chaveProvisoria: string;
  motivoChave: string;
  refInstalacao: string;
  chaveRetirada: string;
  refChaveRetirada: string;
  observacoes: string;
  colaboradorEDP: string;
  colaboradorParceira: string;
}

export interface GroundingPoint {
  coordenada: string;
  rua: string;
  numeroPonto: string;
  tipoPoste: string;
  medicaoOhm: number | null;
  qtHastes: number | null;
}

export interface EquipmentRow {
  ponto: string;
  situacao: string;
  equipamento: string;
  instalacao: string;
  potencia: string;
  patrimonio: string;
  tipo: string;
}

export interface Pause {
  inicio: string;
  fim: string;
  duracaoMin: number | null;
  motivo: string;
}

export interface Schedule {
  deslocInicio: string;
  deslocFim: string;
  deslocMin: number | null;
  atividadeInicio: string;
  voltaInicio: string;
  voltaFim: string;
  voltaMin: number | null;
  obraMin: number | null;
  alteracao: string;
  justificativa: string;
  observacoes: string;
}

export interface Work {
  ovNota: string;
  tipo: string;
  municipio: string;
  conjunto: string;
  empreendimento: string;
  pep: string;
  ordemDcd: string;
  circuitos: string;
  status: string;
}

interface BaseReport {
  id: string;
  fileName: string;
  data: string;
  hora: string;
  pontos: ExecutionPoint[];
  localizacao: LocationEvent[];
  dp: DpSheet | null;
}

export interface EdpReport extends BaseReport {
  kind: "EDP";
  equipesConferidas: number;
  siglas: string[];
  supervisores: string;
  tecnicos: string;
  membros: TeamMember[];
  voltaMin: number | null;
  asBuild: {
    alteracao: string;
    justificativa: string;
    observacoes: string;
    fotos: number;
  } | null;
}

export interface PartnerReport extends BaseReport {
  kind: "PARCEIRO";
  lider: string;
  sigla: string;
  parceira: string;
  composicao: string;
  tipoEquipe: string;
  placa: string;
  tipoVeiculo: string;
  equipe: { nome: string; funcao: string }[];
  obra: Work;
  cronograma: Schedule;
  pausas: Pause[];
  aterramento: GroundingPoint[];
  equipamentos: EquipmentRow[];
}

export type ParsedReport = EdpReport | PartnerReport;
