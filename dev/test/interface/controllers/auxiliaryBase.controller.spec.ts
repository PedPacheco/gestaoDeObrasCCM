import { AuxiliaryBaseService } from 'src/application/services/auxiliaryBase/auxiliaryBase.service';
import { UsersService } from 'src/application/services/users.service';
import { AuxiliaryBaseController } from 'src/interface/controllers/auxiliaryBase.controller';

import { HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import {
  mockInsertAuxiliaryBaseMarket,
  mockInsertAuxiliaryBaseNotes,
  mockMappedMarketWorks,
  mockMappedNotes,
} from '../../mocks/mocksAuxiliaryBaseController';
import { mockMaterialCapex } from '../../mocks/mocksMaterialCapex';

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
            insertAuxiliaryBaseCapex: jest.fn(),
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
        message: 'Valores das notas na base auxiliar retornadas com sucesso',
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
        });

      const result = await auxiliaryBaseController.InsertAuxiliaryBaseNotes({
        data: mockInsertAuxiliaryBaseNotes,
        operation: 'insert',
      });
      const expectedResponse = {
        statusCode: HttpStatus.CREATED,
        message: 'Notas inseridas na base auxiliar com sucesso',
        res: {
          insertedCount: 1,
          skippedNotes: ['2135534'],
        },
      };

      expect(
        auxiliaryBaseService.insertAuxiliaryBaseNotes,
      ).toHaveBeenCalledWith(mockInsertAuxiliaryBaseNotes, 'insert');
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('InsertAuxilaryBaseMarket', () => {
    it('should be call the method insertAuxiliaryBaseMarket and return correctly data', async () => {
      jest
        .spyOn(auxiliaryBaseService, 'insertAuxiliaryBaseMarket')
        .mockResolvedValue();

      const result = await auxiliaryBaseController.InsertAuxiliaryBaseMarket({
        data: mockInsertAuxiliaryBaseMarket,
        operation: 'insert',
      });
      const expectedResponse = {
        statusCode: HttpStatus.CREATED,
        message: 'Obras de mercado inseridas na base auxiliar com sucesso',
      };

      expect(
        auxiliaryBaseService.insertAuxiliaryBaseMarket,
      ).toHaveBeenCalledWith(mockInsertAuxiliaryBaseMarket, 'insert');
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('InsertAuxiliaryBaseCapex', () => {
    it('should be call the method insertAuxiliaryBaseCapex with correct data', async () => {
      jest
        .spyOn(auxiliaryBaseService, 'insertAuxiliaryBaseCapex')
        .mockResolvedValue();

      const result =
        await auxiliaryBaseController.InsertAuxiliaryBaseCapex(
          mockMaterialCapex,
        );

      const expectedResponse = {
        statusCode: HttpStatus.CREATED,
        message: 'Materiais importados com sucesso',
      };

      expect(
        auxiliaryBaseService.insertAuxiliaryBaseCapex,
      ).toHaveBeenCalledWith(mockMaterialCapex);
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('DeleteAuxiliaryBaseNotes', () => {
    it('should be call the method deleteAuxiliaryBaseNotes and return correctly data', async () => {
      jest.spyOn(auxiliaryBaseService, 'delete').mockResolvedValue();

      const result = await auxiliaryBaseController.DeleteAuxiliaryBaseNotes(56);
      const expectedResponse = {
        statusCode: HttpStatus.OK,
        message: 'Nota removida com sucesso',
      };

      expect(auxiliaryBaseService.delete).toHaveBeenCalledWith('baseNotes', 56);
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('DeleteAuxiliaryBaseMarket', () => {
    it('should be call the method DeleteAuxiliaryBaseMarket and return correctly data', async () => {
      jest.spyOn(auxiliaryBaseService, 'delete').mockResolvedValue();

      const result =
        await auxiliaryBaseController.DeleteAuxiliaryBaseMarket(56);
      const expectedResponse = {
        statusCode: HttpStatus.OK,
        message: 'Obra removida com sucesso',
      };

      expect(auxiliaryBaseService.delete).toHaveBeenCalledWith('baseOv', 56);
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('DeleteAuxiliaryBaseMarketWithoutId', () => {
    it('should be call the method DeleteAuxiliaryBaseMarketWithoutId and return correctly data', async () => {
      jest.spyOn(auxiliaryBaseService, 'delete').mockResolvedValue();

      const result =
        await auxiliaryBaseController.DeleteAuxiliaryBaseMarketWithoutId();
      const expectedResponse = {
        statusCode: HttpStatus.OK,
        message: 'Obra removida com sucesso',
      };

      expect(auxiliaryBaseService.delete).toHaveBeenCalledWith(
        'baseOv',
        undefined,
      );
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('DeleteAuxiliaryBaseNotesWithoutId', () => {
    it('should be call the method DeleteAuxiliaryBaseNotesWithoutId and return correctly data', async () => {
      jest.spyOn(auxiliaryBaseService, 'delete').mockResolvedValue();

      const result =
        await auxiliaryBaseController.DeleteAuxiliaryBaseNotesWithoutId();
      const expectedResponse = {
        statusCode: HttpStatus.OK,
        message: 'Nota removida com sucesso',
      };

      expect(auxiliaryBaseService.delete).toHaveBeenCalledWith(
        'baseNotes',
        undefined,
      );
      expect(result).toEqual(expectedResponse);
    });
  });
});
