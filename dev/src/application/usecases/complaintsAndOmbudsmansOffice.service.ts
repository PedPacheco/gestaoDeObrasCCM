import { Inject, Injectable } from '@nestjs/common';
import {
  COMPLAINTS_AND_OMBUDSMANS_OFFICE_REPOSITORY,
  IComplaintsAndOmbudsmansOfficeRepository,
} from 'src/domain/repositories/IComplaintsAndOmbudsmansOfficeRepository';
import { ComplaintsAndOmbudsmansOfficeDTO } from 'src/interface/dtos/complaintsAndOmbudsmansOfficeDTO';

@Injectable()
export class ComplaintsAndOmbudsmansOfficeService {
  constructor(
    @Inject(COMPLAINTS_AND_OMBUDSMANS_OFFICE_REPOSITORY)
    private readonly repository: IComplaintsAndOmbudsmansOfficeRepository,
  ) {}

  async getMetrics(filters: ComplaintsAndOmbudsmansOfficeDTO): Promise<any> {
    const where = this.buildWhere(filters);

    const response = await this.repository.getMetrics(where);

    console.log(response);

    // const rows = await this.reclamacoes.findAll({
    //   parceiraIds: query.parceiras,
    //   municipioIds: query.municipios,
    //   busca: query.busca,
    // });
    // return buildReclamacoesMetrics(rows, todayIsoInSaoPaulo(now));
  }

  private buildWhere(filters: ComplaintsAndOmbudsmansOfficeDTO) {
    const where: any = {};

    if (filters.idRegional?.length) {
      where.municipios = {
        ...where.municipios,
        id_regional: { in: filters.idRegional },
      };
    }

    if (filters.idMunicipio?.length) {
      where.id_municipio = { in: filters.idMunicipio };
    }

    if (filters.idTipo?.length) {
      where.id_tipo = { in: filters.idTipo };
    }

    if (filters.idParceira?.length) {
      where.id_parceira = { in: filters.idParceira };
    }

    // if (filters.ovn?.length) {
    //   where.nota_d5 = { in: filters.idNotaD5 };
    // }

    return where;
  }
}
