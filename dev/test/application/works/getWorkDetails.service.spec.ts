import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { GetWorkDetailsService } from 'src/application/works/getWorkDetails.service';
import { GET_WORKS_DETAILS_REPOSITORY } from 'src/domain/repositories/works/IGetWorksDetailsRepository';
import {
  mockGetWorkDetailsRepositoryQueryResponse,
  mockGetWorkDetailsRepositoryResponse,
} from '../../../test/mocks/works/mockGetWorkDetails';

describe('GetWorkDetailsService', () => {
  let getWorkDetailsService: GetWorkDetailsService;

  const mockRepository = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        GetWorkDetailsService,
        { provide: GET_WORKS_DETAILS_REPOSITORY, useValue: mockRepository },
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

    mockRepository.get.mockResolvedValue(null);

    await expect(getWorkDetailsService.get(id)).rejects.toThrow(
      new NotFoundException('Obra não encontrada'),
    );
  });

  it('should be return the work details with format correct', async () => {
    const id = 244;

    mockRepository.get.mockResolvedValue(
      mockGetWorkDetailsRepositoryQueryResponse,
    );

    const result = await getWorkDetailsService.get(id);

    expect(result).toEqual(mockGetWorkDetailsRepositoryResponse);
  });
});
