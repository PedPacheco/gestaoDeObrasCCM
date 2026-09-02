import { Inject, Injectable } from '@nestjs/common';
import {
  ADVANCE_PARTNER_REPOSITORY,
  IAdvancePartnerRepository,
} from 'src/domain/repositories/IAdvancePartnerRepository';
import { IndicatorsDTO } from 'src/interface/dtos/advancePartnerDTO';
import { avanca_parceiro_monitoramento } from '@prisma/client';

type IndicatorFormat =
  'number' | 'percentage' | 'currency' | 'days' | 'minutes';

@Injectable()
export class GetAdvancePartnerIndicatorsService {
  constructor(
    @Inject(ADVANCE_PARTNER_REPOSITORY)
    private readonly advancePartnerRepository: IAdvancePartnerRepository,
  ) {}

  async execute(params: IndicatorsDTO): Promise<any[]> {
    const [config, monitoringList] = await Promise.all([
      this.advancePartnerRepository.getIndicatorsAdvancePartner(),
      this.advancePartnerRepository.getLatestMonitoringAdvancePartner(params),
    ]);

    const isSinglePartner = (params.idParceira?.length ?? 0) === 1;

    // registro mais recente do range, usado só para os campos de reflexão
    const latestMonitoring = [...monitoringList].sort(
      (a, b) =>
        new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime(),
    )[0];

    /** Reflexão só é exposta quando o filtro está restrito a uma única parceira */
    const getReflection = (
      field: keyof avanca_parceiro_monitoramento,
    ): string | null =>
      isSinglePartner ? ((latestMonitoring?.[field] as string) ?? null) : null;

    const sum = (field: keyof avanca_parceiro_monitoramento): number =>
      monitoringList.reduce((acc, m) => acc + (Number(m?.[field]) || 0), 0);

    const avg = (field: keyof avanca_parceiro_monitoramento): number => {
      if (monitoringList.length === 0) return 0;
      return sum(field) / monitoringList.length;
    };

    /** number e currency somam; os demais formatos (percentage, days, minutes) tiram média */
    const aggregate = (
      field: keyof avanca_parceiro_monitoramento,
      format: IndicatorFormat,
    ): number =>
      format === 'number' || format === 'currency' ? sum(field) : avg(field);

    return [
      {
        pillar: 'Processos',
        reflection: getReflection('proc_reflexao'),
        indicators: [
          {
            name: 'Nº Semanas Programadas',
            baseline: Number(config?.baseline_proc_num_semanas_prog) ?? 0,
            current: aggregate('proc_num_semanas_prog', 'number'),
            target: Number(config?.meta_proc_num_semanas_prog),
            format: 'number',
            direction: 'up',
          },
          {
            name: 'Aderência à Programação',
            baseline: Number(config?.baseline_proc_aderencia_prog) ?? 0,
            current: aggregate('proc_aderencia_prog', 'percentage'),
            target: Number(config?.meta_proc_aderencia_prog),
            format: 'percentage',
            direction: 'up',
          },
          {
            name: 'Aderência à Eliminação de Restrições',
            baseline: Number(config?.baseline_proc_aderencia_restr) ?? 0,
            current: aggregate('proc_aderencia_elim_restr', 'percentage'),
            target: Number(config?.meta_proc_aderencia_restr),
            format: 'percentage',
            direction: 'up',
          },
        ],
      },

      {
        pillar: 'Prazo',
        reflection: getReflection('prazo_reflexao'),
        indicators: [
          {
            name: 'Aderência aos Prazos de Execução',
            baseline: Number(config?.baseline_prazo_aderencia_exec) ?? 0,
            current: aggregate('prazo_aderencia_exec', 'percentage'),
            target: Number(config?.meta_prazo_aderencia_exec),
            format: 'percentage',
            direction: 'up',
          },
          {
            name: 'Multas por Transgressões de Prazo',
            baseline: Number(config?.baseline_prazo_multas) ?? 0,
            current: aggregate('prazo_multas', 'currency'),
            target: Number(config?.meta_prazo_multas),
            format: 'currency',
            direction: 'down',
          },
          {
            name: 'Backlog de Obras Vencidas',
            baseline: config?.baseline_prazo_backlog ?? 0,
            current: aggregate('prazo_backlog_vencidas', 'number'),
            target: config?.meta_prazo_backlog,
            format: 'number',
            direction: 'down',
          },
        ],
      },

      {
        pillar: 'Retrabalhos',
        reflection: getReflection('retr_reflexao'),
        indicators: [
          {
            name: 'Tempo Médio de Resolução Notas D5',
            baseline: config?.baseline_retr_tempo_d5 ?? 0,
            current: aggregate('retr_tempo_resol_d5', 'days'),
            target: config?.meta_retr_tempo_d5,
            format: 'days',
            direction: 'down',
          },
          {
            name: 'Backlog de Notas D5',
            baseline: config?.baseline_retr_backlog_d5_qtd ?? 0,
            current: aggregate('retr_backlog_d5_qtd', 'number'),
            target: config?.meta_retr_backlog_d5_qtd,
            format: 'number',
            direction: 'down',
          },
          {
            name: 'Backlog de Notas D5 (Valor R$)',
            baseline: Number(config?.baseline_retr_backlog_d5_valor) ?? 0,
            current: aggregate('retr_backlog_d5_valor', 'currency'),
            target: Number(config?.meta_retr_backlog_d5_valor),
            format: 'currency',
            withoutCurrency: true,
            direction: 'down',
          },
          {
            name: 'Taxa de Retrabalho',
            baseline: Number(config?.baseline_retr_taxa) ?? 0,
            current: aggregate('retr_taxa', 'percentage'),
            target: Number(config?.meta_retr_taxa),
            format: 'percentage',
            direction: 'down',
          },
        ],
      },

      {
        pillar: 'WPA',
        reflection: getReflection('wpa_reflexao'),
        indicators: [
          {
            name: 'Ociosidade',
            baseline: config?.baseline_wpa_ociosidade ?? 0,
            current: aggregate('wpa_ociosidade', 'minutes'),
            target: config?.meta_wpa_ociosidade,
            format: 'minutes',
            direction: 'down',
          },
          {
            name: 'Tempo Médio Saída Base TMS',
            baseline: config?.baseline_wpa_saida_base_tms ?? 0,
            current: aggregate('wpa_tms_saida_base', 'minutes'),
            target: config?.meta_wpa_saida_base_tms,
            format: 'minutes',
            direction: 'down',
          },
          {
            name: 'Ocupação via WPA',
            baseline: Number(config?.baseline_wpa_ocupacao) ?? 0,
            current: aggregate('wpa_ocupacao', 'percentage'),
            target: Number(config?.meta_wpa_ocupacao),
            format: 'percentage',
            direction: 'up',
          },
          {
            name: 'Aderência à Disponibilidade',
            baseline: Number(config?.baseline_wpa_aderencia_disp) ?? 0,
            current: aggregate('wpa_aderencia_disp', 'percentage'),
            target: Number(config?.meta_wpa_aderencia_disp),
            format: 'percentage',
            direction: 'up',
          },
        ],
      },

      {
        pillar: 'Clientes',
        reflection: getReflection('cli_reflexao'),
        indicators: [
          {
            name: 'Entrada de Reclamações por Mês',
            baseline: config?.baseline_clientes_entrada_reclamacoes ?? 0,
            current: aggregate('cli_entrada_reclamacoes', 'number'),
            target: config?.meta_clientes_entrada_reclamacoes,
            format: 'number',
            direction: 'down',
          },
          {
            name: 'Reclamações Fora do Prazo',
            baseline: Number(config?.baseline_clientes_fora_prazo) ?? 0,
            current: aggregate('cli_reclamacoes_fora_prazo', 'percentage'),
            target: Number(config?.meta_clientes_fora_prazo),
            format: 'percentage',
            direction: 'down',
          },
          {
            name: 'Procedência de Reclamações',
            baseline: Number(config?.baseline_clientes_procedencia) ?? 0,
            current: aggregate('cli_procedencia_reclamacoes', 'percentage'),
            target: Number(config?.meta_clientes_procedencia),
            format: 'percentage',
            direction: 'down',
          },
        ],
      },
    ];
  }
}
