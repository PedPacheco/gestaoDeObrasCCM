import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  WORKS_SERVICE_REPOSITORY,
  IWorksServicesRepository,
} from 'src/domain/repositories/IWorksServiceRepository';
import {
  GetByIdParamsInterface,
  GetSelectedServicesParamsInterface,
} from 'src/interface/types/servicesInterface';

@Injectable()
export class WorksServicesService {
  constructor(
    @Inject(WORKS_SERVICE_REPOSITORY)
    private readonly worksServicesRepository: IWorksServicesRepository,
  ) {}

  async getById(params: GetByIdParamsInterface) {
    const services = await this.worksServicesRepository.getServices(params);

    if (!services) {
      throw new NotFoundException('Obra não encontrada');
    }

    return services.map((service) => ({
      id: service.id,
      idObra: service.id_obra,
      ovnota: service.obras.ovnota,
      operacao: service.operacao,
      ponto: service.ponto,
      material: service.servicos_contratos.material,
      textoBreve: service.servicos_contratos.texto_breve,
      medida: service.servicos_contratos.medida,
      contrato: service.servicos_contratos.contrato,
      dataProgramada: service.data_prog,
      qtdePlanejada: service.qtde_plan,
      qtdeProgramada: service.qtde_prog,
      qtdeRealizada: service.qtde_real,
      preco: service.servicos_contratos.preco,
    }));
  }

  async getSelectedServices(params: GetSelectedServicesParamsInterface) {
    const services =
      await this.worksServicesRepository.getSelectedServices(params);

    if (!services) {
      throw new NotFoundException('Obra não encontrada');
    }

    return services.map((service) => ({
      id: service.id,
      idObra: service.id_obra,
      ovnota: service.obras.ovnota,
      operacao: service.operacao,
      ponto: service.ponto,
      material: service.servicos_contratos.material,
      textoBreve: service.servicos_contratos.texto_breve,
      medida: service.servicos_contratos.medida,
      contrato: service.servicos_contratos.contrato,
      dataProgramada: service.data_prog,
      qtdePlanejada: service.qtde_plan,
      qtdeProgramada: service.qtde_prog,
      qtdeRealizada: service.qtde_real,
      preco: service.servicos_contratos.preco,
      equipe: service.equipes.encarregado,
      encarregado: service.equipes.encarregado,
      perfil: service.equipes.perfil,
    }));
  }

  async getServiceScheduleHistory(id: number) {
    const services =
      await this.worksServicesRepository.getServiceScheduleHistory(id);

    return services;
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

  async getAdditionalServices() {
    const data = await this.worksServicesRepository.getAdditionalServices();

    return data;
  }
}
