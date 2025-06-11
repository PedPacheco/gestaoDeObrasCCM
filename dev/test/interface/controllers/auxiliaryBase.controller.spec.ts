import { HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AuxiliaryBaseService } from 'src/domain/services/auxiliaryBase.service';
import { AuxiliaryBaseController } from 'src/interface/controllers/auxiliaryBase.controller';
import {
  mockInsertAuxiliaryBaseMarket,
  mockInsertAuxiliaryBaseNotes,
  mockMappedMarketWorks,
  mockMappedNotes,
} from '../../mocks/mocksAuxiliaryBaseController';
import { UsersService } from 'src/domain/services/users.service';

describe('AuxiliaryBaseController', () => {
  let auxiliaryBaseController: AuxiliaryBaseController;
  let auxiliaryBaseService: AuxiliaryBaseService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuxiliaryBaseController],
      providers: [
        {
          provide: AuxiliaryBaseService,
          useValue: {
            getNotes: jest.fn(),
            getMarket: jest.fn(),
            delete: jest.fn(),
            insertAuxiliaryBaseNotes: jest.fn(),
            insertAuxiliaryBaseMarket: jest.fn(),
          },
        },
        { provide: UsersService, useValue: { findUser: jest.fn() } },
      ],
    }).compile();

    auxiliaryBaseController = module.get<AuxiliaryBaseController>(
      AuxiliaryBaseController,
    );
    auxiliaryBaseService =
      module.get<AuxiliaryBaseService>(AuxiliaryBaseService);
  });

  it('Should be defined', () => {
    expect(auxiliaryBaseController).toBeDefined();
  });

  describe('getAuxiliaryBaseMarket', () => {
    it('should be call the method getAuxiliaryBaseMarket and return correctly data', async () => {
      jest
        .spyOn(auxiliaryBaseService, 'getMarket')
        .mockResolvedValue(mockMappedMarketWorks);

      const result = await auxiliaryBaseController.GetAuxiliaryBaseMarket(1);
      const expectedResponse = {
        statusCode: HttpStatus.OK,
        message: 'Valores retornados com sucesso',
        data: mockMappedMarketWorks,
      };

      expect(auxiliaryBaseService.getMarket).toHaveBeenCalledWith(1);
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('getAuxiliaryBaseNotes', () => {
    it('should be call the method getAuxiliaryBaseNotes and return correctly data', async () => {
      jest
        .spyOn(auxiliaryBaseService, 'getNotes')
        .mockResolvedValue(mockMappedNotes);

      const result = await auxiliaryBaseController.GetAuxiliaryBaseNotes(1);
      const expectedResponse = {
        statusCode: HttpStatus.OK,
        message: 'Notas inseridas na base auxiliar com sucesso',
        data: mockMappedNotes,
      };

      expect(auxiliaryBaseService.getNotes).toHaveBeenCalledWith(1);
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('InsertAuxiliaryBaseNotes', () => {
    it('should be call the method InsertAuxiliaryBaseNotes and return correctly data', async () => {
      jest
        .spyOn(auxiliaryBaseService, 'insertAuxiliaryBaseNotes')
        .mockResolvedValue({
          insertedCount: 1,
          skippedNotes: ['2135534'],
          skippedOrders: ['423112344'],
        });

      const result = await auxiliaryBaseController.InsertAuxiliaryBaseNotes(
        mockInsertAuxiliaryBaseNotes,
      );
      const expectedResponse = {
        statusCode: HttpStatus.OK,
        message: 'Notas inseridas na base auxiliar com sucesso',
        res: {
          insertedCount: 1,
          skippedNotes: ['2135534'],
          skippedOrders: ['423112344'],
        },
      };

      expect(
        auxiliaryBaseService.insertAuxiliaryBaseNotes,
      ).toHaveBeenCalledWith(mockInsertAuxiliaryBaseNotes);
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('InsertAuxilaryBaseMarket', () => {
    it('should be call the method insertAuxiliaryBaseMarket and return correctly data', async () => {
      jest
        .spyOn(auxiliaryBaseService, 'insertAuxiliaryBaseMarket')
        .mockResolvedValue();

      const result = await auxiliaryBaseController.InsertAuxiliaryBaseMarket(
        mockInsertAuxiliaryBaseMarket,
      );
      const expectedResponse = {
        statusCode: HttpStatus.OK,
        message: 'Obras de mercado inseridas na base auxiliar com sucesso',
      };

      expect(
        auxiliaryBaseService.insertAuxiliaryBaseMarket,
      ).toHaveBeenCalledWith(mockInsertAuxiliaryBaseMarket);
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('DeleteAuxiliaryBaseNotes', () => {
    it('should be call the method deleteAuxiliaryBaseNotes and return correctly data', async () => {
      jest.spyOn(auxiliaryBaseService, 'delete').mockResolvedValue();

      const result = await auxiliaryBaseController.DeleteAuxiliaryBaseNotes();
      const expectedResponse = {
        statusCode: HttpStatus.OK,
        message: 'Dados removidos com sucessso',
      };

      expect(auxiliaryBaseService.delete).toHaveBeenCalledWith('baseNotes');
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('DeleteAuxiliaryBaseNotes', () => {
    it('should be call the method deleteAuxiliaryBaseNotes and return correctly data', async () => {
      jest.spyOn(auxiliaryBaseService, 'delete').mockResolvedValue();

      const result = await auxiliaryBaseController.DeleteAuxiliaryBaseMarket();
      const expectedResponse = {
        statusCode: HttpStatus.OK,
        message: 'Dados removidos com sucessso',
      };

      expect(auxiliaryBaseService.delete).toHaveBeenCalledWith('baseOv');
      expect(result).toEqual(expectedResponse);
    });
  });
});
