import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import * as moment from 'moment';
import { DbSchema } from 'src/infra/prisma/dbSchema.provider';

import { PrismaService } from 'src/infra/prisma/prisma.service';
import { ExecMonitoringRepository } from 'src/infra/repositories/works/schedule/execMonitoringRepository';
import type { Mock } from 'vitest';

describe('ExecMonitoringRepository', () => {
  let repository: ExecMonitoringRepository;
  let prisma: PrismaService;

  // Schema "falso": garante que o repositório não tem construcao_sp fixo
  const SCHEMA = 'schema_teste';

  const prismaMock = {
    $queryRaw: vi.fn(),
  };

  const mockConfigService = {
    getOrThrow: vi.fn().mockReturnValue(SCHEMA),
  };

  const filtersWithoutOptional = {
    dataInicial: '01/11/2024',
    dataFinal: '30/11/2024',
    idRegional: undefined,
    idTecnico: undefined,
    idParceira: undefined,
    idTipo: undefined,
  };

  const filtersWithAll = {
    dataInicial: '01/11/2024',
    dataFinal: '30/11/2024',
    idRegional: [1, 2],
    idTecnico: [3],
    idParceira: [4],
    idTipo: [5],
  };

  const mockResponse = [
    {
      mes: '11/2024',
      regional: 'Campinas',
      id_regional: 1,
      turma: 'Turma A',
      total: 100,
      acompanhado: 80,
      nao_acompanhado: 20,
    },
  ];

  /** Texto SQL da n-ésima chamada ao $queryRaw */
  function sentQueryString(callIndex = 0): string {
    const queryArg = (prisma.$queryRaw as Mock).mock.calls[callIndex][0];
    return queryArg.strings.join(' ');
  }

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        ExecMonitoringRepository,
        DbSchema,
        { provide: PrismaService, useValue: prismaMock },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    repository = module.get<ExecMonitoringRepository>(ExecMonitoringRepository);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    // clearAllMocks mantém o mockReturnValue do getOrThrow
    vi.clearAllMocks();
  });

  describe('getData', () => {
    it('should use the schema from DB_SCHEMA and never the hardcoded one', async () => {
      prismaMock.$queryRaw.mockResolvedValue(mockResponse);

      await repository.getData(filtersWithAll);

      const queryString = sentQueryString();
      expect(queryString).toContain(`${SCHEMA}.programacoes`);
      expect(queryString).not.toContain('construcao_sp.');
    });

    it('should execute query without optional filters', async () => {
      prismaMock.$queryRaw.mockResolvedValue(mockResponse);

      const result = await repository.getData(filtersWithoutOptional);

      expect(result).toEqual(mockResponse);
      expect(prisma.$queryRaw).toHaveBeenCalledTimes(1);

      const queryArg = (prisma.$queryRaw as Mock).mock.calls[0][0];
      expect(queryArg).toBeDefined();

      const queryString = sentQueryString();
      expect(queryString).toContain(`FROM ${SCHEMA}.programacoes p`);
      expect(queryString).toContain('WHERE p.id_status_programacao IN (4, 6)');
      expect(queryString).toContain("GROUP BY TO_CHAR(p.data_prog, 'MM/YYYY')");
      expect(queryString).not.toContain('m.id_regional IN');
      expect(queryString).not.toContain('p.id_tecnico IN');
      expect(queryString).not.toContain('o.id_turma IN');
      expect(queryString).not.toContain('o.id_tipo IN');
    });

    it('should apply regional filter correctly', async () => {
      prismaMock.$queryRaw.mockResolvedValue(mockResponse);

      await repository.getData({ ...filtersWithoutOptional, idRegional: [1] });

      expect(sentQueryString()).toContain('m.id_regional IN');
    });

    it('should apply tecnico filter correctly', async () => {
      prismaMock.$queryRaw.mockResolvedValue(mockResponse);

      await repository.getData({ ...filtersWithoutOptional, idTecnico: [1] });

      expect(sentQueryString()).toContain('p.id_tecnico IN');
    });

    it('should apply turma filter correctly', async () => {
      prismaMock.$queryRaw.mockResolvedValue(mockResponse);

      await repository.getData({ ...filtersWithoutOptional, idParceira: [1] });

      expect(sentQueryString()).toContain('o.id_turma IN');
    });

    it('should apply tipo filter correctly', async () => {
      prismaMock.$queryRaw.mockResolvedValue(mockResponse);

      await repository.getData({ ...filtersWithoutOptional, idTipo: [1] });

      expect(sentQueryString()).toContain('o.id_tipo IN');
    });

    it('should apply all filters correctly', async () => {
      prismaMock.$queryRaw.mockResolvedValue(mockResponse);

      const result = await repository.getData(filtersWithAll);

      expect(result).toEqual(mockResponse);

      const queryString = sentQueryString();
      expect(queryString).toContain('m.id_regional IN');
      expect(queryString).toContain('p.id_tecnico IN');
      expect(queryString).toContain('o.id_turma IN');
      expect(queryString).toContain('o.id_tipo IN');
      expect(queryString).toContain('ORDER BY MIN(p.data_prog), r.regional');
    });

    it('should convert dates correctly using moment.utc', async () => {
      prismaMock.$queryRaw.mockResolvedValue(mockResponse);

      await repository.getData(filtersWithoutOptional);

      const queryArg = (prisma.$queryRaw as Mock).mock.calls[0][0];
      expect(queryArg.values).toContainEqual(
        moment.utc('01/11/2024', 'DD/MM/YYYY').toDate(),
      );
      expect(queryArg.values).toContainEqual(
        moment.utc('30/11/2024', 'DD/MM/YYYY').toDate(),
      );
    });

    it('should not apply filters when arrays are empty', async () => {
      prismaMock.$queryRaw.mockResolvedValue(mockResponse);

      await repository.getData({
        ...filtersWithoutOptional,
        idRegional: [],
        idTecnico: [],
        idParceira: [],
        idTipo: [],
      });

      const queryString = sentQueryString();
      expect(queryString).not.toContain('m.id_regional IN');
      expect(queryString).not.toContain('p.id_tecnico IN');
      expect(queryString).not.toContain('o.id_turma IN');
      expect(queryString).not.toContain('o.id_tipo IN');
    });
  });
});
