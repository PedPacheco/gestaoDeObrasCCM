import { ExportServicesPdfOutput } from 'src/application/usecases/export/services/exportPdfServices.service';
import { ExportServicesService } from 'src/application/usecases/services/exportServices.service';
import { WORK_SERVICES_QUERY_REPOSITORY } from 'src/domain/repositories/worksService/IWorkServicesQueryRepository';
import { ExportFileType } from 'src/interface/dtos/workServicesDTO';
import {
  ExportServicesExcelOutput,
  WorkToExportResponse,
} from 'src/interface/types/servicesInterface';

import { Test, TestingModule } from '@nestjs/testing';
import { Decimal } from '@prisma/client/runtime/library';

const exportRepositoryResponse: WorkToExportResponse[] = [
  {
    ovnota: 'OV001',
    diagrama: 'D001',
    referencia: 'REF001',
    ordem_dci: null,
    ordem_dca: null,
    ordem_dcd: null,
    ordem_dcim: null,
    executado: null,
    tipos: {
      tipo_obra: 'Construção',
    },
    municipios: {
      municipio: 'São Paulo',
    },
    turmas: {
      turma: 'Parceira A',
    },
    empreendimento: {
      empreendimento: 'Empreendimento Teste',
    },
    circuitos: {
      circuito: 'CIR001',
      conjuntos: {
        conjunto: 'CONJ001',
      },
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
        hora_ini: new Date('2026-01-01T08:00:00'),
        hora_ter: new Date('2026-01-01T17:00:00'),
        equipe_linha_morta: 1,
        equipe_linha_viva: 2,
        equipe_regularizacao: 1,
        tecnicos: { tecnico: 'Luiz' },
      },
    ],
    servicos: [
      {
        operacao: 'Operação A',
        ponto: 'A1',
        viabilizado: 3,
        qtde_adicional: 2,
        materiais: null,
        servicos_contratos: {
          material: 'MAT001',
          texto_breve: 'SERVICO A',
          preco: 100,
          medida: 'UN',
        },
        programacoes_servicos: [
          {
            id_programacao: 1,
            prog: 80,
            real: 50,
            equipes: {
              equipe: 'Equipe A',
            },
          },
        ],
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

    it('should ignore service without team', async () => {
      mockWorksServicesRepository.getServicesToExportation.mockResolvedValue([
        {
          ...exportRepositoryResponse[0],
          servicos: [
            {
              ...exportRepositoryResponse[0].servicos[0],
              programacoes_servicos: [
                {
                  ...exportRepositoryResponse[0].servicos[0]
                    .programacoes_servicos[0],
                  equipes: null,
                },
              ],
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
              programacoes_servicos: [
                {
                  ...exportRepositoryResponse[0].servicos[0]
                    .programacoes_servicos[0],
                  id_programacao: 999,
                },
              ],
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
              programacoes_servicos: [
                {
                  ...exportRepositoryResponse[0].servicos[0]
                    .programacoes_servicos[0],
                  id_programacao: null,
                },
              ],
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
              programacoes_servicos: [
                {
                  ...exportRepositoryResponse[0].servicos[0]
                    .programacoes_servicos[0],
                  prog: null,
                },
              ],
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
              programacoes_servicos: [
                {
                  ...exportRepositoryResponse[0].servicos[0]
                    .programacoes_servicos[0],
                  id_programacao: 999,
                },
              ],
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
              programacoes_servicos: [
                {
                  ...exportRepositoryResponse[0].servicos[0]
                    .programacoes_servicos[0],
                  equipes: null,
                },
              ],
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
