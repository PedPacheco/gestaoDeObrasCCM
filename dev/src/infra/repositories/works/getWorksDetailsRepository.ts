import { Injectable } from '@nestjs/common';
import { IGetWorksDetailsRepository } from 'src/domain/repositories/works/IGetWorksDetailsRepository';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import { GetWorksDetailsResponse } from 'src/interface/types/works/getWorksDetailsInterface';

@Injectable()
export class GetWorksDetailsRepository implements IGetWorksDetailsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async get(id: number): Promise<GetWorksDetailsResponse> {
    const value = id.toString();

    return await this.prisma.obras.findFirst({
      where: {
        OR: [
          { id: value.length >= 10 ? undefined : id },
          { ovnota: value },
          { ordem_dci: value },
          { ordem_dcd: value },
          { ordem_dca: value },
          { ordem_dcim: value },
          { diagrama: value },
        ],
      },
      select: {
        ovnota: true,
        pep: true,
        status_pep: true,
        diagrama: true,
        ordem_dci: true,
        ordem_dcd: true,
        ordem_dca: true,
        ordem_dcim: true,
        status_ov_sap: true,
        status_diagrama: true,
        status_usuario_diagrama: true,
        status_150: true,
        status_usuario_150: true,
        status_170: true,
        status_usuario_170: true,
        status_180: true,
        status_usuario_180: true,
        status_190: true,
        status_usuario_190: true,
        entrada: true,
        prazo: true,
        data_conclusao: true,
        executado: true,
        observ_obra: true,
        qtde_planejada: true,
        qtde_pend: true,
        mo_planejada: true,
        mo_final: true,
        referencia: true,
        capex_mat_pend: true,
        capex_mat_plan: true,
        capex_mo_pend: true,
        capex_mo_plan: true,
        tipo_ads: true,
        data_empreitamento: true,
        ano_plan: true,
        circuitos: { select: { circuito: true } },
        empreendimento: { select: { empreendimento: true } },
        municipios: { select: { municipio: true } },
        tipos: { select: { tipo_obra: true } },
        turmas: { select: { turma: true } },
        status: { select: { status: true } },
        programacoes: {
          select: {
            data_prog: true,
            hora_ini: true,
            hora_ter: true,
            tipo_servico: true,
            prog: true,
            exec: true,
            observ_programacao: true,
            chi: true,
            num_dp: true,
            chave_provisoria: true,
            equipe_linha_morta: true,
            equipe_linha_viva: true,
            equipe_regularizacao: true,
            tecnicos: { select: { tecnico: true } },
            programacoes_restricao_execucao: { select: { restricao: true } },
            nome_responsavel_execucao: true,
          },
        },
      },
    });
  }
}
