import {
  AdvancePartnerFormValues,
  AdvancePartnerPillarConfig,
  CreateAdvancePartnerPayload,
  FieldErrors,
  PartnerOption,
} from "../types";

// advance-partner.config.ts

/**
 * Configuração do formulário de lançamento.
 * Fica definida fora dos componentes para manter a referência estável
 * (evita que o useEffect do modal reinicie o formulário).
 */
export const ADVANCE_PARTNER_PILLARS: AdvancePartnerPillarConfig[] = [
  {
    pillar: "Processo",
    reflectionKey: "procReflexao",
    indicators: [
      {
        name: "Nº de semanas programadas",
        key: "procNumSemanasProg",
        format: "number",
      },
      {
        name: "Aderência à eliminação de restrições",
        key: "procAderenciaElimRestr",
        format: "percentage",
      },
      {
        name: "Aderência à programação",
        key: "procAderenciaProg",
        format: "percentage",
      },
    ],
  },
  {
    pillar: "Prazo",
    reflectionKey: "prazoReflexao",
    indicators: [
      {
        name: "Aderência à execução",
        key: "prazoAderenciaExec",
        format: "percentage",
      },
      {
        name: "Multas",
        key: "prazoMultas",
        format: "currency",
        direction: "down",
      },
      {
        name: "Backlog de vencidas",
        key: "prazoBacklogVencidas",
        format: "number",
        direction: "down",
      },
    ],
  },
  {
    pillar: "Retrabalhos",
    reflectionKey: "retrReflexao",
    indicators: [
      {
        name: "Tempo de resolução D5",
        key: "retrTempoResolD5",
        format: "days",
        direction: "down",
      },
      {
        name: "Backlog D5 (qtd.)",
        key: "retrBacklogD5Qtd",
        format: "number",
        direction: "down",
      },
      {
        name: "Backlog D5 (valor)",
        key: "retrBacklogD5Valor",
        format: "currency",
        direction: "down",
      },
      {
        name: "Taxa de retrabalho",
        key: "retrTaxa",
        format: "percentage",
        direction: "down",
      },
    ],
  },
  {
    pillar: "WPA",
    reflectionKey: "wpaReflexao",
    indicators: [
      {
        name: "Ociosidade",
        key: "wpaOciosidade",
        format: "minutes",
        direction: "down",
      },
      {
        name: "TMS saída da base",
        key: "wpaTmsSaidaBase",
        format: "minutes",
        direction: "down",
      },
      { name: "Ocupação", key: "wpaOcupacao", format: "percentage" },
      {
        name: "Aderência à disponibilidade",
        key: "wpaAderenciaDisp",
        format: "percentage",
      },
    ],
  },
  {
    pillar: "Clientes",
    reflectionKey: "cliReflexao",
    indicators: [
      {
        name: "Entrada de reclamações",
        key: "cliEntradaReclamacoes",
        format: "number",
        direction: "down",
      },
      {
        name: "Reclamações fora do prazo",
        key: "cliReclamacoesForaPrazo",
        format: "percentage",
        direction: "down",
      },
      {
        name: "Procedência das reclamações",
        key: "cliProcedenciaReclamacoes",
        format: "percentage",
        direction: "down",
      },
    ],
  },
];

// advance-partner.form.ts
export function buildInitialValues(
  pillars: AdvancePartnerPillarConfig[],
  partners: PartnerOption[],
): AdvancePartnerFormValues {
  return {
    // Com uma só parceira, fica pré-selecionada; com várias, o utilizador escolhe
    idParceira: partners.length === 1 ? partners[0].id : 0,
    mesReferencia: new Date().getMonth() + 1,
    pillars: Object.fromEntries(
      pillars.map((p) => [
        p.pillar,
        {
          reflection: "",
          values: Object.fromEntries(p.indicators.map((i) => [i.key, ""])),
        },
      ]),
    ),
  };
}

export function toPayload(
  form: AdvancePartnerFormValues,
  pillars: AdvancePartnerPillarConfig[],
): { payload?: CreateAdvancePartnerPayload; errors: FieldErrors } {
  const errors: FieldErrors = {};
  const payload: Record<string, unknown> = {
    idParceira: form.idParceira,
    mesReferencia: form.mesReferencia,
  };

  if (!form.idParceira) errors.idParceira = "Selecione a parceira.";
  if (!form.mesReferencia)
    errors.mesReferencia = "Selecione o mês de referência.";

  for (const pillar of pillars) {
    const entry = form.pillars[pillar.pillar];

    for (const ind of pillar.indicators) {
      const raw = entry?.values[ind.key] ?? "";
      const value = raw === "" ? NaN : Number(raw); // o NumericFormat já devolve "1234.5"

      if (!Number.isFinite(value)) errors[ind.key] = "Campo obrigatório.";

      payload[ind.key] = value;
    }

    payload[pillar.reflectionKey] = entry?.reflection.trim() ?? "";
  }

  return Object.keys(errors).length
    ? { errors }
    : { payload: payload as CreateAdvancePartnerPayload, errors };
}
