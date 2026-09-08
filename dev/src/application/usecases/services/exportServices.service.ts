import { Inject, Injectable } from '@nestjs/common';
import {
  IWorkServicesQueryRepository,
  WORK_SERVICES_QUERY_REPOSITORY,
} from 'src/domain/repositories/worksService/IWorkServicesQueryRepository';
import { ExportServicesPdfOutput } from '../export/services/exportPdfServices.service';
import {
  ExportServicesExcelOutput,
  WorkToExportResponse,
} from 'src/interface/types/servicesInterface';
import { ExportFileType } from 'src/interface/dtos/workServicesDTO';
@Injectable()
export class ExportServicesService {
  constructor(
    @Inject(WORK_SERVICES_QUERY_REPOSITORY)
    private readonly workServicesQueryRepository: IWorkServicesQueryRepository,
  ) {}

  async getServicesToExportation(params: {
    dataFinal: string;
    dataInicial: string;
    idParceira: number[];
    idEquipe?: number[];
    fileType: ExportFileType;
  }): Promise<ExportServicesPdfOutput[] | ExportServicesExcelOutput[]> {
    const response =
      await this.workServicesQueryRepository.getServicesToExportation({
        ...params,
        idEquipe: params.idEquipe ?? [],
      });

    if (params.fileType === 'pdf') {
      return this.formatServicesToPdf(response);
    }

    return this.formatServicesToExcel(response);
  }

  private formatServicesToPdf(
    services: WorkToExportResponse[],
  ): ExportServicesPdfOutput[] {
    const documentsMap = new Map<string, ExportServicesPdfOutput>();

    for (const obra of services) {
      const programacoesMap = new Map(
        obra.programacoes.map((programacao) => [programacao.id, programacao]),
      );

      for (const servico of obra.servicos) {
        if (!servico.id_programacao || !servico.id_equipe) {
          continue;
        }

        const programacao = programacoesMap.get(servico.id_programacao);

        if (!programacao) {
          continue;
        }

        const key = `${obra.ovnota}-${programacao.id}-${servico.id_equipe}`;

        let document = documentsMap.get(key);

        if (!document) {
          document = {
            ovnota: obra.ovnota,
            ordemDiagrama:
              obra.diagrama ??
              obra.ordem_dci ??
              obra.ordem_dca ??
              obra.ordem_dcd ??
              obra.ordem_dcim,
            referencia: obra.referencia,
            tipo_obra: obra.tipos.tipo_obra,
            municipio: obra.municipios.municipio,
            circuito: obra.circuitos.circuito,
            conjunto: obra.circuitos.conjuntos.conjunto,
            parceira: obra.turmas.turma,
            empreendimento: obra.empreendimento.empreendimento,
            programacao: {
              data_prog: programacao.data_prog,
              prog: programacao.prog,
              tipo_servico: programacao.tipo_servico,
              observacao_programacao: programacao.observacao_programacao,
              chi: programacao.chi,
              num_dp: programacao.num_dp,
              chave_provisoria: programacao.chave_provisoria,
            },

            servicos: [],
          };

          documentsMap.set(key, document);
        }

        const codigo =
          servico.servicos_contratos?.material ??
          servico.materiais?.codigo ??
          '-';

        const descricao =
          servico.servicos_contratos?.texto_breve ??
          servico.materiais?.descricao ??
          '-';

        document.servicos.push({
          equipe: servico.equipes?.equipe,
          operacao: servico.operacao,
          ponto: servico.ponto,
          prog: (servico.qtde_adicional ?? 0) + (servico.viabilizado ?? 0),
          real: null,
          codigo,
          descricao,
        });
      }
    }

    for (const document of documentsMap.values()) {
      document.servicos.sort((a, b) => {
        const pontoA = a.ponto;
        const pontoB = b.ponto;

        const [, tipoA = '', numeroA = '0'] =
          pontoA.match(/^([A-Za-z]+)(\d+)$/) ?? [];

        const [, tipoB = '', numeroB = '0'] =
          pontoB.match(/^([A-Za-z]+)(\d+)$/) ?? [];

        const tipoCompare = tipoA.localeCompare(tipoB);

        if (tipoCompare !== 0) {
          return tipoCompare;
        }

        const numeroCompare = Number(numeroA) - Number(numeroB);

        if (numeroCompare !== 0) {
          return numeroCompare;
        }

        return a.operacao.localeCompare(b.operacao);
      });
    }

    return Array.from(documentsMap.values());
  }

  private formatServicesToExcel(
    services: WorkToExportResponse[],
  ): ExportServicesExcelOutput[] {
    const excelData: ExportServicesExcelOutput[] = [];

    for (const obra of services) {
      const programacoesMap = new Map(
        obra.programacoes.map((programacao) => [programacao.id, programacao]),
      );

      for (const servico of obra.servicos) {
        const programacao = servico.id_programacao
          ? programacoesMap.get(servico.id_programacao)
          : null;

        const codigo =
          servico.servicos_contratos?.material ??
          servico.materiais?.codigo ??
          '-';

        const descricao =
          servico.servicos_contratos?.texto_breve ??
          servico.materiais?.descricao ??
          '-';

        const preco =
          servico.servicos_contratos?.preco ??
          servico.materiais?.preco.toNumber();

        const quantidadeProgramada =
          (servico.qtde_adicional ?? 0) + (servico.viabilizado ?? 0);

        const valorTotal = preco * quantidadeProgramada;

        const tipo = servico.materiais?.codigo ? 'M' : 'S';

        const unidade =
          servico.materiais?.unidade ?? servico.servicos_contratos?.medida;

        excelData.push({
          ovnota: obra.ovnota,
          ordemDiagrama:
            obra.diagrama ??
            obra.ordem_dci ??
            obra.ordem_dca ??
            obra.ordem_dcd ??
            obra.ordem_dcim,
          referencia: obra.referencia,
          tipoObra: obra.tipos.tipo_obra,
          municipio: obra.municipios.municipio,
          circuito: obra.circuitos.circuito,
          conjunto: obra.circuitos.conjuntos.conjunto,
          executado: obra.executado,
          parceira: obra.turmas.turma,
          empreendimento: obra.empreendimento.empreendimento,
          dataProg: programacao?.data_prog ?? null,
          prog: programacao?.prog ?? null,
          observacaoProgramacao: programacao?.observacao_programacao ?? null,
          numDp: programacao?.num_dp ?? null,
          horaIni: programacao?.hora_ini ?? null,
          horaTer: programacao?.hora_ter ?? null,
          equipeLv: programacao?.equipe_linha_viva ?? 0,
          equipeLm: programacao?.equipe_linha_morta ?? 0,
          equipeRegul: programacao?.equipe_regularizacao ?? 0,
          tecnicoResponsavel: programacao?.tecnicos.tecnico,
          equipe: servico.equipes?.equipe ?? null,
          operacao: servico.operacao,
          ponto: servico.ponto,
          preco,
          tipo,
          unidade,
          codigo,
          descricao,
          valorTotal,
          quantidadeProgramada,
        });
      }
    }

    return excelData;
  }
}
