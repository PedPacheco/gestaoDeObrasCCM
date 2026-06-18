import { Test, TestingModule } from '@nestjs/testing';
import moment from 'moment';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import { ExportRepository } from 'src/infra/repositories/exportRepository';
import { mockFindByWorkIdResponseFormatted } from '../../mocks/mocksExecutionReport';
import {
  exportacaoForecastMock,
  exportRejectionsMock,
} from '../../mocks/mockExportRepository';

describe('ExportRepository', () => {
  let repository: ExportRepository;

  const mockPrisma = {
    exportacao_obras_carteira: { findMany: jest.fn() },
    exportacao_obras_executadas: { findMany: jest.fn() },
    exportacao_programacoes_obras: { findMany: jest.fn() },
    exportacao_capacidade_execucao: { findMany: jest.fn() },
    exportacao_forecast: { findMany: jest.fn() },
    exportacao_ordens: { findMany: jest.fn() },
    programacoes_reprovacoes: { findMany: jest.fn() },
    suspensoes: { findMany: jest.fn() },
    suspensoes_retiradas: { findMany: jest.fn() },
    programacoes: { findMany: jest.fn() },
    relatorio_execucao: { findMany: jest.fn() },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExportRepository,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    repository = module.get<ExportRepository>(ExportRepository);
  });

  afterEach(() => jest.clearAllMocks());

  describe('exportWorksInPortfolio', () => {
    it('should call method and return all data of exportcao_obras_carteira view', async () => {
      const mockResponse = [{ ovnota: '2134', ordem_dci: '23124' }];

      mockPrisma.exportacao_obras_carteira.findMany.mockResolvedValue(
        mockResponse,
      );

      const response = await repository.exportWorksInPortfolio();

      expect(
        mockPrisma.exportacao_obras_carteira.findMany,
      ).toHaveBeenCalledTimes(1);
      expect(response).toEqual(mockResponse);
    });
  });

  describe('exportCompletedWorks', () => {
    it('should call method and return all data of exportacao_obras_executadas view', async () => {
      const mockResponse = [{ ovnota: '2134', ordem_dci: '23124' }];

      mockPrisma.exportacao_obras_executadas.findMany.mockResolvedValue(
        mockResponse,
      );

      const response = await repository.exportCompletedWorks();

      expect(
        mockPrisma.exportacao_obras_executadas.findMany,
      ).toHaveBeenCalledTimes(1);
      expect(response).toEqual(mockResponse);
    });
  });

  describe('exportSchedules', () => {
    it('should call method and return all data of exportacao_programacoes_obras view', async () => {
      const mockResponse = [{ ovnota: '2134', ordem_dci: '23124' }];

      mockPrisma.exportacao_programacoes_obras.findMany.mockResolvedValue(
        mockResponse,
      );

      const response = await repository.exportSchedules();

      expect(
        mockPrisma.exportacao_programacoes_obras.findMany,
      ).toHaveBeenCalledTimes(1);
      expect(response).toEqual(mockResponse);
    });
  });

  describe('exportExecutionCapacity', () => {
    it('should call method and return all data of exportacao_capacidade_execucao view', async () => {
      const mockResponse = [{ ovnota: '2134', ordem_dci: '23124' }];

      mockPrisma.exportacao_capacidade_execucao.findMany.mockResolvedValue(
        mockResponse,
      );

      const response = await repository.exportExecutionCapacity();

      expect(
        mockPrisma.exportacao_capacidade_execucao.findMany,
      ).toHaveBeenCalledTimes(1);
      expect(response).toEqual(mockResponse);
    });
  });

  describe('exportForecast', () => {
    it('should call method and return all data of exportacao_forecast view', async () => {
      mockPrisma.exportacao_forecast.findMany.mockResolvedValue(
        exportacaoForecastMock,
      );

      const response = await repository.exportForecast();

      expect(mockPrisma.exportacao_forecast.findMany).toHaveBeenCalledTimes(1);
      expect(response).toEqual(exportacaoForecastMock);
    });
  });

  describe('ExportRejections', () => {
    it('should call exportRejections and return the data', async () => {
      mockPrisma.programacoes_reprovacoes.findMany.mockResolvedValue(
        exportRejectionsMock,
      );

      const response = await repository.exportRejections();

      expect(
        mockPrisma.programacoes_reprovacoes.findMany,
      ).toHaveBeenCalledTimes(1);
      expect(mockPrisma.programacoes_reprovacoes.findMany).toHaveBeenCalledWith(
        {
          select: {
            obras: { select: { ovnota: true } },
            data_prog: true,
            motivo: true,
            hora_ini: true,
            hora_ter: true,
            prog: true,
            descricao: true,
            equip_desligado: true,
            equipe_linha_morta: true,
            equipe_linha_viva: true,
            equipe_regularizacao: true,
            tipo_servico: true,
            observacao_programacao: true,
          },
        },
      );
      expect(response).toEqual(exportRejectionsMock);
    });
  });

  describe('exportSuspension', () => {
    it('should call exportSuspensions and return the data', async () => {
      const mockResponse = [{ ovnota: '2134', ordem_dci: '23124' }];

      mockPrisma.suspensoes.findMany.mockResolvedValue(mockResponse);

      const response = await repository.exportSuspensions();

      expect(mockPrisma.suspensoes.findMany).toHaveBeenCalledTimes(1);
      expect(mockPrisma.suspensoes.findMany).toHaveBeenCalledWith({
        select: {
          obras: {
            select: {
              ovnota: true,
              status: { select: { status: true } },
              tipos: { select: { tipo_obra: true } },
              turmas: { select: { turma: true } },
              municipios: {
                select: {
                  municipio: true,
                  regionais: { select: { regional: true } },
                },
              },
            },
          },
          data: true,
          motivo: true,
        },
      });
      expect(response).toEqual(mockResponse);
    });
  });

  describe('exportSuspensionsRemoved', () => {
    it('should call exportSuspensionsRemoved and return the data', async () => {
      const mockResponse = [{ ovnota: '2134', ordem_dci: '23124' }];

      mockPrisma.suspensoes_retiradas.findMany.mockResolvedValue(mockResponse);

      const response = await repository.exportSuspensionsRemoved();

      expect(mockPrisma.suspensoes_retiradas.findMany).toHaveBeenCalledTimes(1);
      expect(mockPrisma.suspensoes_retiradas.findMany).toHaveBeenCalledWith({
        select: {
          obras: {
            select: {
              ovnota: true,
              tipos: { select: { tipo_obra: true } },
              turmas: { select: { turma: true } },
              municipios: {
                select: {
                  municipio: true,
                  regionais: { select: { regional: true } },
                },
              },
            },
          },
          status: { select: { status: true } },
          data_retirada: true,
        },
      });
      expect(response).toEqual(mockResponse);
    });
  });

  describe('exportFinedWorks', () => {
    it('should call exportFinedWorks and return the data without filters', async () => {
      const mockResponse = [{ ovnota: '2134', ordem_dci: '23124' }];

      mockPrisma.programacoes.findMany.mockResolvedValue(mockResponse);

      const response = await repository.exportFinedWorks(null, null);

      expect(mockPrisma.programacoes.findMany).toHaveBeenCalledTimes(1);
      expect(mockPrisma.programacoes.findMany).toHaveBeenCalledWith({
        where: {
          nome_responsavel_execucao: 'PARCEIRA',
          prog: { not: 0 },
          exec: 0,
        },
        select: {
          obras: {
            select: {
              ovnota: true,
              diagrama: true,
              ordem_dci: true,
              municipios: {
                select: { regionais: { select: { regional: true } } },
              },
              tipos: { select: { tipo_obra: true } },
              turmas: { select: { turma: true } },
            },
          },
          data_prog: true,
          hora_ini: true,
          hora_ter: true,
          prog: true,
          exec: true,
          num_dp: true,
          programacoes_restricao_execucao: { select: { restricao: true } },
          nome_responsavel_execucao: true,
        },
      });
      expect(response).toEqual(mockResponse);
    });

    it('should call exportFinedWorks and return the data with filters', async () => {
      const mockResponse = [{ ovnota: '2134', ordem_dci: '23124' }];
      const expectedStart = moment('2025-10-15').startOf('day').utc().toDate();
      const expectedEnd = moment('2025-10-29').startOf('day').utc().toDate();

      mockPrisma.programacoes.findMany.mockResolvedValue(mockResponse);

      const response = await repository.exportFinedWorks(
        expectedStart,
        expectedEnd,
      );

      expect(mockPrisma.programacoes.findMany).toHaveBeenCalledTimes(1);
      expect(mockPrisma.programacoes.findMany).toHaveBeenCalledWith({
        where: {
          nome_responsavel_execucao: 'PARCEIRA',
          prog: { not: 0 },
          exec: 0,
          data_prog: { gte: expectedStart, lte: expectedEnd },
        },
        select: {
          obras: {
            select: {
              ovnota: true,
              diagrama: true,
              ordem_dci: true,
              municipios: {
                select: { regionais: { select: { regional: true } } },
              },
              tipos: { select: { tipo_obra: true } },
              turmas: { select: { turma: true } },
            },
          },
          data_prog: true,
          hora_ini: true,
          hora_ter: true,
          prog: true,
          exec: true,
          num_dp: true,
          programacoes_restricao_execucao: { select: { restricao: true } },
          nome_responsavel_execucao: true,
        },
      });
      expect(response).toEqual(mockResponse);
    });
  });

  describe('exportExecutionReport', () => {
    it('should call exportExecutionReport and return the data', async () => {
      mockPrisma.relatorio_execucao.findMany.mockResolvedValue(
        mockFindByWorkIdResponseFormatted,
      );

      const response = await repository.exportExecutionReport();

      expect(mockPrisma.relatorio_execucao.findMany).toHaveBeenCalledTimes(1);
      expect(mockPrisma.relatorio_execucao.findMany).toHaveBeenCalledWith({
        select: {
          id: true,
          criado_em: true,
          supervisor: true,
          liberado_ligacao_parcial: true,
          hora_inicio: true,
          hora_conclusao: true,
          contato_inicio: true,
          contato_termino: true,
          atraso: true,
          justificativa_atraso: true,
          possui_equipamentos_instalados: true,
          equipamentos_aplicados: true,
          potencia_equipamento_aplicado: true,
          patrimonio_equipamento_aplicado: true,
          instalacao_equipamento_aplicado: true,
          possui_equipamentos_retirados: true,
          equipamentos_retirados: true,
          potencia_equipamento_retirado: true,
          patrimonio_equipamento_retirado: true,
          instalacao_equipamento_retirado: true,
          alteracoes_execucao: true,
          observacoes_gerais: true,
          chave_provisoria_instalada: true,
          referencia_chave_provisoria: true,
          chave_provisoria_retirada: true,
          referencia_chave_provisoria_retirada: true,
          motivo: true,
          usuario: { select: { nome: true } },
          obras: {
            select: {
              ovnota: true,
              diagrama: true,
              ordem_dci: true,
              ordem_dcd: true,
              ordem_dca: true,
              ordem_dcim: true,
              executado: true,
              entrada: true,
              prazo: true,
              tipos: { select: { tipo_obra: true } },
              status: { select: { status: true } },
              turmas: { select: { turma: true } },
            },
          },
          programacoes: {
            select: {
              data_prog: true,
              prog: true,
              exec: true,
              num_dp: true,
              hora_ini: true,
              hora_ter: true,
              chave_provisoria: true,
            },
          },
        },
      });
      expect(response).toEqual(mockFindByWorkIdResponseFormatted);
    });
  });

  describe('exportSchedules', () => {
    it('should call method and return all data of exportacao_programacoes_obras view', async () => {
      const mockResponse = [
        {
          ovnota: '123',
          grupo: 'mercado',
          tipo_obra: 'Ligação',
          status: 'Programado',
          ordemdiagrama: '23453',
        },
      ];

      mockPrisma.exportacao_ordens.findMany.mockResolvedValue(mockResponse);

      const response = await repository.exportOrders();

      expect(mockPrisma.exportacao_ordens.findMany).toHaveBeenCalledTimes(1);
      expect(response).toEqual(mockResponse);
    });
  });
});
