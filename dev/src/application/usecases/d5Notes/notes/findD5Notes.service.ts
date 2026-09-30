import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import moment, { Moment } from 'moment';
import {
  D5_NOTES_REPOSITORY,
  D5NotePagination,
  ID5NotesRepository,
} from 'src/domain/repositories/d5Notes/ID5notesRepository';
import { D5NotesFiltersDTO } from 'src/interface/dtos/d5NotesDTO';

@Injectable()
export class FindD5NotesService {
  constructor(
    @Inject(D5_NOTES_REPOSITORY)
    private readonly d5NotesRepository: ID5NotesRepository,
  ) {}

  async get(filters: D5NotesFiltersDTO) {
    const where = this.buildWhereClause(filters);
    const pagination = this.buildPagination(filters.page);

    const [rows, totals] = await Promise.all([
      this.d5NotesRepository.get(where, pagination),
      this.d5NotesRepository.getTotals(where),
    ]);

    const d5NotesFormatted = rows.map(
      ({
        obras,
        municipios,
        tipos,
        turmas,
        status,
        novo_tabela_usuarios,
        ...rest
      }) => ({
        ...rest,
        moRetida: Number(rest.mo_planejada),
        ordemDiagrama:
          obras?.diagrama ??
          obras?.ordem_dci ??
          obras?.ordem_dca ??
          obras?.ordem_dcd ??
          obras?.ordem_dcim,
        obra: obras?.ovnota ?? null,
        municipio: municipios.mun_minusculo,
        regional: municipios.regionais.regional,
        parceira: turmas.turma,
        tipoObra: tipos.tipo_obra,
        status: status.status,
        usuarioModificador: novo_tabela_usuarios?.nome ?? null,
      }),
    );

    return { d5Notes: d5NotesFormatted, totals };
  }

  async getById(id: number) {
    if (!id) {
      throw new BadRequestException('Obra não foi enviada');
    }

    const response = await this.d5NotesRepository.getById(id);

    if (!response) {
      throw new NotFoundException('Obra não encontrada');
    }

    const {
      obras,
      municipios,
      tipos,
      turmas,
      status,
      novo_tabela_usuarios,
      programacoes_d5,
      ...rest
    } = response;

    const { totalExecutado, totalProgramado } =
      this.calculateCostPointByPointSchedule(programacoes_d5);

    const { tmAberto, tmExecucao } = this.calculateTM(
      moment(rest.criado_em).startOf('day'),
      rest.conclusao_nota ? moment(rest.conclusao_nota).startOf('day') : null,
    );

    return {
      ...rest,
      obra: obras?.ovnota ?? null,
      ordemDiagrama:
        obras?.diagrama ??
        obras?.ordem_dci ??
        obras?.ordem_dca ??
        obras?.ordem_dcd ??
        obras?.ordem_dcim,
      municipio: municipios.mun_minusculo,
      regional: municipios.regionais.regional,
      parceira: turmas.turma,
      tipoObra: tipos.tipo_obra,
      status: status.status,
      tmAberto,
      tmExecucao,
      usuarioModificador: novo_tabela_usuarios?.nome ?? null,
      totalProgramado,
      totalExecutado,
      observacao: rest.descricao,
      prazo: moment(rest.criado_em).add(7, 'days').toDate(),
    };
  }

  /* ---------------- Funções auxiliares ---------------- */

  private calculateCostPointByPointSchedule(
    data: { prog: number; exec: number }[],
  ) {
    return data.reduce(
      (acc, item) => {
        acc.totalProgramado += item.prog;
        acc.totalExecutado += item.exec;

        return acc;
      },
      {
        totalProgramado: 0,
        totalExecutado: 0,
      },
    );
  }

  private calculateTM(
    initialDate: Moment,
    executionDate: Moment | null,
  ): { tmAberto: number | null; tmExecucao: number | null } {
    let tmExecuted: number | null = null;
    let tmOpen: number | null = null;

    if (executionDate) {
      tmExecuted = executionDate.diff(initialDate, 'days');

      return { tmAberto: tmOpen, tmExecucao: tmExecuted };
    }

    tmOpen = moment().startOf('day').diff(initialDate, 'days');

    return { tmAberto: tmOpen, tmExecucao: tmExecuted };
  }

  /* ---------------- Funções para orquestração dos filtros ---------------- */

  private buildWhereClause(filters: D5NotesFiltersDTO) {
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

    if (filters.idGrupo?.length) {
      where.id_turma = { in: filters.idGrupo };
    }

    if (filters.idTipo?.length) {
      where.id_tipo = { in: filters.idTipo };
    }

    if (filters.idParceira?.length) {
      where.id_parceira = { in: filters.idParceira };
    }

    // --- Período da data de criação ---
    const criadoEm = this.buildDateRange(
      'criação',
      filters.dataCriacaoInicial,
      filters.dataCriacaoFinal,
    );
    if (criadoEm) {
      where.criado_em = criadoEm;
    }

    // --- Período da data de conclusão ---
    const conclusaoNota = this.buildDateRange(
      'conclusão',
      filters.dataConclusaoInicial,
      filters.dataConclusaoFinal,
    );

    if (conclusaoNota) {
      where.conclusao_nota = conclusaoNota;
    }

    // --- Status SAP ---
    if (filters.statusD5Sap) {
      where.status_sap = filters.statusD5Sap;
    }

    if (filters.idNotaD5?.length) {
      where.nota_d5 = { in: filters.idNotaD5 };
    }

    return where;
  }

  private buildPagination(page?: number): D5NotePagination {
    if (page === undefined) return undefined;

    return {
      skip: page * 200,
      take: 200,
    };
  }

  private buildDateRange(label: string, inicio?: string, fim?: string) {
    if (!inicio && !fim) return undefined;

    const range: { gte?: Date; lt?: Date } = {};

    if (inicio) {
      range.gte = moment(inicio).startOf('day').toDate();
    }

    if (fim) {
      // lt no dia seguinte garante que o dia final é incluído por inteiro
      range.lt = moment(fim).startOf('day').add(1, 'day').toDate();
    }

    if (range.gte && range.lt && range.gte >= range.lt) {
      throw new BadRequestException(
        `A data inicial de ${label} não pode ser posterior à data final`,
      );
    }

    return range;
  }
}
