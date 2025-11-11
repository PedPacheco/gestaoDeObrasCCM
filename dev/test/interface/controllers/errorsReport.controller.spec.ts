import { ErrorsReportService } from 'src/application/errorsReport.service';
import { ErrorsReportController } from 'src/interface/controllers/ErrorsReport.controller';

import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus } from '@nestjs/common';

describe('UsersControllers', () => {
  let controller: ErrorsReportController;

  const mockService = {
    findUndefinedItems: jest.fn(),
    findScheduleError: jest.fn(),
    findZeroCapex: jest.fn(),
    findExecutionDifferential: jest.fn(),
    findDivergentConclusion: jest.fn(),
    findWorksWithoutYearPlan: jest.fn(),
    findRepeatedWorks: jest.fn(),
  };

  beforeEach(async () => {
    jest.resetAllMocks();

    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [ErrorsReportController],
      providers: [{ provide: ErrorsReportService, useValue: mockService }],
    }).compile();

    controller = moduleRef.get<ErrorsReportController>(ErrorsReportController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call searchWorksWithUndefiendItens and return with object correct', async () => {
    mockService.findUndefinedItems.mockResolvedValue([]);

    const response = await controller.searchWorksWithUndefiendItens(1);

    expect(response).toEqual({
      statusCode: HttpStatus.OK,
      message: 'Retornadas obras com itens não definidos',
      data: [],
    });
  });

  it('should call searchWorksWithUndefiendItens and return with object correct', async () => {
    mockService.findUndefinedItems.mockResolvedValue([]);

    const response = await controller.searchWorksWithUndefiendItens(1);

    expect(response).toEqual({
      statusCode: HttpStatus.OK,
      message: 'Retornadas obras com itens não definidos',
      data: [],
    });
    expect(mockService.findUndefinedItems).toHaveBeenCalledWith(1);
  });

  it('should call getWorksWithScheduleError and return with object correct', async () => {
    mockService.findScheduleError.mockResolvedValue([]);

    const response = await controller.getWorksWithScheduleError(1);

    expect(response).toEqual({
      statusCode: HttpStatus.OK,
      message: 'Retornadas obras com erros na programção',
      data: [],
    });
    expect(mockService.findScheduleError).toHaveBeenCalledWith(1);
  });

  it('should call getWorksZeroCapex and return with object correct', async () => {
    mockService.findZeroCapex.mockResolvedValue([]);

    const response = await controller.getWorksZeroCapex(1);

    expect(response).toEqual({
      statusCode: HttpStatus.OK,
      message: 'Retornadas obras com valor zerado',
      data: [],
    });
    expect(mockService.findZeroCapex).toHaveBeenCalledWith(1);
  });

  it('should call getExecutionDifferential and return with object correct', async () => {
    mockService.findExecutionDifferential.mockResolvedValue([]);

    const response = await controller.getExecutionDifferential(1);

    expect(response).toEqual({
      statusCode: HttpStatus.OK,
      message: 'Retornadas obras com diferencial de execução',
      data: [],
    });
    expect(mockService.findExecutionDifferential).toHaveBeenCalledWith(1);
  });

  it('should call getDivergentConclusion and return with object correct', async () => {
    mockService.findDivergentConclusion.mockResolvedValue([]);

    const response = await controller.getDivergentConclusion(1);

    expect(response).toEqual({
      statusCode: HttpStatus.OK,
      message: 'Retornadas obras com conclusão divergente',
      data: [],
    });
    expect(mockService.findDivergentConclusion).toHaveBeenCalledWith(1);
  });

  it('should call getWorksWithoutYearPlan and return with object correct', async () => {
    mockService.findWorksWithoutYearPlan.mockResolvedValue([]);

    const response = await controller.getWorksWithoutYearPlan(1);

    expect(response).toEqual({
      statusCode: HttpStatus.OK,
      message: 'Retornadas obras sem ano do plano',
      data: [],
    });
    expect(mockService.findWorksWithoutYearPlan).toHaveBeenCalledWith(1);
  });

  it('should call getRepeatedWorks and return with object correct', async () => {
    mockService.findRepeatedWorks.mockResolvedValue([]);

    const response = await controller.getRepeatedWorks(1);

    expect(response).toEqual({
      statusCode: HttpStatus.OK,
      message: 'Retornadas obras duplicadas',
      data: [],
    });
    expect(mockService.findRepeatedWorks).toHaveBeenCalledWith(1);
  });
});
