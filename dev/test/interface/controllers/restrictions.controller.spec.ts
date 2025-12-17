import { Test, TestingModule } from '@nestjs/testing';
import { RestrictionController } from 'src/interface/controllers/restrictions.controller';
import { RestrictionsService } from 'src/application/restrictions.service';
import {
  mockGetRestrictionsFilters,
  mockGetScheduleRestrictions,
  mockInsertPublicationRestrictions,
  mockUpdatePublicationRestrictions,
} from '../../../test/mocks/mockRestrictions';
import { UsersService } from 'src/application/users.service';

describe('RestrictionController ', () => {
  let controller: RestrictionController;
  let service: RestrictionsService;

  const mockReq = {
    insufficientPermission: true,
    idParceira: 1,
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
            insertPublicationRestriction: jest.fn(),
            updatePublicationRestriction: jest.fn(),
            deletePublicationRestriction: jest.fn(),
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

  it('Should call getPublicationRestriction service method with the provided filters and return a successful response with the expected structure', async () => {
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

  it('Should call getPublicationRestriction service method with the provided filters, without idParceira in req and return a successful response with the expected structure', async () => {
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
