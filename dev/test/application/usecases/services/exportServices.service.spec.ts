import { ExportServicesPdfOutput } from 'src/application/usecases/export/services/exportPdfServices.service';
import { ExportServicesService } from 'src/application/usecases/services/exportServices.service';
import { WORK_SERVICES_QUERY_REPOSITORY } from 'src/domain/repositories/worksService/IWorkServicesQueryRepository';
import { ExportFileType } from 'src/interface/dtos/workServicesDTO';
import { ExportServicesExcelOutput } from 'src/interface/types/servicesInterface';

import { Test, TestingModule } from '@nestjs/testing';
import { Decimal } from '@prisma/client/runtime/library';

const exportRepositoryResponse = [
  {
    ovnota: 'OV001',
    diagrama: 'D001',
    ordem_dci: null,
    ordem_dca: null,
    ordem_dcd: null,
    ordem_dcim: null,

    referencia: 'REF001',

    tipos: {
      tipo_obra: 'Construção',
    },

    municipios: {
      municipio: 'São Paulo',
    },

    circuitos: {
      circuito: 'CIR001',
      conjuntos: {
        conjunto: 'CONJ001',
      },
    },

    turmas: {
      turma: 'Parceira A',
    },

    empreendimento: {
      empreendimento: 'Empreendimento Teste',
    },

    programacoes: [
      {
        id: 1,
        data_prog: new Date('2026-01-01'),
        prog: 80,
        tipo_servico: 'LM',
        observacao_programacao: 'Obs',
        chi: 1,
        num_dp: '123',
        chave_provisoria: true,
      },
    ],

    servicos: [
      {
        id_programacao: 1,
        id_equipe: 10,

        operacao: 'Operação A',
        ponto: 'A1',

        qtde_adicional: 2,
        viabilizado: 3,

        equipes: {
          equipe: 'Equipe A',
        },

        servicos_contratos: {
          material: 'MAT001',
          texto_breve: 'SERVICO A',
          preco: 100,
        },

        materiais: null,
      },
    ],
  },
];

