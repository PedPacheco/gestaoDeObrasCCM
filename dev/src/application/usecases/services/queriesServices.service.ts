import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  GetAllItemsOutput,
  GetNotScheduledServicesOutput,
  GetSelectedServicesOutput,
  GetServiceScheduleHistoryByIdScheduleOutput,
} from 'src/application/types';
import {
  GET_WORKS_DETAILS_REPOSITORY,
  IGetWorksDetailsRepository,
} from 'src/domain/contracts/works/IGetWorksDetailsRepository';
import {
  IWorkServicesQueryRepository,
  WORK_SERVICES_QUERY_REPOSITORY,
} from 'src/domain/contracts/worksService/IWorkServicesQueryRepository';
import { GetSelectedServicesParamsRequest } from 'src/domain/types';

import { serviceTypeLabel } from 'src/utils/serviceType.utils';

@Injectable()
export class QueriesServicesService {
  constructor(
    @Inject(WORK_SERVICES_QUERY_REPOSITORY)
    private readonly workServicesQueryRepository: IWorkServicesQueryRepository,
    @Inject(GET_WORKS_DETAILS_REPOSITORY)
    private readonly getWorksDetailsRepository: IGetWorksDetailsRepository,
  ) {}

  async getAllItems(id: number): Promise<GetAllItemsOutput[]> {
    const services =
      await this.workServicesQueryRepository.getAllServicesOfWork(id);

    if (!services) {
      throw new NotFoundException('Obra não encontrada');
    }

    const response = services.map((service) => {
      const preco = Number(
        service.servicos_contratos?.preco ?? service.materiais?.preco ?? 0,
      );

      const qtdeTotal = service.qtde_plan + service.qtde_adicional;

      return {
        idObra: service.id_obra,
        operacao: service.operacao,
        ponto: service.ponto,
        numeroOperacao: service.numero_operacao,
        descricaoOperacao: service.descricao_operacao,
        material:
          service.servicos_contratos?.material ?? service.materiais?.codigo,
        textoBreve:
          service.servicos_contratos?.texto_breve ??
          service.materiais?.descricao,
        qtdePlanejada: service.qtde_plan,
        qtdeAdicional: service.qtde_adicional,
        viabilizado: service.viabilizado,
        qtdeProgramada: service.qtde_prog,
        qtdeRealizada: service.qtde_real,
        tipo: serviceTypeLabel(service),
        valorUnit: preco,
        valorTotal: preco * qtdeTotal,
        valorReal: preco * service.qtde_real,
      };
    });

    return response;
  }

  async getNotScheduledServices(
    id: number,
  ): Promise<GetNotScheduledServicesOutput[]> {
    const services =
      await this.workServicesQueryRepository.getNotScheduledServices(id);

    if (!services || services.length === 0) {
      throw new NotFoundException('Obra não encontrada');
    }

    return services.reduce((acc, service) => {
      const total = (service.viabilizado ?? 0) + (service.qtde_adicional ?? 0);
      const totalReal = service.qtde_real ?? 0;
      const totalProg = service.qtde_prog ?? 0;

      if (totalReal === total || totalProg === total) return acc;

      const precoServico = service.servicos_contratos?.preco;
      const precoMaterial = service.materiais?.preco;
      const preco = Number(precoServico ?? precoMaterial ?? 0);

      const saldoDisponivel = total - Math.max(totalReal, totalProg);

      acc.push({
        idObra: service.id_obra,
        operacao: service.operacao,
        ponto: service.ponto,
        numeroOperacao: service.numero_operacao,
        descricaoOperacao: service.descricao_operacao,
        material:
          service.servicos_contratos?.material ?? service.materiais?.codigo,
        textoBreve:
          service.servicos_contratos?.texto_breve ??
          service.materiais?.descricao,
        qtdePlanejada: service.qtde_plan,
        qtdeAdicional: service.qtde_adicional,
        viabilizado: service.viabilizado,
        saldoDisponivel,
        qtdeRealizada: service.qtde_real,
        qtdeProgramada: totalProg,
        tipo: serviceTypeLabel(service),
        valorUnit: preco,
        valorTotal: preco * total,
        valorReal: preco * totalReal,
      });

      return acc;
    }, [] as GetNotScheduledServicesOutput[]);
  }

