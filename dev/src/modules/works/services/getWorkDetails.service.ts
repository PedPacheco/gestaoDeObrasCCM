import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/config/prisma/prisma.service';

@Injectable()
export class GetWorkDetailsService {
  constructor(private prisma: PrismaService) {}

  async get(id: number) {
    const value = id.toString();

    const work = await this.prisma.obras.findFirst({
      where: {
        OR: [
          { id: value.length >= 12 ? undefined : id },
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

    if (!work) {
      throw new NotFoundException('Obra não encontrada');
    }

    const response = {
      ...work,
      circuitos: work.circuitos.circuito,
      empreendimento: work.empreendimento.empreendimento,
      municipios: work.municipios.municipio,
      tipos: work.tipos.tipo_obra,
      turmas: work.turmas.turma,
      status: work.status.status,
      programacoes: work.programacoes.map((programacao) => ({
        data_prog: programacao.data_prog,
        hora_ini: programacao.hora_ini,
        hora_ter: programacao.hora_ter,
        tipo_servico: programacao.tipo_servico,
        prog: programacao.prog,
        exec: programacao.exec,
        observ_programacao: programacao.observ_programacao,
        chi: programacao.chi,
        num_dp: programacao.num_dp,
        chave_provisoria: programacao.chave_provisoria,
        equipe_linha_morta: programacao.equipe_linha_morta,
        equipe_linha_viva: programacao.equipe_linha_viva,
        equipe_regularizacao: programacao.equipe_regularizacao,
        tecnico: programacao.tecnicos?.tecnico,
        restricao: programacao.programacoes_restricao_execucao?.restricao,
        nome_responsavel_execucao: programacao.nome_responsavel_execucao,
      })),
    };

    return response;
  }
}
