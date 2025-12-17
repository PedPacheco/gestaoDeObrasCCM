import { Test, TestingModule } from '@nestjs/testing';

import { RestrictionsService } from 'src/application/restrictions.service';
import { RESTRICTIONS_REPOSITORY } from 'src/domain/repositories/IRestrictionsRepository';
import {
  mockGetRestrictionsFilters,
  mockGetScheduleRestrictions,
  mockInsertPublicationRestrictions,
  mockUpdatePublicationRestrictions,
  mockUpdatePublicationRestrictionsWithResoltuionDate,
} from '../../test/mocks/mockRestrictions';
import * as moment from 'moment';

describe('RestrictionsService', () => {
  let service: RestrictionsService;

  const mockRepository = {
    getScheduleRestrictions: jest.fn(),
    getPublicationRestricion: jest.fn(),
    insertPublicationRestriction: jest.fn(),
    updatePublicationRestriction: jest.fn(),
    deletePublicationRestriction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RestrictionsService,
        { provide: RESTRICTIONS_REPOSITORY, useValue: mockRepository },
      ],
    }).compile();

    service = module.get<RestrictionsService>(RestrictionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('GetScheduleRestrictons', () => {
    it('should return schedule restrictions and correctly format totals from repository response', async () => {
      mockRepository.getScheduleRestrictions.mockResolvedValue({
        works: [mockGetScheduleRestrictions],
        totals: [{ total_obras: 1n }],
      });

      const response = await service.getScheduleRestricion(
        mockGetRestrictionsFilters,
      );

      expect(response).toEqual({
        works: [mockGetScheduleRestrictions],
        totals: { total_obras: 1 },
      });
    });
  });

  describe('GetPublicationRestrictions', () => {
    it('should return publication restrictions and correctly format totals from repository response', async () => {
      mockRepository.getPublicationRestricion.mockResolvedValue({
        works: [mockGetScheduleRestrictions],
      });

      const response = await service.getPublicationRestriction(
        mockGetRestrictionsFilters,
      );

      expect(response).toEqual({
        works: [mockGetScheduleRestrictions],
      });
    });
  });

  describe('InsertPublicationRestrictions', () => {
    it('should sent data to inserPublictionRestriction in repository', async () => {
      mockRepository.insertPublicationRestriction.mockResolvedValue({
        works: [mockGetScheduleRestrictions],
      });

      await service.insertPublicationRestriction(
        mockInsertPublicationRestrictions,
      );

      expect(mockRepository.insertPublicationRestriction).toHaveBeenCalledWith(
        mockInsertPublicationRestrictions,
      );
    });
  });

  describe('UpdatePublictionRestrictions', () => {
    it('should sent data to UpdatePublictionRestrictions in repository with resolution date value', async () => {
      await service.updatePublicationRestriction(
        mockUpdatePublicationRestrictionsWithResoltuionDate,
      );

      expect(mockRepository.updatePublicationRestriction).toHaveBeenCalledWith({
        ...mockUpdatePublicationRestrictionsWithResoltuionDate,
        resolutionDate: moment('17-12-2025', 'DD/MM/YYYY', true).toISOString(),
      });
    });

    it('should sent data to UpdatePublictionRestrictions in repository without resolution date value', async () => {
      await service.updatePublicationRestriction(
        mockUpdatePublicationRestrictions,
      );

      expect(mockRepository.updatePublicationRestriction).toHaveBeenCalledWith({
        ...mockUpdatePublicationRestrictionsWithResoltuionDate,
        resolutionDate: null,
      });
    });
  });

  describe('DeletePublicationRestrictions', () => {
    it('should sent id to DeletePublicationRestrictions in repository', async () => {
      await service.deletePublicationRestriction(1);

      expect(mockRepository.deletePublicationRestriction).toHaveBeenCalledWith(
        1,
      );
    });
  });
});
