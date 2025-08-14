import { plainToInstance } from 'class-transformer';
import { WorksController } from 'src/interface/controllers/works.controller';
import { GetAllWorksDTO, GetWorksDTO } from 'src/interface/dtos/worksDto';

import { HttpStatus } from '@nestjs/common';
import { Test } from '@nestjs/testing';

import {
  mockAllWorks,
  mockInsertNotesController,
  mockMarketWorks,
  mockResponseDetails,
  mockWorksInPortfolio,
} from '../../mocks/mockWorksController';
import { InsertWorksService } from 'src/application/works/InsertWorks.service';
import { GetWorkDetailsService } from 'src/application/works/getWorkDetails.service';
import { GetWorksInPortfolioService } from 'src/application/works/getWorksInPortfolio.service';
import { GetCompletedWorksService } from 'src/application/works/getCompletedWorks.service';
import { GetAllWorksService } from 'src/application/works/getAllWorks.service';
import { UsersService } from 'src/application/users.service';
import { HandleWorkUpdateService } from 'src/application/orchestrators/handleWorkUpdate.service';

describe('WorksController', () => {
  let worksController: WorksController;
  let getAllWorksService: GetAllWorksService;
  let getCompletedWorksService: GetCompletedWorksService;
  let getWorksInPortfolio: GetWorksInPortfolioService;
  let getWorkDetailsService: GetWorkDetailsService;
  let insertWorksService: InsertWorksService;
  let handleWorkUpdateService: HandleWorkUpdateService;

  const mockReq = {
    insufficientPermission: true,
    idRegional: 1,
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [WorksController],
      providers: [
        { provide: GetAllWorksService, useValue: { getAllWorks: jest.fn() } },
        {
          provide: GetCompletedWorksService,
          useValue: { getCompletedWorks: jest.fn() },
        },
        {
          provide: GetWorkDetailsService,
          useValue: { get: jest.fn() },
        },
        {
          provide: GetWorksInPortfolioService,
          useValue: { getWorksInPortfolio: jest.fn() },
        },
        { provide: UsersService, useValue: { findUser: jest.fn() } },
        {
          provide: InsertWorksService,
          useValue: { insertMarketWorks: jest.fn(), insertNotes: jest.fn() },
        },
        { provide: HandleWorkUpdateService, useValue: { update: jest.fn() } },
      ],
    }).compile();

    worksController = module.get<WorksController>(WorksController);
    getAllWorksService = module.get<GetAllWorksService>(GetAllWorksService);
    getCompletedWorksService = module.get<GetCompletedWorksService>(
      GetCompletedWorksService,
    );
    getWorksInPortfolio = module.get<GetWorksInPortfolioService>(
      GetWorksInPortfolioService,
    );
    getWorkDetailsService = module.get<GetWorkDetailsService>(
      GetWorkDetailsService,
    );
    insertWorksService = module.get<InsertWorksService>(InsertWorksService);
    handleWorkUpdateService = module.get<HandleWorkUpdateService>(
      HandleWorkUpdateService,
    );
  });

  it('Should be defined', () => {
    expect(worksController).toBeDefined();
  });

  describe('getAllWorks', () => {
    it('Should build filters, get works with filters and return the result with correct format', async () => {
      const worksDTO: GetAllWorksDTO = {
        idGrupo: undefined,
        idMunicipio: undefined,
        idParceira: undefined,
        idRegional: [1],
        idStatus: undefined,
        idTipo: undefined,
        page: 0,
        insufficientPermission: true,
      };

      jest
        .spyOn(getAllWorksService, 'getAllWorks')
        .mockResolvedValue(mockAllWorks);

      const result = await worksController.getAllWorks(worksDTO, mockReq);

      const expectedResponse = {
        statusCode: HttpStatus.OK,
        message: 'Todas as obras retornadas com sucesso',
        data: mockAllWorks,
      };

      expect(getAllWorksService.getAllWorks).toHaveBeenCalledWith(worksDTO);
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('getCompletedWorks', () => {
    it('Should build filters, get works with filters and return the result with correct format', async () => {
      const worksDTO: GetWorksDTO = {
        data: '09/04/2024',
        tipoFiltro: 'dia',
        idCircuito: undefined,
        idConjunto: undefined,
        idEmpreendimento: undefined,
        idOvnota: undefined,
        idGrupo: undefined,
        idMunicipio: undefined,
        idParceira: undefined,
        idRegional: [1],
        idStatus: undefined,
        idTipo: undefined,
        page: 1,
        insufficientPermission: true,
      };

      jest
        .spyOn(getCompletedWorksService, 'getCompletedWorks')
        .mockResolvedValue(mockWorksInPortfolio);

      const result = await worksController.GetCompletedWorks(worksDTO, mockReq);

      const expectedResponse = {
        statusCode: HttpStatus.OK,
        message: 'Obras em executadas retornadas com sucesso',
        data: mockWorksInPortfolio,
      };

      expect(getCompletedWorksService.getCompletedWorks).toHaveBeenCalledWith(
        worksDTO,
      );
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('getWorksInPortfolio', () => {
    it('Should build filters, get works with filters and return the result with correct format', async () => {
      const worksDTO: GetWorksDTO = {
        data: '09/04/2024',
        tipoFiltro: 'dia',
        idCircuito: undefined,
        idConjunto: undefined,
        idEmpreendimento: undefined,
        idOvnota: undefined,
        idGrupo: undefined,
        idMunicipio: undefined,
        idParceira: undefined,
        idRegional: [1],
        idStatus: undefined,
        idTipo: undefined,
        page: 1,
        insufficientPermission: true,
      };

      jest
        .spyOn(getWorksInPortfolio, 'getWorksInPortfolio')
        .mockResolvedValue(mockWorksInPortfolio);

      const result = await worksController.getWorksInPortfolio(
        worksDTO,
        mockReq,
      );

      const expectedResponse = {
        statusCode: HttpStatus.OK,
        message: 'Obras em carteira retornadas com sucesso',
        data: mockWorksInPortfolio,
      };

      expect(getWorksInPortfolio.getWorksInPortfolio).toHaveBeenCalledWith(
        worksDTO,
      );
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('getWorkDetails', () => {
    it('Should build filters, get details works with filters and return the result with correct format', async () => {
      const worksDetails = 2;

      jest
        .spyOn(getWorkDetailsService, 'get')
        .mockResolvedValue(mockResponseDetails);

      const result = await worksController.getWorkDetails(worksDetails);

      const expectedResponse = {
        statusCode: HttpStatus.OK,
        message: 'Retornado os detalhes da obra',
        data: mockResponseDetails,
      };

      expect(getWorkDetailsService.get).toHaveBeenCalledWith(worksDetails);
      expect(result).toEqual(expectedResponse);
    });
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

  describe('Update', () => {
    it('Should be call the method Update and return the correctly data', async () => {
      jest.spyOn(handleWorkUpdateService, 'update').mockResolvedValue();

      const result = await worksController.Update(
        1,
        {
          id_turma: 1,
          id_status: 4,
          tipo_ads: 'Convencional',
          data_empreitamento: new Date('05-17-2025'),
        },
        mockReq,
      );

      const expectedResponse = {
        statusCode: HttpStatus.NO_CONTENT,
        message: 'Obras atualizada com sucesso',
      };

      expect(handleWorkUpdateService.update).toHaveBeenCalledWith(
        {
          id_turma: 1,
          id_status: 4,
          tipo_ads: 'Convencional',
          data_empreitamento: new Date('05-17-2025'),
        },
        1,
        true,
      );
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('Convert DTOs', () => {
    it('Should GetAllWorksDTO transform data of dto filters', () => {
      const filters = {
        idGrupo: '1',
        idRegional: '4',
        idMunicipio: '5',
        idTipo: '7',
        idParceira: '2',
        idStatus: '4',
        page: '0',
      };
      const instance = plainToInstance(GetAllWorksDTO, filters);

      expect(instance.idGrupo).toStrictEqual([1]);
      expect(instance.idMunicipio).toStrictEqual([5]);
      expect(instance.idParceira).toStrictEqual([2]);
      expect(instance.idRegional).toStrictEqual([4]);
      expect(instance.idStatus).toStrictEqual([4]);
      expect(instance.idTipo).toStrictEqual([7]);
      expect(instance.page).toStrictEqual(0);
    });

    it('Should GetWorksDTO transform data of dto filters', () => {
      const filters = {
        idGrupo: '1',
        idRegional: '4',
        idMunicipio: '5',
        idTipo: '7',
        idParceira: '2',
        idStatus: '4',
        idConjunto: '4',
        idCircuito: '9',
        idEmpreendimento: '23',
        idOvnota: '3',
        page: '0',
      };
      const instance = plainToInstance(GetWorksDTO, filters);

      expect(instance.idGrupo).toStrictEqual([1]);
      expect(instance.idMunicipio).toStrictEqual([5]);
      expect(instance.idParceira).toStrictEqual([2]);
      expect(instance.idRegional).toStrictEqual([4]);
      expect(instance.idStatus).toStrictEqual([4]);
      expect(instance.idTipo).toStrictEqual([7]);
      expect(instance.idConjunto).toStrictEqual([4]);
      expect(instance.idEmpreendimento).toStrictEqual([23]);
      expect(instance.idCircuito).toStrictEqual([9]);
      expect(instance.page).toStrictEqual(0);
    });
  });
});
