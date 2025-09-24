import { Injectable } from '@nestjs/common';
import { MarketWork, NoteWorks } from 'src/domain/entities/works.entity';
import {
  Groups,
  IInsertWorksRepository,
} from 'src/domain/repositories/works/IInsertWorksRepository';
import { PrismaService } from 'src/infra/prisma/prisma.service';

@Injectable()
export class InsertWorksRepository implements IInsertWorksRepository {
  constructor(private readonly prisma: PrismaService) {}

  async insertMarketWorks(works: MarketWork[]): Promise<void> {
    try {
      const data = works.map((work: MarketWork) => {
        return {
          ovnota: work.obra,
          pep: work.pep,
          diagrama: work.diagrama,
          entrada: new Date(work.entrada),
          referencia: work.referencia,
          observ_obra: work.observacao,
          id_gpm: work.idMunicipio || 1,
          id_tipo: work.idTipo || 1,
          prazo: work.prazo,
          mo_planejada: work.moPlanejada,
          id_turma: work.idParceira || 1,
          id_circuito: work.idCircuito || 1,
          status_ov_sap: work.statusOv,
          id_empreendimento: 1,
        };
      });

      await this.prisma.obras.createMany({
        data,
        skipDuplicates: true,
      });
    } catch (error) {
      console.error('Erro ao inserir obras de mercado:', error);
    }
  }

  async insertNotes(works: NoteWorks[]): Promise<void> {
    try {
      const data = works.map((work) => {
        return {
          ovnota: work.obra,
          pep: work.pep,
          ordem_dci: work.dci,
          ordem_dcd: work.dcd,
          ordem_dca: work.dca,
          ordem_dcim: work.dcim,
          entrada: new Date(work.entrada),
          prazo: Number(work.prazoTexto),
          referencia: work.referencia,
          mo_planejada: work.moPlanejada,
          qtde_planejada: work.qtdePlanejada,
          id_gpm: work.idMunicipio || 1,
          id_empreendimento: work.idEmpreendimento || 1,
          id_tipo: work.idTipo || 1,
          id_turma: work.idParceira || 1,
          id_circuito: work.idCircuito || 1,
          capex_mo_plan: work.capexMoPlan,
          capex_mat_plan: work.capexMatPlan,
          ano_plan: work.anoPlan,
        };
      });

      await this.prisma.obras.createMany({
        data,
        skipDuplicates: true,
      });
    } catch (error) {
      console.error('Erro ao inserir notas:', error);
    }
  }

  async getGroup(): Promise<Groups[]> {
    try {
      return await this.prisma.tipos.findMany({
        select: { id: true, id_grupo: true },
      });
    } catch (error) {
      console.error('Erro ao procurar grupos:', error);
    }
  }
}
