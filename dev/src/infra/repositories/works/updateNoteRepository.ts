import { Injectable } from '@nestjs/common';
import { NoteWorks } from 'src/domain/entities/works.entity';
import { IUpdateNoteRepository } from 'src/domain/contracts/works/IUpdateNoteRepository';
import { PrismaService } from 'src/infra/prisma/prisma.service';

@Injectable()
export class UpdateNoteRepository implements IUpdateNoteRepository {
  constructor(private readonly prisma: PrismaService) {}

  async update(data: Partial<NoteWorks>[]): Promise<void> {
    await this.prisma.$transaction(
      data.map((item: any) => {
        const {
          obra,
          pep,
          ordem_dci,
          ordem_dcd,
          ordem_dca,
          ordem_dcim,
          entrada,
          prazo,
          referencia,
          id_gpm,
          id_tipo,
          id_circuito,
          id_empreendimento,
          id_turma,
          qtde_plan,
          mo_plan,
          capex_mat_plan,
          capex_mo_plan,
          ano_plan,
        } = item;

        return this.prisma.obras.update({
          where: { id: item.id },
          data: {
            ovnota: obra,
            pep,
            ordem_dci,
            ordem_dcd,
            ordem_dca,
            ordem_dcim,
            entrada,
            prazo,
            id_gpm,
            id_tipo,
            id_circuito,
            id_turma,
            id_empreendimento,
            referencia,
            ano_plan,
            mo_planejada: mo_plan,
            qtde_planejada: qtde_plan,
            capex_mat_plan,
            capex_mo_plan,
          },
        });
      }),
    );
  }
}
