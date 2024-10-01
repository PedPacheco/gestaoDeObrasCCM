import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  GetAllWorksDTO,
  GetWorksInPortfolioDTO,
} from 'src/config/dto/worksDto';
import { PrismaService } from 'src/config/prisma/prisma.service';
import { worksInPortfolioInterface } from 'src/types/worksInterface';
import { calculateTotals } from 'src/utils/calculateTotals';

@Injectable()
export class WorksService {
  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async getAllWorks(filters: GetAllWorksDTO) {
    const { idGrupo, idMunicipio, idParceira, idRegional, idStatus, idTipo } =
      filters;

    const cacheKey = `works-${JSON.stringify({
      idGrupo,
      idMunicipio,
      idParceira,
      idRegional,
      idStatus,
      idTipo,
    })}`;

    let works = await this.cacheManager.get(cacheKey);

    if (works) {
      return works;
    }

    let query = Prisma.sql`SELECT
        obras.id, obras.ovnota, COALESCE(diagrama, COALESCE(ordem_dci, ordem_dcim)) AS ordemdiagrama, status_ov_sap, pep, status_pep, diagrama, status_diagrama, ordem_dci, status_170, 
        status_usuario_170, ordem_dcd, status_190, status_usuario_190, ordem_dca, status_150, status_usuario_150, ordem_dcim, status_180, status_usuario_180, mun, tipo_obra, entrada, 
        entrada + prazo AS prazo_fim, qtde_planejada, mo_planejada, mo_final, turma, executado, data_conclusao, last_data_prog, status, observ_obra, referencia 
        FROM construcao_sp.obras 
        INNER JOIN construcao_sp.turmas ON turmas.id = obras.id_turma 
        INNER JOIN construcao_sp.municipios ON municipios.id = obras.id_gpm 
        INNER JOIN construcao_sp.tipos ON tipos.id = obras.id_tipo 
        INNER JOIN construcao_sp.status ON status.id = obras.id_status 
        LEFT JOIN construcao_sp.datas_programacao ON datas_programacao.id= obras.id
        WHERE 1=1`;

    if (idRegional) {
      query = Prisma.sql`${query} AND municipios.id_regional = ${idRegional}`;
    }

    if (idTipo) {
      query = Prisma.sql`${query} AND id_tipo = ${idTipo}`;
    }

    if (idParceira) {
      query = Prisma.sql`${query} AND id_turma = ${idParceira}`;
    }

    if (idGrupo) {
      query = Prisma.sql`${query} AND tipos.id_grupo = ${idGrupo}`;
    }

    if (idMunicipio) {
      query = Prisma.sql`${query} AND municipios.id = ${idMunicipio}`;
    }

    if (idStatus) {
      query = Prisma.sql`${query} AND status.id = ${idStatus}`;
    }

    query = Prisma.sql`${query} ORDER BY entrada DESC;`;

    works = await this.prisma.$queryRaw(query);

    await this.cacheManager.set(cacheKey, works, 1800000);

    return works;
  }

  async getWorksInPortfolio(filters: GetWorksInPortfolioDTO) {
    const {
      idGrupo,
      idMunicipio,
      idParceira,
      idRegional,
      idStatus,
      idTipo,
      idOvnota,
      idCircuito,
      idConjunto,
      idEmpreendimento,
      data,
      tipoFiltro,
    } = filters;

    const mes = data?.split('/')[0];
    const ano = data?.split('/')[1];

    let query = Prisma.sql`SELECT
        obras.id, obras.ovnota, COALESCE(diagrama, COALESCE(ordem_dci, ordem_dcim)) AS ordemdiagrama, ordem_dca, ordem_dcd, ordem_dcim, status_ov_sap, pep, 
        executado, mun, id_status, entrada, prazo, entrada + prazo AS prazo_fim, abrev_regional, tipo_obra, qtde_planejada, contagem_ocorrencias,
        qtde_pend, circuito, mo_planejada, first_data_prog, status.status, hora_ini, hora_ter, tipo_servico, datas_programacao.chi,
        conjuntos.conjunto, equipe_linha_morta, equipe_linha_viva, equipe_regularizacao, data_empreitamento, empreendimento, turma
        FROM construcao_sp.obras 
        INNER JOIN construcao_sp.turmas ON turmas.id = obras.id_turma 
        INNER JOIN construcao_sp.municipios ON municipios.id = obras.id_gpm 
        INNER JOIN construcao_sp.tipos ON tipos.id = obras.id_tipo 
        INNER JOIN construcao_sp.status ON status.id = obras.id_status 
        INNER JOIN construcao_sp.circuitos ON obras.id_circuito = circuitos.id
        INNER JOIN construcao_sp.empreendimento ON obras.id_empreendimento = empreendimento.id
        INNER JOIN construcao_sp.conjuntos ON circuitos.id_conjunto = conjuntos.id
        INNER JOIN construcao_sp.regionais ON municipios.id_regional = regionais.id
        LEFT JOIN construcao_sp.datas_programacao ON datas_programacao.id= obras.id
        LEFT JOIN (SELECT id_obra, COUNT(*)::int as contagem_ocorrencias FROM construcao_sp.programacoes WHERE programacoes.data_prog > current_date GROUP BY id_obra ) AS programacoes ON programacoes.id_obra = obras.id 
        WHERE data_conclusao IS NULL`;

    if (idRegional) {
      query = Prisma.sql`${query} AND municipios.id_regional = ${idRegional}`;
    }

    if (idTipo) {
      query = Prisma.sql`${query} AND id_tipo = ${idTipo}`;
    }

    if (idParceira) {
      query = Prisma.sql`${query} AND id_turma = ${idParceira}`;
    }

    if (idGrupo) {
      query = Prisma.sql`${query} AND tipos.id_grupo = ${idGrupo}`;
    }

    if (idMunicipio) {
      query = Prisma.sql`${query} AND municipios.id = ${idMunicipio}`;
    }

    if (idStatus) {
      query = Prisma.sql`${query} AND status.id = ${idStatus}`;
    }

    if (idCircuito) {
      query = Prisma.sql`${query} AND id_circuito = ${idCircuito}`;
    }

    if (idConjunto) {
      query = Prisma.sql`${query} AND circuitos.id_conjunto = ${idConjunto}`;
    }

    if (idEmpreendimento) {
      query = Prisma.sql`${query} AND id_empreendimento = ${idEmpreendimento}`;
    }

    if (idOvnota) {
      query = Prisma.sql`${query} AND id = ${idOvnota}`;
    }

    if (tipoFiltro === 'mes' && data) {
      query = Prisma.sql`${query} AND EXTRACT(MONTH FROM first_data_prog) = ${parseInt(mes)} AND EXTRACT(YEAR FROM first_data_prog) = ${parseInt(ano)}`;
    }

    query = Prisma.sql`${query} ORDER BY first_data_prog, status DESC, entrada + prazo;`;

    const works: worksInPortfolioInterface[] =
      await this.prisma.$queryRaw(query);

    return calculateTotals(works, {
      total_mo_executada: true,
      total_mo_suspensa: true,
      total_mo_planejada: true,
      total_qtde_planejada: true,
      total_qtde_pend: true,
    });
  }
}
