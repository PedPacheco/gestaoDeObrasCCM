import { RestrictionsService } from 'src/application/usecases/restrictions.service';
import { UsersService } from 'src/application/usecases/users.service';
import { RestrictionController } from 'src/interface/controllers/restrictions.controller';

import { Test, TestingModule } from '@nestjs/testing';

import {
  mockGetRestrictionsFilters,
  mockGetScheduleRestrictions,
  mockInsertPublicationRestrictions,
  mockUpdatePublicationRestrictions,
} from '../../../test/mocks/mockRestrictions';

describe('RestrictionController ', () => {
  let controller: RestrictionController;
  let service: RestrictionsService;

  const mockReq = {
    idParceira: [1],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RestrictionController],
      providers: [
        {
          provide: RestrictionsService,
          useValue: {
            getScheduleRestricion: jest.fn(),
            getPublicationRestriction: jest.fn(),
            getRestrictionsAdvancePartner: jest.fn(),
            getGripPartner: jest.fn(),
            getScheduledWorks: jest.fn(),
            getReaschedulingReasons: jest.fn(),
            getExecutionRestrictions: jest.fn(),
            insertPublicationRestriction: jest.fn(),
            updatePublicationRestriction: jest.fn(),
            deletePublicationRestriction: jest.fn(),
            getPublicationRestrictionsByWorkId: jest.fn(),
          },
        },
        { provide: UsersService, useValue: { findUser: jest.fn() } },
      ],
    }).compile();

    controller = module.get<RestrictionController>(RestrictionController);
    service = module.get<RestrictionsService>(RestrictionsService);
  });

  it('Should call getPublicationRestriction service method with the provided filters and return a successful response with the expected structure', async () => {
    jest
      .spyOn(service, 'getPublicationRestriction')
      .mockResolvedValue({ works: [mockGetScheduleRestrictions] });

    const result = await controller.getPublicationsRestrictions(
      mockGetRestrictionsFilters,
      mockReq,
    );

    expect(service.getPublicationRestriction).toHaveBeenCalledWith(
      mockGetRestrictionsFilters,
    );
    expect(result).toEqual({
      data: { works: [mockGetScheduleRestrictions] },
      message: 'Restrições das programações retornadas com sucesso',
      statusCode: 200,
    });
  });

  it('Should call getScheduleRestricion service method with the provided filters and return a successful response with the expected structure', async () => {
    jest.spyOn(service, 'getScheduleRestricion').mockResolvedValue({
      works: [mockGetScheduleRestrictions],
      totals: { total_obras: 1 },
    });

    const result = await controller.getScheduleRestrictions(
      mockGetRestrictionsFilters,
      mockReq,
    );

    expect(service.getScheduleRestricion).toHaveBeenCalledWith(
      mockGetRestrictionsFilters,
    );
    expect(result).toEqual({
      data: {
        works: [mockGetScheduleRestrictions],
        totals: { total_obras: 1 },
      },
      message: 'Restrições das programações retornadas com sucesso',
      statusCode: 200,
    });
  });

  it('Should call getScheduleRestricion service method with the provided filters, without idParceira in req and return a successful response with the expected structure', async () => {
    jest.spyOn(service, 'getScheduleRestricion').mockResolvedValue({
      works: [mockGetScheduleRestrictions],
      totals: { total_obras: 1 },
    });

    const result = await controller.getScheduleRestrictions(
      mockGetRestrictionsFilters,
      {
        ...mockReq,
        idParceira: undefined,
      },
    );

    expect(service.getScheduleRestricion).toHaveBeenCalledWith(
      mockGetRestrictionsFilters,
    );
    expect(result).toEqual({
      data: {
        works: [mockGetScheduleRestrictions],
        totals: { total_obras: 1 },
      },
      message: 'Restrições das programações retornadas com sucesso',
      statusCode: 200,
    });
  });

  it('Should call getPublicationRestriction service method with the provided filters, without insufficientPermission in req and return a successful response with the expected structure', async () => {
    jest.spyOn(service, 'getScheduleRestricion').mockResolvedValue({
      works: [mockGetScheduleRestrictions],
      totals: { total_obras: 1 },
    });

    const result = await controller.getScheduleRestrictions(
      mockGetRestrictionsFilters,
      {
        ...mockReq,
        insufficientPermission: undefined,
      },
    );

    expect(service.getScheduleRestricion).toHaveBeenCalledWith(
      mockGetRestrictionsFilters,
    );
    expect(result).toEqual({
      data: {
        works: [mockGetScheduleRestrictions],
        totals: { total_obras: 1 },
      },
      message: 'Restrições das programações retornadas com sucesso',
      statusCode: 200,
    });
  });

  it('Should call getPublicationRestrictionsByWorkId service method with the data and return a successful response with the expected structure', async () => {
    jest
      .spyOn(service, 'getPublicationRestrictionsByWorkId')
      .mockResolvedValue([]);

    const result = await controller.getPublicationsRestrictionsByWorkID(1);

    expect(service.getPublicationRestrictionsByWorkId).toHaveBeenCalledWith(1);
    expect(result).toEqual({
      message: 'Restrições de publicação da obra retornadas com sucesso',
      data: [],
      statusCode: 200,
    });
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

  it('Should call getScheduledWorks service method with the data and return a successful response with the expected structure', async () => {
    jest.spyOn(service, 'getScheduledWorks').mockResolvedValue([]);

    const result = await controller.getScheduledWorks(
      {
        dataInicial: '2026-05-01',
        dataFinal: '2026-05-31',
      },
      mockReq,
    );

    expect(service.getScheduledWorks).toHaveBeenCalledWith({
      dataInicial: '2026-05-01',
      dataFinal: '2026-05-31',
      idParceira: [1],
    });
    expect(result).toEqual({
      message: 'Dados de obras programadas retornados com sucesso',
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

  it('Should call getExecutionRestrictions service method with the data and return a successful response with the expected structure', async () => {
    jest.spyOn(service, 'getExecutionRestrictions').mockResolvedValue([]);

    const result = await controller.getExecutionRestrictions(
      {
        dataInicial: '2026-05-01',
        dataFinal: '2026-05-31',
      },
      mockReq,
    );

    expect(service.getExecutionRestrictions).toHaveBeenCalledWith({
      dataInicial: '2026-05-01',
      dataFinal: '2026-05-31',
      idParceira: [1],
    });
    expect(result).toEqual({
      message: 'Restrições de execução retornadas com sucesso',
      data: [],
      statusCode: 200,
    });
  });

  it('Should call insertPublicationRestriction service method with the data and return a successful response with the expected structure', async () => {
    jest
      .spyOn(service, 'insertPublicationRestriction')
      .mockResolvedValue(undefined);

    const result = await controller.insertPublicationRestriction(
      mockInsertPublicationRestrictions,
    );

    expect(service.insertPublicationRestriction).toHaveBeenCalledWith(
      mockInsertPublicationRestrictions,
    );
    expect(result).toEqual({
      message: 'Restrição de publicação criada com sucesso',
      statusCode: 204,
    });
  });

  it('Should call updatePublicationRestriction service method with the data and return a successful response with the expected structure', async () => {
    jest
      .spyOn(service, 'updatePublicationRestriction')
      .mockResolvedValue(undefined);

    const result = await controller.updatePublicationRestrictions(
      mockUpdatePublicationRestrictions,
    );

    expect(service.updatePublicationRestriction).toHaveBeenCalledWith(
      mockUpdatePublicationRestrictions,
    );
    expect(result).toEqual({
      message: 'Restrição de publicação atualizadas com sucesso',
      statusCode: 204,
    });
  });

  it('Should call deletePublicationRestriction service method with the data and return a successful response with the expected structure', async () => {
    jest
      .spyOn(service, 'deletePublicationRestriction')
      .mockResolvedValue(undefined);

    const result = await controller.deletePublicationRestrictions(1);

    expect(service.deletePublicationRestriction).toHaveBeenCalledWith(1);
    expect(result).toEqual({
      message: 'Restrição de publicação excluída com sucesso',
      statusCode: 200,
    });
  });
});
