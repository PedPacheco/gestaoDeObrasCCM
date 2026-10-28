import { ConflictException, HttpStatus } from '@nestjs/common';
import { GUARDS_METADATA } from '@nestjs/common/constants.js';
import { Test, TestingModule } from '@nestjs/testing';
import { AdvancePartnerService } from 'src/application/usecases/advancePartner/advancePartner.service';
import { GetAdvancePartnerIndicatorsService } from 'src/application/usecases/advancePartner/getAdvancePartnerIndicators.service';
import { UsersService } from 'src/application/usecases/users.service';
import { AdvancePartnerController } from 'src/interface/controllers/advancePartner.controller';
import {
  CreateAdvancePartnerMonitoringDTO,
  IndicatorsDTO,
} from 'src/interface/dtos/advancePartnerDTO';

describe('AdvancePartnerController', () => {
  let controller: AdvancePartnerController;
  let service: AdvancePartnerService;
  let getIndicatorsService: GetAdvancePartnerIndicatorsService;

  const mockReq = {
    idParceira: [1],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdvancePartnerController],
      providers: [
        {
          provide: AdvancePartnerService,
          useValue: {
            getRestrictionsAdvancePartner: vi.fn(),
            getGripPartner: vi.fn(),
            getReaschedulingReasons: vi.fn(),
            getSparklinesByPartner: vi.fn(),
            getWeeksByPartner: vi.fn(),
            saveIndicators: vi.fn(),
          },
        },
        {
          provide: GetAdvancePartnerIndicatorsService,
          useValue: { execute: vi.fn() },
        },
        { provide: UsersService, useValue: { findUser: vi.fn() } },
      ],
    }).compile();

    controller = module.get<AdvancePartnerController>(AdvancePartnerController);
    service = module.get<AdvancePartnerService>(AdvancePartnerService);
    getIndicatorsService = module.get(GetAdvancePartnerIndicatorsService);
  });

  it('Should call getRestrictionsAdvancePartner service method with the data and return a successful response with the expected structure', async () => {
    vi.spyOn(service, 'getRestrictionsAdvancePartner').mockResolvedValue([]);

    const result = await controller.getRestrictionsAdvancePartner(
      {
        dataInicial: '2026-05-01',
        dataFinal: '2026-05-31',
      },
      mockReq,
    );

    expect(service.getRestrictionsAdvancePartner).toHaveBeenCalledWith({
      dataInicial: '2026-05-01',
      dataFinal: '2026-05-31',
      idParceira: [1],
    });
    expect(result).toEqual({
      message: 'Dados de eliminação de restrição retornados com sucesso',
      data: [],
      statusCode: 200,
    });
  });

  it('Should call getGripPartner service method with the data and return a successful response with the expected structure', async () => {
    vi.spyOn(service, 'getGripPartner').mockResolvedValue([]);

    const result = await controller.getGripPartner(
      {
        dataInicial: '2026-05-01',
        dataFinal: '2026-05-31',
      },
      mockReq,
    );

    expect(service.getGripPartner).toHaveBeenCalledWith({
      dataInicial: '2026-05-01',
      dataFinal: '2026-05-31',
      idParceira: [1],
    });
    expect(result).toEqual({
      message: 'Dados de aderência parceira retornados com sucesso',
      data: [],
      statusCode: 200,
    });
  });

  it('Should call getReaschedulingReasons service method with the data and return a successful response with the expected structure', async () => {
    vi.spyOn(service, 'getReaschedulingReasons').mockResolvedValue([]);

    const result = await controller.getReaschedulingReasons(
      {
        dataInicial: '2026-05-01',
        dataFinal: '2026-05-31',
        idParceira: [1],
      },
      { undefined },
    );

    expect(service.getReaschedulingReasons).toHaveBeenCalledWith({
      dataInicial: '2026-05-01',
      dataFinal: '2026-05-31',
      idParceira: [1],
    });
    expect(result).toEqual({
      message: 'Motivos de reprogramação retornados com sucesso',
      data: [],
      statusCode: 200,
    });
  });

  it('Should call getSparklinesByPartner service method with the data and return a successful response with the expected structure', async () => {
    vi.spyOn(service, 'getSparklinesByPartner').mockResolvedValue([]);

    const result = await controller.getSparklinesByPartner(
      {
        dataInicial: '2026-05-01',
        dataFinal: '2026-05-31',
      },
      mockReq,
    );

    expect(service.getSparklinesByPartner).toHaveBeenCalledWith({
      dataInicial: '2026-05-01',
      dataFinal: '2026-05-31',
      idParceira: [1],
    });
    expect(result).toEqual({
      message: 'Sparklines por parceira retornados com sucesso',
      data: [],
      statusCode: 200,
    });
  });

  it('Should call getWeeksByPartner service method with the data and return a successful response with the expected structure', async () => {
    vi.spyOn(service, 'getWeeksByPartner').mockResolvedValue([]);

    const result = await controller.getWeeksByPartner(
      {
        dataInicial: '2026-05-01',
        dataFinal: '2026-05-31',
      },
      mockReq,
    );

    expect(service.getWeeksByPartner).toHaveBeenCalledWith({
      dataInicial: '2026-05-01',
      dataFinal: '2026-05-31',
      idParceira: [1],
    });
    expect(result).toEqual({
      message: 'Semanas programadas por parceira retornadas com sucesso',
      data: [],
      statusCode: 200,
    });
  });

  describe('getIndicators', () => {
    const params = { idParceira: [1] } as unknown as IndicatorsDTO; // ajuste aos campos reais do DTO

    const indicatorsMock = [
      {
        pillar: 'Processos',
        reflection: 'Reflexão do pilar',
        indicators: [
          {
            pillar: 'Processos',
            name: 'Nº Semanas Programadas',
            baseline: 2,
            current: 3,
            target: 4,
            format: 'number',
            direction: 'up',
          },
        ],
      },
    ];

    it('should call the service with the query params', async () => {
      vi.mocked(getIndicatorsService.execute).mockResolvedValue(
        indicatorsMock as any,
      );

      await controller.getIndicators(params);

      expect(getIndicatorsService.execute).toHaveBeenCalledTimes(1);
      expect(getIndicatorsService.execute).toHaveBeenCalledWith(params);
    });

    it('should return the standard response with the indicators', async () => {
      vi.mocked(getIndicatorsService.execute).mockResolvedValue(
        indicatorsMock as any,
      );

      const result = await controller.getIndicators(params);

      expect(result).toEqual({
        statusCode: HttpStatus.OK,
        message: 'Indicadores do Avança Parceira retornados com sucesso',
        data: indicatorsMock,
      });
    });

    it('should return an empty list when there are no indicators', async () => {
      vi.mocked(getIndicatorsService.execute).mockResolvedValue([] as any);

      const result = await controller.getIndicators(params);

      expect(result.data).toEqual([]);
    });

    it('should propagate service errors', async () => {
      vi.mocked(getIndicatorsService.execute).mockRejectedValue(
        new Error('db error'),
      );

      await expect(controller.getIndicators(params)).rejects.toThrow(
        'db error',
      );
    });

    it('should be protected by a guard', () => {
      const guards = Reflect.getMetadata(
        GUARDS_METADATA,
        AdvancePartnerController.prototype.getIndicators,
      );
      expect(guards).toHaveLength(1);
    });
  });

  describe('saveIndicators', () => {
    const dto: CreateAdvancePartnerMonitoringDTO = {
      idParceira: 1,
      anoReferencia: 2026,
      mesReferencia: 10,
      procNumSemanasProg: 3,
      procAderenciaElimRestr: 85.5,
      procAderenciaProg: 90,
      prazoAderenciaExec: 88,
      prazoMultas: 1500.75,
      prazoBacklogVencidas: 4,
      retrTempoResolD5: 6,
      retrBacklogD5Qtd: 12,
      retrBacklogD5Valor: 3200,
      retrTaxa: 2.5,
      wpaOciosidade: 30,
      wpaTmsSaidaBase: 45,
      wpaOcupacao: 78,
      wpaAderenciaDisp: 92,
      cliEntradaReclamacoes: 5,
      cliReclamacoesForaPrazo: 10,
      cliProcedenciaReclamacoes: 40,
      procReflexao: 'Reflexão processos',
      prazoReflexao: 'Reflexão prazo',
      retrReflexao: 'Reflexão retrabalhos',
      wpaReflexao: 'Reflexão WPA',
      cliReflexao: 'Reflexão clientes',
    };

    it('should call the service with the received DTO', async () => {
      vi.mocked(service.saveIndicators).mockResolvedValue(undefined);

      await controller.insertIndicators(dto);

      expect(service.saveIndicators).toHaveBeenCalledTimes(1);
      expect(service.saveIndicators).toHaveBeenCalledWith(dto);
    });

    it('should return the success response', async () => {
      vi.mocked(service.saveIndicators).mockResolvedValue(undefined);

      const result = await controller.insertIndicators(dto);

      expect(result).toEqual({
        statusCode: HttpStatus.OK,
        message: 'Indicadores inseridos com sucesso',
      });
    });

    it('should propagate business errors (e.g. duplicated entry)', async () => {
      vi.mocked(service.saveIndicators).mockRejectedValue(
        new ConflictException(
          'Já existem indicadores lançados para esta parceira neste mês de referência.',
        ),
      );

      await expect(controller.insertIndicators(dto)).rejects.toBeInstanceOf(
        ConflictException,
      );
    });

    it('should propagate unexpected errors', async () => {
      vi.mocked(service.saveIndicators).mockRejectedValue(
        new Error('db error'),
      );

      await expect(controller.insertIndicators(dto)).rejects.toThrow(
        'db error',
      );
    });

    it('should be protected by a guard', () => {
      const guards = Reflect.getMetadata(
        GUARDS_METADATA,
        AdvancePartnerController.prototype.insertIndicators,
      );
      expect(guards).toHaveLength(1);
    });
  });
});
