import { Injectable } from '@nestjs/common';
import { GetWorksDTO } from 'src/config/dto/worksDto';
import { PrismaService } from 'src/config/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import * as moment from 'moment';

@Injectable()
export class GetCompletedWorksService {
  constructor(private prisma: PrismaService) {}

  async getCompletedWorks(filters: GetWorksDTO) {
    const {
      data,
      idCircuito,
      idConjunto,
      idEmpreendimento,
      idGrupo,
      idMunicipio,
      idOvnota,
      idParceira,
      idRegional,
      idStatus,
      idTipo,
      tipoFiltro,
    } = filters;

    const month = data?.split('/')[0];
    const year = data?.split('/')[1];

    let query = Prisma.sql`SELECT obras.id, obras.ovnota, COALESCE(diagrama, ordem_dci, ordem_dcim) AS ordemdiagrama, ordem_dca, ordem_dcd, ordem_dcim, status_ov_sap, pep, executado, 
                mun, entrada + prazo AS prazo_fim, CASE WHEN current_date > entrada + prazo THEN 1 ELSE 0 END AS atraso, data_conclusao, tipo_obra, qtde_planejada, qtde_pend, circuito, 
                mo_planejada, contagem_ocorrencias, turma, status, conjunto, abrev_regional, observ_obra
                FROM construcao_sp.obras
                INNER JOIN construcao_sp.municipios ON obras.id_gpm = municipios.id
                INNER JOIN construcao_sp.circuitos ON obras.id_circuito = circuitos.id
                INNER JOIN construcao_sp.status ON obras.id_status = status.id
                INNER JOIN construcao_sp.tipos ON obras.id_tipo = tipos.id
                INNER JOIN construcao_sp.conjuntos ON circuitos.id_conjunto = conjuntos.id
                INNER JOIN construcao_sp.regionais ON municipios.id_regional = regionais.id
                INNER JOIN construcao_sp.turmas ON obras.id_turma = turmas.id
                LEFT JOIN (SELECT id_obra, COUNT(*)::int as contagem_ocorrencias FROM construcao_sp.programacoes WHERE programacoes.data_prog > current_date GROUP BY id_obra ) AS programacoes ON programacoes.id_obra = obras.id
                WHERE data_conclusao IS NOT NULL`;

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

    if (tipoFiltro === 'month' && data) {
      query = Prisma.sql`${query} AND EXTRACT(MONTH FROM data_conclusao) = ${parseInt(month)} AND EXTRACT(YEAR FROM data_conclusao) = ${parseInt(year)}`;
    }

    if (tipoFiltro === 'day' && data) {
      query = Prisma.sql`${query} AND data_conclusao = ${moment(data, 'DD/MM/YYYY', true).toDate()}`;
    }

    query = Prisma.sql`${query} ORDER BY data_conclusao DESC;`;

    const works: any[] = await this.prisma.$queryRaw(query);

    return works;
  }
}
