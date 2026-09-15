import { GetWorkDetailsService } from 'src/application/usecases/works/getWorkDetails.service';
import { GET_WORKS_DETAILS_REPOSITORY } from 'src/domain/repositories/works/IGetWorksDetailsRepository';

import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import {
  mockGetWorkDetailsRepositoryQueryResponse,
  mockGetWorkDetailsRepositoryResponse,
} from '../../../mocks/works/mockGetWorkDetails';
import { QueriesServicesService } from 'src/application/usecases/services/queriesServices.service';

describe('GetWorkDetailsService', () => {
  let getWorkDetailsService: GetWorkDetailsService;

  const mockRepository = {
    get: jest.fn(),
  };

  const mockQueriesServicesService = {
    getAllItems: jest.fn(),
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        GetWorkDetailsService,
        {
          provide: GET_WORKS_DETAILS_REPOSITORY,
          useValue: mockRepository,
        },
        {
          provide: QueriesServicesService,
          useValue: mockQueriesServicesService,
        },
      ],
    }).compile();

    getWorkDetailsService = module.get<GetWorkDetailsService>(
      GetWorkDetailsService,
    );
  });

  it('should be defined', () => {
    expect(getWorkDetailsService).toBeDefined();
  });

  it('should be return undefined when searching for id if the id value is greater than or equal to 12', async () => {
    const id = 4552432432432;
    mockQueriesServicesService.getAllItems.mockResolvedValue([]);

    mockRepository.get.mockResolvedValue(null);

    await expect(getWorkDetailsService.get(id)).rejects.toThrow(
      new NotFoundException('Obra não encontrada'),
    );
  });

  it('should be return the work details with format correct', async () => {
    const id = 244;
    mockQueriesServicesService.getAllItems.mockResolvedValue([
      {
        viabilizado: 4,
        qtdeAdicional: null,
        qtdeRealizada: null,
        valorUnit: 2,
      },
    ]);

    mockRepository.get.mockResolvedValue(
      mockGetWorkDetailsRepositoryQueryResponse,
    );

    const result = await getWorkDetailsService.get(id);

    expect(result).toEqual(mockGetWorkDetailsRepositoryResponse);
  });

  it('should be return the work details with format correct without feasibility info', async () => {
    const id = 244;
    mockQueriesServicesService.getAllItems.mockResolvedValue([
      {
        viabilizado: 4,
        qtdeAdicional: null,
        qtdeRealizada: null,
        valorUnit: 2,
      },
    ]);

    mockRepository.get.mockResolvedValue({
      ...mockGetWorkDetailsRepositoryQueryResponse,
      relatorio_viabilidade: undefined,
    });

    const result = await getWorkDetailsService.get(id);

    expect(result).toEqual({
      ...mockGetWorkDetailsRepositoryResponse,
      prazo_viabilidade: 'FALTA VIABILIDADE',
      viabilidade_aprovada: false,
    });
  });
});
