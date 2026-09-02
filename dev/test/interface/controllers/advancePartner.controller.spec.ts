import { Test, TestingModule } from '@nestjs/testing';
import { AdvancePartnerService } from 'src/application/usecases/advancePartner/advancePartner.service';
import { UsersService } from 'src/application/usecases/users.service';
import { AdvancePartnerController } from 'src/interface/controllers/advancePartner.controller';

describe('AdvancePartnerController', () => {
  let controller: AdvancePartnerController;
  let service: AdvancePartnerService;

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
            getRestrictionsAdvancePartner: jest.fn(),
            getGripPartner: jest.fn(),
            getReaschedulingReasons: jest.fn(),
            getSparklinesByPartner: jest.fn(),
            getWeeksByPartner: jest.fn(),
          },
        },
        { provide: UsersService, useValue: { findUser: jest.fn() } },
      ],
    }).compile();

    controller = module.get<AdvancePartnerController>(AdvancePartnerController);
    service = module.get<AdvancePartnerService>(AdvancePartnerService);
  });

  it('Should call getRestrictionsAdvancePartner service method with the data and return a successful response with the expected structure', async () => {
    jest.spyOn(service, 'getRestrictionsAdvancePartner').mockResolvedValue([]);

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
    jest.spyOn(service, 'getGripPartner').mockResolvedValue([]);

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
    jest.spyOn(service, 'getReaschedulingReasons').mockResolvedValue([]);

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
    jest.spyOn(service, 'getSparklinesByPartner').mockResolvedValue([]);

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
    jest.spyOn(service, 'getWeeksByPartner').mockResolvedValue([]);

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
});