  async getSelectedServices(
    params: GetSelectedServicesParamsRequest,
  ): Promise<GetSelectedServicesOutput[]> {
    const items =
      await this.workServicesQueryRepository.getSelectedServices(params);

    if (!items) {
      throw new NotFoundException('Obra não encontrada');
    }

    return items.map((item) => {
      const service = item.servicos;

      const preco = Number(
        service.servicos_contratos?.preco ?? service.materiais?.preco ?? 0,
      );

      return {
        idObra: service.id_obra,
        operacao: service.operacao,
        ponto: service.ponto,
        numeroOperacao: service.numero_operacao,
        descricaoOperacao: service.descricao_operacao,
        material:
          service.servicos_contratos?.material ?? service.materiais?.codigo,
        textoBreve:
          service.servicos_contratos?.texto_breve ??
          service.materiais?.descricao,
        dataProgramada: item.programacoes?.data_prog,
        qtdePlanejada: service.qtde_plan,
        qtdeProgramada: item.prog,
        qtdeRealizada: item.real,
        qtdeAdicional: item.adicional,
        viabilizado: service.viabilizado,
        tipo: serviceTypeLabel(service),
        valorUnit: preco,
        valorProg: preco * (item.prog ?? 0),
        valorReal: preco * (item.real ?? 0),
        equipe: item.equipes?.equipe,
        encarregado: item.equipes?.encarregado,
        perfil: item.equipes?.perfil,
      };
    });
  }

  async getServiceScheduleHistory(id: number) {
    const services =
      await this.workServicesQueryRepository.getServiceScheduleHistory(id);

    return services.map((item) => {
      const descricao =
        item.servicos?.servicos_contratos?.texto_breve ??
        item.servicos?.materiais?.descricao;

      const codigo =
        item.servicos?.servicos_contratos?.material ??
        item.servicos?.materiais?.codigo;

      return {
        id: item.id,
        idProg: item.id_programacao,
        idServico: item.id_servico,
        operacao: item.servicos.operacao,
        numeroOperacao: item.servicos.numero_operacao,
        descricaoOperacao: item.servicos.descricao_operacao,
        ponto: item.servicos.ponto,
        codigo,
        textoBreve: descricao,
        tipo: serviceTypeLabel(item.servicos),
        dataProgramada: item.programacoes?.data_prog,
        qtdeProgramada: item.prog,
        qtdePlanejada: item.servicos.qtde_plan,
        qtdeViabilizado: item.servicos.viabilizado,
        qtdeAdicional: item.adicional,
        qtdeRealizada: item.real,
        equipe: item.equipes?.equipe,
        perfil: item.equipes?.perfil,
      };
    });
  }

  async getServiceScheduleHistoryByIdSchedule(
    ids: number[],
  ): Promise<GetServiceScheduleHistoryByIdScheduleOutput[]> {
    const services =
      await this.workServicesQueryRepository.getServiceScheduleHistoryByIdSchedule(
        ids,
      );

    return services.map((item) => {
      const descricao =
        item.servicos?.servicos_contratos?.texto_breve ??
        item.servicos?.materiais?.descricao;

      const codigo =
        item.servicos?.servicos_contratos?.material ??
        item.servicos?.materiais?.codigo;

      const preco = Number(
        item.servicos?.servicos_contratos?.preco ??
          item.servicos?.materiais?.preco ??
          0,
      );

      return {
        id: item.id,
        idProg: item.id_programacao,
        idServico: item.id_servico,
        operacao: item.servicos.operacao,
        numeroOperacao: item.servicos.numero_operacao,
        descricaoOperacao: item.servicos.descricao_operacao,
        ponto: item.servicos.ponto,
        codigo,
        textoBreve: descricao,
        tipo: serviceTypeLabel(item.servicos),
        dataProgramada: item.programacoes?.data_prog,
        qtdeProgramada: item.prog,
        qtdePlanejada: item.servicos.qtde_plan,
        qtdeViabilizado: item.servicos.viabilizado,
        qtdeAdicional: item.adicional,
        qtdeRealizada: item.real,
        equipe: item.equipes?.equipe,
        perfil: item.equipes?.perfil,
        preco,
      };
    });
  }

  async getServiceContracts(idWork: number) {
    const work = await this.getWorksDetailsRepository.get(idWork);

    const idParceira = work?.id_turma;

    const data =
      await this.workServicesQueryRepository.getServicesContracts(idParceira);

    return data;
  }

  async getMaterials() {
    return await this.workServicesQueryRepository.getMaterialsContract();
  }

  async getTeamsServices(idWork: number) {
    const work = await this.getWorksDetailsRepository.get(idWork);

    const idParceira = work?.id_turma;

    const data =
      await this.workServicesQueryRepository.getTeamsServices(idParceira);

    return data;
  }

  async getServiceOptions(id: number) {
    return await this.workServicesQueryRepository.getServiceOptions(id);
  }
}
