import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import { GetSelectedServicesParamsInterface } from 'src/interface/types/servicesInterface';
import { GetWorkDetailsService } from '../works/getWorkDetails.service';
import {
  IWorkServicesQueryRepository,
  WORK_SERVICES_QUERY_REPOSITORY,
} from 'src/domain/contracts/worksService/IWorkServicesQueryRepository';

@Injectable()
export class QueriesServicesService {
  constructor(
    @Inject(WORK_SERVICES_QUERY_REPOSITORY)
    private readonly workServicesQueryRepository: IWorkServicesQueryRepository,
    private readonly getWorkDetailsService: GetWorkDetailsService,
  ) {}

  async getAllItems(id: number) {
    const services =
      await this.workServicesQueryRepository.getAllServicesOfWork(id);

    if (!services) {
      throw new NotFoundException('Obra não encontrada');
    }

    const response = services.map((service) => {
      const preco =
        service.servicos_contratos?.preco ??
        service.materiais?.preco.toNumber();

      const qtdeTotal = service.qtde_plan + service.qtde_adicional;

      return {
        id: service.id,
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
        dataProgramada: service.programacoes?.data_prog,
        qtdePlanejada: service.qtde_plan,
        qtdeAdicional: service.qtde_adicional,
        viabilizado: service.viabilizado,
        qtdeProgramada: service.qtde_prog,
        qtdeRealizada: service.qtde_real,
        tipo: service.materiais?.codigo ? 'M' : 'S',
        valorUnit: preco,
        valorTotal: preco * qtdeTotal,
        valorReal: preco * service.qtde_real,
      };
    });

    return response;
  }

  async getNotScheduledServices(id: number) {
    const services =
      await this.workServicesQueryRepository.getNotScheduledServices(id);

    if (!services) {
      throw new NotFoundException('Obra não encontrada');
    }

    const response = services.map((service) => {
      const precoServico = service.servicos_contratos?.preco;
      const precoMaterial = service.materiais?.preco;

      const preco = Number(precoServico ?? precoMaterial);

      const viabilizado = service.viabilizado;
      const qtdeAdicional = service.qtde_adicional ?? 0;
      const qtdeRealizada = service.qtde_real ?? 0;

      const qtdeTotal = viabilizado + qtdeAdicional - qtdeRealizada;

      return {
        id: service.id,
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
        dataProgramada: service.programacoes?.data_prog,
        qtdePlanejada: service.qtde_plan,
        qtdeAdicional: service.qtde_adicional,
        viabilizado: service.viabilizado,
        qtdeRealizada: service.qtde_real,
        tipo: service.materiais?.codigo ? 'M' : 'S',
        valorUnit: preco,
        valorTotal: preco * qtdeTotal,
        valorReal: preco * service.qtde_real,
      };
    });

    return response;
  }

  async getSelectedServices(params: GetSelectedServicesParamsInterface) {
    const services =
      await this.workServicesQueryRepository.getSelectedServices(params);

    if (!services) {
      throw new NotFoundException('Obra não encontrada');
    }

    return services.map((service) => {
      const preco =
        service.servicos_contratos?.preco ??
        service.materiais?.preco.toNumber();

      return {
        id: service.id,
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
        dataProgramada: service.programacoes.data_prog,
        qtdePlanejada: service.qtde_plan,
        qtdeProgramada: service.qtde_prog,
        qtdeRealizada: service.qtde_real,
        qtdeAdicional: service.qtde_adicional,
        viabilizado: service.viabilizado,
        tipo: service.materiais?.codigo ? 'M' : 'S',
        valorUnit: preco,
        valorProg: preco * service.qtde_prog,
        valorReal: preco * service.qtde_real,
        equipe: service.equipes.equipe,
        encarregado: service.equipes.encarregado,
        perfil: service.equipes.perfil,
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
        tipo: item.servicos?.materiais?.codigo ? 'M' : 'S',
        dataProgramada: item.programacoes?.data_prog,
        qtdeProgramada: item.prog,
        qtdePlanejada: item.servicos.qtde_plan,
        qtdeViabilizado: item.servicos.viabilizado,
        qtdeAdicional: item.adicional,
        qtdeRealizada: item.real,
        equipe: item.equipes.equipe,
        perfil: item.equipes.perfil,
      };
    });
  }

  async getServiceContracts(idWork: number) {
    const work = await this.getWorkDetailsService.get(idWork);

    const idParceira = work?.id_turma;

    const data =
      await this.workServicesQueryRepository.getServicesContracts(idParceira);

    return data;
  }

  async getMaterials() {
    return await this.workServicesQueryRepository.getMaterialsContract();
  }

  async getTeamsServices(idWork: number) {
    const work = await this.getWorkDetailsService.get(idWork);

    const idParceira = work?.id_turma;

    const data =
      await this.workServicesQueryRepository.getTeamsServices(idParceira);

    return data;
  }

  async getServiceOptions(id: number) {
    return await this.workServicesQueryRepository.getServiceOptions(id);
  }
}
