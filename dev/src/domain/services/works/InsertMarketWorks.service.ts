import { IInsertMarketWorksRepository } from './../../repositories/works/IInsertMarketWorksRepository';
import { Inject, Injectable } from '@nestjs/common';
import { Work } from 'src/domain/entities/works.entity';
import { INSERT_MARKET_WORKS_REPOSITORY } from 'src/domain/repositories/works/IInsertMarketWorksRepository';
import { InsertMarketWorksDTO } from 'src/interface/dtos/entryDto';

@Injectable()
export class InsertMarketWorksService {
  constructor(
    @Inject(INSERT_MARKET_WORKS_REPOSITORY)
    private readonly InsertMarketWorksRepository: IInsertMarketWorksRepository,
  ) {}

  async insertMany(params: InsertMarketWorksDTO[]): Promise<void> {
    const works = params.map(
      (work) =>
        new Work(
          work.obra,
          work.pep,
          work.diagrama,
          work.entrada,
          work.observacao,
          work.statusOv,
          work.statusDiagrama,
          work.statusPep,
          work.gpm,
          work.tipo,
          work.circuito,
          work.prazoTexto,
          work.tecnicoResp,
          work.equipeNumPedido,
          work.moCliente,
          work.moEmpresa,
        ),
    );

    await this.InsertMarketWorksRepository.insert(works);
  }
}
