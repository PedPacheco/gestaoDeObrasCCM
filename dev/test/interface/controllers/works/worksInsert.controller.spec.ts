import { UsersService } from 'src/application/services/users.service';
import { InsertWorksService } from 'src/application/services/works/InsertWorks.service';
import { WorksInsertController } from 'src/interface/controllers/works/worksInsert.controller';

import { HttpStatus } from '@nestjs/common';
import { Test } from '@nestjs/testing';

import {
  mockInsertNotesController,
  mockMarketWorks,
} from '../../../mocks/mockWorksController';

describe('WorksInsertController', () => {
  let worksController: WorksInsertController;
  let insertWorksService: InsertWorksService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [WorksInsertController],
      providers: [
        { provide: UsersService, useValue: { findUser: jest.fn() } },
        {
          provide: InsertWorksService,
          useValue: { insertMarketWorks: jest.fn(), insertNotes: jest.fn() },
        },
      ],
    }).compile();

    worksController = module.get<WorksInsertController>(WorksInsertController);
    insertWorksService = module.get<InsertWorksService>(InsertWorksService);
  });

  it('Should be defined', () => {
    expect(worksController).toBeDefined();
  });

  describe('InsertMarketWorks', () => {
    it('Should be call the method insertMarketWorks and return the correctly data', async () => {
      jest.spyOn(insertWorksService, 'insertMarketWorks').mockResolvedValue({
        insertedCount: 1,
        message: 'Inserção concluída com sucesso.',
        skipped: ['14895757'],
      });

      const result = await worksController.InsertMarketWorks(mockMarketWorks);

      const expectedResponse = {
        statusCode: HttpStatus.OK,
        message: 'Inserção concluída com sucesso.',
        insertedCount: 1,
        skipped: ['14895757'],
      };

      expect(insertWorksService.insertMarketWorks).toHaveBeenCalledWith(
        mockMarketWorks,
      );
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('InsertNotes', () => {
    it('Should be call the method insertNotes and return the correctly data', async () => {
      jest.spyOn(insertWorksService, 'insertNotes').mockResolvedValue();

      const result = await worksController.InsertNotes(
        mockInsertNotesController,
      );

      const expectedResponse = {
        statusCode: HttpStatus.OK,
        message: 'Notas inseridas com sucesso',
      };

      expect(insertWorksService.insertNotes).toHaveBeenCalledWith(
        mockInsertNotesController,
      );
      expect(result).toEqual(expectedResponse);
    });
  });
});