describe('ExportServicesService', () => {
  let service: ExportServicesService;

  const mockWorksServicesRepository = {
    getServicesToExportation: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExportServicesService,
        {
          provide: WORK_SERVICES_QUERY_REPOSITORY,
          useValue: mockWorksServicesRepository,
        },
      ],
    }).compile();

    service = module.get<ExportServicesService>(ExportServicesService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getServicesToExportation', () => {
    it('should return pdf export data', async () => {
      mockWorksServicesRepository.getServicesToExportation.mockResolvedValue(
        exportRepositoryResponse,
      );

      const result = await service.getServicesToExportation({
        dataInicial: '2026-01-01',
        dataFinal: '2026-01-31',
        idParceira: [1],
        fileType: 'pdf' as ExportFileType,
      });

      expect(result).toHaveLength(1);

      expect(result[0]).toMatchObject({
        ovnota: 'OV001',
        referencia: 'REF001',
      });
    });

    it('should return excel export data', async () => {
      mockWorksServicesRepository.getServicesToExportation.mockResolvedValue(
        exportRepositoryResponse,
      );

      const result = await service.getServicesToExportation({
        dataInicial: '2026-01-01',
        dataFinal: '2026-01-31',
        idParceira: [1],
        fileType: 'excel' as ExportFileType,
      });

      expect(result).toHaveLength(1);

      expect(result[0]).toMatchObject({
        ovnota: 'OV001',
        codigo: 'MAT001',
        descricao: 'SERVICO A',
      });
    });

    it('should send empty idEquipe array when not informed', async () => {
      mockWorksServicesRepository.getServicesToExportation.mockResolvedValue(
        [],
      );

      await service.getServicesToExportation({
        dataInicial: '2026-01-01',
        dataFinal: '2026-01-31',
        idParceira: [1],
        fileType: 'excel' as ExportFileType,
      });

      expect(
        mockWorksServicesRepository.getServicesToExportation,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          idEquipe: [],
        }),
      );
    });

    it('should ignore service without programacao', async () => {
      mockWorksServicesRepository.getServicesToExportation.mockResolvedValue([
        {
          ...exportRepositoryResponse[0],
          servicos: [
            {
              ...exportRepositoryResponse[0].servicos[0],
              id_programacao: null,
            },
          ],
        },
      ]);

      const result = await service.getServicesToExportation({
        dataInicial: '2026-01-01',
        dataFinal: '2026-01-31',
        idParceira: [1],
        fileType: 'pdf' as ExportFileType,
      });

      expect(result).toEqual([]);
    });

    it('should ignore service without team', async () => {
      mockWorksServicesRepository.getServicesToExportation.mockResolvedValue([
        {
          ...exportRepositoryResponse[0],
          servicos: [
            {
              ...exportRepositoryResponse[0].servicos[0],
              id_equipe: null,
            },
          ],
        },
      ]);

      const result = await service.getServicesToExportation({
        dataInicial: '',
        dataFinal: '',
        idParceira: [1],
        fileType: 'pdf' as ExportFileType,
      });

      expect(result).toEqual([]);
    });

    it('should ignore service when programacao does not exist', async () => {
      mockWorksServicesRepository.getServicesToExportation.mockResolvedValue([
        {
          ...exportRepositoryResponse[0],
          servicos: [
            {
              ...exportRepositoryResponse[0].servicos[0],
              id_programacao: 999,
            },
          ],
        },
      ]);

      const result = await service.getServicesToExportation({
        dataInicial: '',
        dataFinal: '',
        idParceira: [1],
        fileType: 'pdf' as ExportFileType,
      });

      expect(result).toEqual([]);
    });

    it('should use material data when contract service is null', async () => {
      mockWorksServicesRepository.getServicesToExportation.mockResolvedValue([
        {
          ...exportRepositoryResponse[0],
          servicos: [
            {
              ...exportRepositoryResponse[0].servicos[0],
              servicos_contratos: null,
              materiais: {
                codigo: 'MAT999',
                descricao: 'Material Teste',
                preco: new Decimal(50),
              },
            },
          ],
        },
      ]);

      const result = await service.getServicesToExportation({
        dataInicial: '',
        dataFinal: '',
        idParceira: [1],
        fileType: 'excel' as ExportFileType,
      });

      expect(result[0]).toMatchObject({
        codigo: 'MAT999',
        descricao: 'Material Teste',
      });
    });

    it('should use fallback values when material and service are null', async () => {
      mockWorksServicesRepository.getServicesToExportation.mockResolvedValue([
        {
          ...exportRepositoryResponse[0],
          servicos: [
            {
              ...exportRepositoryResponse[0].servicos[0],
              servicos_contratos: null,
              materiais: null,
            },
          ],
        },
      ]);

      const result = await service.getServicesToExportation({
        dataInicial: '',
        dataFinal: '',
        idParceira: [1],
        fileType: 'excel' as ExportFileType,
      });

      expect(result[0]).toMatchObject({
        codigo: '-',
        descricao: '-',
      });
    });

    it('should sort services by point and operation', async () => {
      mockWorksServicesRepository.getServicesToExportation.mockResolvedValue([
        {
          ...exportRepositoryResponse[0],
          servicos: [
            {
              ...exportRepositoryResponse[0].servicos[0],
              ponto: 'B10',
              operacao: 'Z',
            },
            {
              ...exportRepositoryResponse[0].servicos[0],
              ponto: 'A2',
              operacao: 'A',
            },
            {
              ...exportRepositoryResponse[0].servicos[0],
              ponto: 'A1',
              operacao: 'B',
            },
          ],
        },
      ]);

      const result = (await service.getServicesToExportation({
        dataInicial: '',
        dataFinal: '',
        idParceira: [1],
        fileType: 'pdf' as ExportFileType,
      })) as ExportServicesPdfOutput[];

      expect(result[0].servicos.map((x) => x.ponto)).toEqual([
        'A1',
        'A2',
        'B10',
      ]);
    });

    it('should use ordem_dci when diagrama is null', async () => {
      mockWorksServicesRepository.getServicesToExportation.mockResolvedValue([
        {
          ...exportRepositoryResponse[0],
          diagrama: null,
          ordem_dci: 'DCI001',
        },
      ]);

      const result = await service.getServicesToExportation({
        dataInicial: '',
        dataFinal: '',
        idParceira: [1],
        fileType: 'excel' as ExportFileType,
      });

      const excelResult = result as ExportServicesExcelOutput[];

      expect(excelResult[0].ordemDiagrama).toBe('DCI001');
    });

    it('should use ordem_dca when diagrama and ordem_dci are null', async () => {
      mockWorksServicesRepository.getServicesToExportation.mockResolvedValue([
        {
          ...exportRepositoryResponse[0],
          diagrama: null,
          ordem_dci: null,
          ordem_dca: 'DCA001',
        },
      ]);

      const result = await service.getServicesToExportation({
        dataInicial: '',
        dataFinal: '',
        idParceira: [1],
        fileType: 'excel' as ExportFileType,
      });

      expect((result as ExportServicesExcelOutput[])[0].ordemDiagrama).toBe(
        'DCA001',
      );
    });

    it('should use ordem_dcd when previous diagram values are null', async () => {
      mockWorksServicesRepository.getServicesToExportation.mockResolvedValue([
        {
          ...exportRepositoryResponse[0],
          diagrama: null,
          ordem_dci: null,
          ordem_dca: null,
          ordem_dcd: 'DCD001',
        },
      ]);

      const result = await service.getServicesToExportation({
        dataInicial: '',
        dataFinal: '',
        idParceira: [1],
        fileType: 'excel' as ExportFileType,
      });

      expect((result as ExportServicesExcelOutput[])[0].ordemDiagrama).toBe(
        'DCD001',
      );
    });

    it('should use ordem_dcim when all previous diagram fields are null', async () => {
      mockWorksServicesRepository.getServicesToExportation.mockResolvedValue([
        {
          ...exportRepositoryResponse[0],
          diagrama: null,
          ordem_dci: null,
          ordem_dca: null,
          ordem_dcd: null,
          ordem_dcim: 'DCIM001',
        },
      ]);

      const result = await service.getServicesToExportation({
        dataInicial: '',
        dataFinal: '',
        idParceira: [1],
        fileType: 'excel' as ExportFileType,
      });

      expect((result as ExportServicesExcelOutput[])[0].ordemDiagrama).toBe(
        'DCIM001',
      );
    });

    it('should use ordem_dca when diagrama and ordem_dci are null', async () => {
      mockWorksServicesRepository.getServicesToExportation.mockResolvedValue([
        {
          ...exportRepositoryResponse[0],
          diagrama: null,
          ordem_dci: null,
          ordem_dca: 'DCA001',
        },
      ]);

      const result = await service.getServicesToExportation({
        dataInicial: '',
        dataFinal: '',
        idParceira: [1],
        fileType: 'pdf' as ExportFileType,
      });

      expect((result as ExportServicesExcelOutput[])[0].ordemDiagrama).toBe(
        'DCA001',
      );
    });

    it('should use ordem_dcd when previous diagram values are null', async () => {
      mockWorksServicesRepository.getServicesToExportation.mockResolvedValue([
        {
          ...exportRepositoryResponse[0],
          diagrama: null,
          ordem_dci: null,
          ordem_dca: null,
          ordem_dcd: 'DCD001',
        },
      ]);

      const result = await service.getServicesToExportation({
        dataInicial: '',
        dataFinal: '',
        idParceira: [1],
        fileType: 'pdf' as ExportFileType,
      });

      expect((result as ExportServicesExcelOutput[])[0].ordemDiagrama).toBe(
        'DCD001',
      );
    });

    it('should use ordem_dcim when all previous diagram fields are null', async () => {
      mockWorksServicesRepository.getServicesToExportation.mockResolvedValue([
        {
          ...exportRepositoryResponse[0],
          diagrama: null,
          ordem_dci: null,
          ordem_dca: null,
          ordem_dcd: null,
          ordem_dcim: 'DCIM001',
        },
      ]);

      const result = await service.getServicesToExportation({
        dataInicial: '',
        dataFinal: '',
        idParceira: [1],
        fileType: 'pdf' as ExportFileType,
      });

      expect((result as ExportServicesExcelOutput[])[0].ordemDiagrama).toBe(
        'DCIM001',
      );
    });

    it('should return null programacao data when id_programacao is null', async () => {
      mockWorksServicesRepository.getServicesToExportation.mockResolvedValue([
        {
          ...exportRepositoryResponse[0],
          servicos: [
            {
              ...exportRepositoryResponse[0].servicos[0],
              id_programacao: null,
            },
          ],
        },
      ]);

      const result = await service.getServicesToExportation({
        dataInicial: '',
        dataFinal: '',
        idParceira: [1],
        fileType: 'excel' as ExportFileType,
      });

      const excelResult = result as ExportServicesExcelOutput[];

      expect(excelResult[0].dataProg).toBeNull();
      expect(excelResult[0].prog).toBeNull();
    });

    it('should group services in the same pdf document', async () => {
      mockWorksServicesRepository.getServicesToExportation.mockResolvedValue([
        {
          ...exportRepositoryResponse[0],
          servicos: [
            {
              ...exportRepositoryResponse[0].servicos[0],
              ponto: 'A1',
            },
            {
              ...exportRepositoryResponse[0].servicos[0],
              ponto: 'A2',
            },
          ],
        },
      ]);

      const result = await service.getServicesToExportation({
        dataInicial: '',
        dataFinal: '',
        idParceira: [1],
        fileType: 'pdf' as ExportFileType,
      });

      const pdfResult = result as ExportServicesPdfOutput[];

      expect(pdfResult).toHaveLength(1);
      expect(pdfResult[0].servicos).toHaveLength(2);
    });

    it('should use zero when quantity fields are null', async () => {
      mockWorksServicesRepository.getServicesToExportation.mockResolvedValue([
        {
          ...exportRepositoryResponse[0],
          servicos: [
            {
              ...exportRepositoryResponse[0].servicos[0],
              qtde_adicional: null,
              viabilizado: null,
            },
          ],
        },
      ]);

      const result = await service.getServicesToExportation({
        dataInicial: '',
        dataFinal: '',
        idParceira: [1],
        fileType: 'excel' as ExportFileType,
      });

      const excelResult = result as ExportServicesExcelOutput[];

      expect(excelResult[0].quantidadeProgramada).toBe(0);
    });

    it('should use zero when quantity fields are null', async () => {
      mockWorksServicesRepository.getServicesToExportation.mockResolvedValue([
        {
          ...exportRepositoryResponse[0],
          servicos: [
            {
              ...exportRepositoryResponse[0].servicos[0],
              qtde_adicional: null,
              viabilizado: null,
            },
          ],
        },
      ]);

      const result = await service.getServicesToExportation({
        dataInicial: '',
        dataFinal: '',
        idParceira: [1],
        fileType: 'pdf' as ExportFileType,
      });

      const excelResult = result as ExportServicesPdfOutput[];

      expect(excelResult[0].servicos[0].prog).toBe(0);
    });

    it('should use material price when contract service is null', async () => {
      mockWorksServicesRepository.getServicesToExportation.mockResolvedValue([
        {
          ...exportRepositoryResponse[0],
          servicos: [
            {
              ...exportRepositoryResponse[0].servicos[0],
              servicos_contratos: null,
              materiais: {
                codigo: 'MAT999',
                descricao: 'Material Teste',
                preco: new Decimal(50),
              },
            },
          ],
        },
      ]);

      const result = await service.getServicesToExportation({
        dataInicial: '',
        dataFinal: '',
        idParceira: [1],
        fileType: 'excel' as ExportFileType,
      });

      expect((result as ExportServicesExcelOutput[])[0].preco).toBe(50);
    });

    it('should sort services even when point does not match regex pattern', async () => {
      mockWorksServicesRepository.getServicesToExportation.mockResolvedValue([
        {
          ...exportRepositoryResponse[0],
          servicos: [
            {
              ...exportRepositoryResponse[0].servicos[0],
              ponto: 'INVALIDO',
              operacao: 'B',
            },
            {
              ...exportRepositoryResponse[0].servicos[0],
              ponto: 'INVALIDO',
              operacao: 'A',
            },
          ],
        },
      ]);

      const result = await service.getServicesToExportation({
        dataInicial: '',
        dataFinal: '',
        idParceira: [1],
        fileType: 'pdf' as ExportFileType,
      });

      const pdfResult = result as ExportServicesPdfOutput[];

      expect(pdfResult[0].servicos[0].operacao).toBe('A');
      expect(pdfResult[0].servicos[1].operacao).toBe('B');
    });

    it('should use default values when material and service contract are null', async () => {
      mockWorksServicesRepository.getServicesToExportation.mockResolvedValue([
        {
          ...exportRepositoryResponse[0],
          servicos: [
            {
              ...exportRepositoryResponse[0].servicos[0],
              servicos_contratos: null,
              materiais: null,
            },
          ],
        },
      ]);

      const result = await service.getServicesToExportation({
        dataInicial: '',
        dataFinal: '',
        idParceira: [1],
        fileType: 'pdf' as ExportFileType,
      });

      const pdfResult = result as ExportServicesPdfOutput[];

      expect(pdfResult[0].servicos[0].codigo).toBe('-');
      expect(pdfResult[0].servicos[0].descricao).toBe('-');
    });

    it('should use null values when programacao is not found', async () => {
      mockWorksServicesRepository.getServicesToExportation.mockResolvedValue([
        {
          ...exportRepositoryResponse[0],
          programacoes: [],
          servicos: [
            {
              ...exportRepositoryResponse[0].servicos[0],
              id_programacao: 999,
            },
          ],
        },
      ]);

      const result = await service.getServicesToExportation({
        dataInicial: '',
        dataFinal: '',
        idParceira: [1],
        fileType: 'excel' as ExportFileType,
      });

      const excelResult = result as ExportServicesExcelOutput[];

      expect(excelResult[0].dataProg).toBeNull();
      expect(excelResult[0].prog).toBeNull();
    });

    it('should return null team when team is not informed', async () => {
      mockWorksServicesRepository.getServicesToExportation.mockResolvedValue([
        {
          ...exportRepositoryResponse[0],
          servicos: [
            {
              ...exportRepositoryResponse[0].servicos[0],
              equipes: null,
            },
          ],
        },
      ]);

      const result = await service.getServicesToExportation({
        dataInicial: '',
        dataFinal: '',
        idParceira: [1],
        fileType: 'excel' as ExportFileType,
      });

      const excelResult = result as ExportServicesExcelOutput[];

      expect(excelResult[0].equipe).toBeNull();
    });

    it('should sort by operation when point is the same', async () => {
      mockWorksServicesRepository.getServicesToExportation.mockResolvedValue([
        {
          ...exportRepositoryResponse[0],
          servicos: [
            {
              ...exportRepositoryResponse[0].servicos[0],
              ponto: 'A1',
              operacao: 'Z',
            },
            {
              ...exportRepositoryResponse[0].servicos[0],
              ponto: 'A1',
              operacao: 'A',
            },
          ],
        },
      ]);

      const result = await service.getServicesToExportation({
        dataInicial: '',
        dataFinal: '',
        idParceira: [1],
        fileType: 'pdf' as ExportFileType,
      });

      const pdfResult = result as ExportServicesPdfOutput[];

      expect(pdfResult[0].servicos[0].operacao).toBe('A');
      expect(pdfResult[0].servicos[1].operacao).toBe('Z');
    });
  });
});
