import { ErrorsReportService } from 'src/application/usecases/errorsReport.service';
import {
  ERRORS_REPORT_REPOSITORY,
  IErrorsReportRepository,
} from 'src/domain/contracts/IErrorsReportRepository';

import { Test, TestingModule } from '@nestjs/testing';

describe('ErrorsReportService', () => {
  let service: ErrorsReportService;
  let repository: jest.Mocked<IErrorsReportRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ErrorsReportService,
        {
          provide: ERRORS_REPORT_REPOSITORY,
          useValue: {
            findUndefinedItems: jest.fn(),
            findScheduleError: jest.fn(),
            findZeroCapex: jest.fn(),
            findExecutionDifferential: jest.fn(),
            findDivergentConclusion: jest.fn(),
            findWorksWithoutYearPlan: jest.fn(),
            findRepeatedWorks: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(ErrorsReportService);
    repository = module.get(ERRORS_REPORT_REPOSITORY);
  });

  afterEach(() => jest.clearAllMocks());

  // 🧠 findUndefinedItems
  it('deve formatar corretamente os dados retornados por findUndefinedItems', async () => {
    repository.findUndefinedItems.mockResolvedValue([
      {
        municipios: { municipio: 'Cidade A' },
        circuitos: { circuito: '123' },
        turmas: { turma: 'Equipe 1' },
        tipos: { tipo_obra: 'Rede BT' },
        id: 1,
        ovnota: '234',
        data_conclusao: undefined,
      },
    ]);

    const result = await service.findUndefinedItems(3);

    expect(repository.findUndefinedItems).toHaveBeenCalledWith(3);
    expect(result).toEqual([
      {
        municipio: 'Cidade A',
        circuito: '123',
        parceira: 'Equipe 1',
        tipo: 'Rede BT',
        ovnota: '234',
        dataConclusao: undefined,
        id: 1,
      },
    ]);
  });

  // ⚙️ findScheduleError
  it('deve calcular somaProg, total e filtrar obras com total !== 100', async () => {
    repository.findScheduleError.mockResolvedValue([
      {
        id: 1,
        ovnota: 'O1',
        executado: 80,
        turmas: { turma: 'Equipe 1' },
        programacoes: [{ prog: 10 }, { prog: 10 }],
      },
      {
        id: 2,
        ovnota: 'O2',
        executado: 90,
        turmas: { turma: 'Equipe 2' },
        programacoes: [{ prog: 10 }],
      },
    ]);

    const result = await service.findScheduleError();

    expect(result).toEqual(
      [
        {
          id: 1,
          ovnota: 'O1',
          parceira: 'Equipe 1',
          executado: 80,
          prog: 20,
          total: 100,
        },
      ].filter((obra) => obra.total !== 100),
    ); // deve retornar []
  });

  it('deve retornar apenas obras com total diferente de 100', async () => {
    repository.findScheduleError.mockResolvedValue([
      {
        id: 3,
        ovnota: 'O3',
        executado: null,
        turmas: { turma: 'Equipe 3' },
        programacoes: [{ prog: 20 }, { prog: null }],
      },
    ]);

    const result = await service.findScheduleError();
    expect(result).toEqual([
      {
        id: 3,
        ovnota: 'O3',
        parceira: 'Equipe 3',
        executado: null,
        prog: 20,
        total: 20,
      },
    ]);
  });

  // 💸 findZeroCapex
  it('deve mapear corretamente os campos retornados em findZeroCapex', async () => {
    repository.findZeroCapex.mockResolvedValue([
      {
        id: 1,
        ovnota: 'O1',
        diagrama: 'D1',
        entrada: new Date('2024-10-11'),
        municipios: { mun: 'Cidade A' },
        tipos: { tipo_obra: 'Rede MT' },
        mo_planejada: 100,
        qtde_planejada: 10,
        ordem_dci: '',
        ordem_dcim: '',
      },
      {
        id: 2,
        ovnota: 'O2',
        ordem_dci: 'D2',
        entrada: new Date('2024-10-11'),
        municipios: { mun: 'Cidade B' },
        tipos: { tipo_obra: 'Rede BT' },
        mo_planejada: 200,
        qtde_planejada: 20,
        diagrama: '',
        ordem_dcim: '',
      },
      {
        id: 2,
        ovnota: 'O2',
        ordem_dci: '',
        entrada: new Date('2024-10-11'),
        municipios: { mun: 'Cidade B' },
        tipos: { tipo_obra: 'Rede BT' },
        mo_planejada: 200,
        qtde_planejada: 20,
        diagrama: '',
        ordem_dcim: 'DCIM1',
      },
    ]);

    const result = await service.findZeroCapex();
    expect(result).toEqual([
      {
        id: 1,
        ovnota: 'O1',
        ordemDiagrama: 'D1',
        entrada: new Date('2024-10-11'),
        municipio: 'Cidade A',
        tipo: 'Rede MT',
        moPlanejada: 100,
        qtdePlanejada: 10,
      },
      {
        id: 2,
        ovnota: 'O2',
        ordemDiagrama: 'D2',
        entrada: new Date('2024-10-11'),
        municipio: 'Cidade B',
        tipo: 'Rede BT',
        moPlanejada: 200,
        qtdePlanejada: 20,
      },
      {
        id: 2,
        ovnota: 'O2',
        ordemDiagrama: 'DCIM1',
        entrada: new Date('2024-10-11'),
        municipio: 'Cidade B',
        tipo: 'Rede BT',
        moPlanejada: 200,
        qtdePlanejada: 20,
      },
    ]);
  });

  // ⚡ findExecutionDifferential
  it('deve retornar apenas obras com somaExec diferente de executado', async () => {
    repository.findExecutionDifferential.mockResolvedValue([
      {
        id: 1,
        ovnota: 'O1',
        executado: 100,
        programacoes: [{ exec: 50 }, { exec: 50 }],
      },
      {
        id: 2,
        ovnota: 'O2',
        executado: null,
        programacoes: [{ exec: 25 }, { exec: null }],
      },
    ]);

    const result = await service.findExecutionDifferential();
    expect(result).toEqual([
      {
        id: 2,
        ovnota: 'O2',
        executado: 0,
        somaExec: 25,
      },
    ]);
  });

  // 📅 findDivergentConclusion
  it('deve retornar obras com dataConclusao diferente de dataProgramada', async () => {
    const dataConclusao = new Date('2024-10-10');
    const dataProgramada1 = new Date('2024-10-09');
    const dataProgramada2 = new Date('2024-10-10');

    repository.findDivergentConclusion.mockResolvedValue([
      {
        id: 1,
        ovnota: 'O1',
        data_conclusao: dataConclusao,
        programacoes: [{ data_prog: dataProgramada1 }],
      },
      {
        id: 2,
        ovnota: 'O2',
        data_conclusao: dataConclusao,
        programacoes: [{ data_prog: dataProgramada2 }],
      },
      { id: 3, ovnota: 'O3', data_conclusao: dataConclusao, programacoes: [] },
    ]);

    const result = await service.findDivergentConclusion();

    expect(result).toEqual([
      {
        id: 1,
        ovnota: 'O1',
        dataConclusao,
        dataProgramada: dataProgramada1,
      },
    ]);
  });

  // 📆 findWorksWithoutYearPlan
  it('deve retornar obras sem anoPlano ou com anoPlano diferente do ano atual', async () => {
    const currentYear = new Date().getFullYear();

    repository.findWorksWithoutYearPlan.mockResolvedValue([
      { id: 1, ovnota: 'O1', ordem_dci: 'D1', ano_plan: null },
      { id: 2, ovnota: 'O2', ordem_dci: 'D2', ano_plan: currentYear },
      { id: 3, ovnota: 'O3', ordem_dci: 'D3', ano_plan: 2020 },
    ]);

    const result = await service.findWorksWithoutYearPlan();

    expect(result).toEqual([
      { id: 1, ovnota: 'O1', ordemDci: 'D1', anoPlano: null },
      { id: 3, ovnota: 'O3', ordemDci: 'D3', anoPlano: 2020 },
    ]);
  });

  // 🔁 findRepeatedWorks
  it('deve retornar obras duplicadas com base nas chaves (diagrama, ordens)', async () => {
    const duplicatedWorks = [
      {
        id: 1,
        ovnota: 'O1',
        diagrama: 'D1',
        ordem_dci: 'A',
        ordem_dca: 'B',
        ordem_dcd: 'C',
        ordem_dcim: 'D',
      },
      {
        id: 2,
        ovnota: 'O2',
        diagrama: 'D1',
        ordem_dci: 'A',
        ordem_dca: 'B',
        ordem_dcd: 'C',
        ordem_dcim: 'D',
      },
      {
        id: 3,
        ovnota: 'O3',
        diagrama: 'D2',
        ordem_dci: 'X',
        ordem_dca: 'Y',
        ordem_dcd: 'Z',
        ordem_dcim: 'W',
      },
    ];

    repository.findRepeatedWorks.mockResolvedValue(duplicatedWorks);

    const result = await service.findRepeatedWorks();

    expect(result).toEqual([
      {
        id: 1,
        ovnota: 'O1',
        diagrama: 'D1',
        ordemDci: 'A',
        ordemDca: 'B',
        ordemDcd: 'C',
        ordemDcim: 'D',
      },
      {
        id: 2,
        ovnota: 'O2',
        diagrama: 'D1',
        ordemDci: 'A',
        ordemDca: 'B',
        ordemDcd: 'C',
        ordemDcim: 'D',
      },
    ]);
  });
});
