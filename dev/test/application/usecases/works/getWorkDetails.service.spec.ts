import { GetWorkDetailsService } from 'src/application/usecases/works/management/getWorkDetails.service';
import { GET_WORKS_DETAILS_REPOSITORY } from 'src/domain/repositories/works/IGetWorksDetailsRepository';

import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { QueriesServicesService } from 'src/application/usecases/services/queriesServices.service';
import {
  mockGetWorkDetailsRepositoryQueryResponse,
  mockGetWorkDetailsRepositoryResponse,
} from '../../../mocks/works/mockGetWorkDetails';

describe('GetWorkDetailsService', () => {
  let getWorkDetailsService: GetWorkDetailsService;

  const mockRepository = {
    get: vi.fn(),
  };

  const mockQueriesServicesService = {
    getAllItems: vi.fn(),
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

  afterEach(() => vi.clearAllMocks());

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
        tipo: 'S',
      },
      {
        viabilizado: 4,
        qtdeAdicional: null,
        qtdeRealizada: null,
        valorUnit: 2,
        tipo: 'M',
      },
    ]);

    mockRepository.get.mockResolvedValue(
      mockGetWorkDetailsRepositoryQueryResponse,
    );

    const result = await getWorkDetailsService.get(id);

    expect(result).toEqual(mockGetWorkDetailsRepositoryResponse);
  });

  it('should throw ForbiddenException when the partner user is different from the partner of the work', async () => {
    const id = 244;

    mockRepository.get.mockResolvedValue({
      ...mockGetWorkDetailsRepositoryQueryResponse,
      id_turma: 3,
    });

    await expect(getWorkDetailsService.get(id, 2)).rejects.toThrow(
      ForbiddenException,
    );

    expect(mockRepository.get).toHaveBeenCalledWith(id);
    expect(mockQueriesServicesService.getAllItems).not.toHaveBeenCalled();
  });

  it('should be return the work details with format correct without feasibility info', async () => {
    const id = 244;
    mockQueriesServicesService.getAllItems.mockResolvedValue([
      {
        viabilizado: 4,
        qtdeAdicional: null,
        qtdeRealizada: null,
        valorUnit: 2,
        tipo: 'S',
      },
      {
        viabilizado: 4,
        qtdeAdicional: null,
        qtdeRealizada: null,
        valorUnit: 2,
        tipo: 'M',
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
