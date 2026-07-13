import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  IWorksServicesRepository,
  WORKS_SERVICE_REPOSITORY,
} from 'src/domain/repositories/IWorksServiceRepository';
import {
  GetByIdParamsInterface,
  GetSelectedServicesParamsInterface,
} from 'src/interface/types/servicesInterface';
import { GetWorkDetailsService } from '../works/getWorkDetails.service';

@Injectable()
export class QueriesServicesService {
  constructor(
    @Inject(WORKS_SERVICE_REPOSITORY)
    private readonly worksServicesRepository: IWorksServicesRepository,
    private readonly getWorkDetailsService: GetWorkDetailsService,
  ) {}

  async getById(params: GetByIdParamsInterface) {
    const services =
      await this.worksServicesRepository.getNotScheduledServices(params);

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
        preco,
        valorUnit: preco * qtdeTotal,
        valorReal: preco * service.qtde_real,
      };
    });

    return response;
  }

  async getSelectedServices(params: GetSelectedServicesParamsInterface) {
    const services =
      await this.worksServicesRepository.getSelectedServices(params);

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
        preco,
        equipe: service.equipes.equipe,
        encarregado: service.equipes.encarregado,
        perfil: service.equipes.perfil,
        valorUnit: preco * service.qtde_prog,
      };
    });
  }

  async getServiceScheduleHistory(id: number) {
    const services =
      await this.worksServicesRepository.getServiceScheduleHistory(id);

    return services.map((item) => {
      const descricao =
        item.servicos?.servicos_contratos?.texto_breve ??
        item.servicos?.materiais?.descricao;

      return {
        id: item.id,
        idProg: item.id_programacao,
        idServico: item.id_servico,
        operacao: item.servicos.operacao,
        ponto: item.servicos.ponto,
        descricao,
        dataProgramada: item.programacoes?.data_prog,
        qtdeProgramada: item.prog,
        qtdePlanejada: item.plan,
        qtdeAdicional: item.adicional,
        qtdeRealizada: item.real,
        equipe: item.equipes.equipe,
      };
    });
  }

  async getServicesFilters(id: number) {
    const { services, operations, points } =
      await this.worksServicesRepository.getServicesFilters(id);

    return {
      services: services.map((s) => s.texto_breve),
      operations: operations.map((o) => o.operacao),
      points: points.map((p) => p.ponto),
    };
  }

  async getServiceContracts(idWork: number) {
    const work = await this.getWorkDetailsService.get(idWork);

    const idParceira = work?.id_turma;

    const data =
      await this.worksServicesRepository.getServicesContracts(idParceira);

    return data;
  }

  async getMaterials() {
    return await this.worksServicesRepository.getMaterialsContract();
  }

  async getTeamsServices(idWork: number) {
    const work = await this.getWorkDetailsService.get(idWork);

    const idParceira = work?.id_turma;

    const data =
      await this.worksServicesRepository.getTeamsServices(idParceira);

    return data;
  }
}
