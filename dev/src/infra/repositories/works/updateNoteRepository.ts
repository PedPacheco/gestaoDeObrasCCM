import { Injectable, Logger } from '@nestjs/common';
import { NoteWorks } from 'src/domain/entities/works.entity';
import { IUpdateNoteRepository } from 'src/domain/repositories/works/IUpdateNoteRepository';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import { resolvePointByPointMode } from './pointByPointMode.helper';

@Injectable()
export class UpdateNoteRepository implements IUpdateNoteRepository {
  private readonly logger = new Logger(UpdateNoteRepository.name);
  constructor(private readonly prisma: PrismaService) {}

  async update(data: Partial<NoteWorks>[]): Promise<void> {
    try {
      // O flag de ponto a ponto acompanha a parceira (regra 5).
      const modes = new Map<number, boolean | undefined>();

      for (const item of data as any[]) {
        modes.set(
          item.id,
          await resolvePointByPointMode(this.prisma, item.id, item.id_turma),
        );
      }

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
    } catch (error: any) {
      this.logger.error(
        `Erro ao atualizar contratos. Payload: ${JSON.stringify(data)}`,
        error.stack,
      );
      throw error;
    }
  }
}
