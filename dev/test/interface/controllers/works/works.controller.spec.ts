import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { UsersService } from 'src/application/usecases/users.service';
import { GetAllWorksService } from 'src/application/usecases/works/getAllWorks.service';
import { GetCompletedWorksService } from 'src/application/usecases/works/getCompletedWorks.service';
import { GetWorkDetailsService } from 'src/application/usecases/works/getWorkDetails.service';
import { GetWorksInPortfolioService } from 'src/application/usecases/works/getWorksInPortfolio.service';
import { WorksController } from 'src/interface/controllers/works/works.controller';
import {
  GetAllWorksDTO,
  GetWorksDTO,
  UpdateWorkDTO,
} from 'src/interface/dtos/worksDto';

import { HttpStatus } from '@nestjs/common';
import { Test } from '@nestjs/testing';

import {
  mockAllWorks,
  mockResponseDetails,
  mockWorksInPortfolio,
} from '../../../mocks/mockWorksController';

interface CustomRequest extends Request {
  idParceira?: number;
  insufficientPermission?: boolean;
  user: any;
}

describe('WorksController', () => {
  let worksController: WorksController;
  let getAllWorksService: GetAllWorksService;
  let getCompletedWorksService: GetCompletedWorksService;
  let getWorksInPortfolio: GetWorksInPortfolioService;
  let getWorkDetailsService: GetWorkDetailsService;

  const mockReq: CustomRequest = {
    idParceira: 1,
    insufficientPermission: true,
    user: { tipo_usuario: 'PARCEIRA' },
  } as unknown as CustomRequest;

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

    it('Should not overwrite filters when req does not have idRegional or insufficientPermission', async () => {
      const worksDTO: GetWorksDTO = {
        idCircuito: undefined,
        idConjunto: undefined,
        idEmpreendimento: undefined,
        ovnota: undefined,
        idGrupo: undefined,
        idMunicipio: undefined,
        idParceira: undefined,
        idRegional: undefined,
        idStatus: undefined,
        idTipo: undefined,
        page: 1,

        dataInicial: '01/10/2024',
        dataFinal: '02/10/2024',
      };

      jest
        .spyOn(getAllWorksService, 'getAllWorks')
        .mockResolvedValue(mockAllWorks);

      const result = await worksController.getAllWorks(worksDTO, {
        user: { tipo_usuario: 'INTERNO' },
      } as CustomRequest);

      expect(getAllWorksService.getAllWorks).toHaveBeenCalledWith(worksDTO);
      expect(result).toEqual({
        statusCode: HttpStatus.OK,
        message: 'Todas as obras retornadas com sucesso',
        data: mockAllWorks,
      });
    });
  });

  describe('getCompletedWorks', () => {
    it('Should build filters, get works with filters and return the result with correct format', async () => {
      const worksDTO: GetWorksDTO = {
        idCircuito: undefined,
        idConjunto: undefined,
        idEmpreendimento: undefined,
        ovnota: undefined,
        idGrupo: undefined,
        idMunicipio: undefined,
        idParceira: undefined,
        idRegional: [1],
        idStatus: undefined,
        idTipo: undefined,
        page: 1,
        dataInicial: '01/10/2024',
        dataFinal: '02/10/2024',
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

    it('Should not overwrite filters when req does not have idRegional or insufficientPermission', async () => {
      const worksDTO: GetWorksDTO = {
        idCircuito: undefined,
        idConjunto: undefined,
        idEmpreendimento: undefined,
        ovnota: undefined,
        idGrupo: undefined,
        idMunicipio: undefined,
        idParceira: undefined,
        idRegional: undefined,
        idStatus: undefined,
        idTipo: undefined,
        page: 1,

        dataInicial: '01/10/2024',
        dataFinal: '02/10/2024',
      };

      jest
        .spyOn(getCompletedWorksService, 'getCompletedWorks')
        .mockResolvedValue(mockWorksInPortfolio);

      const result = await worksController.GetCompletedWorks(worksDTO, {
        user: { tipo_usuario: 'INTERNO' },
      } as CustomRequest);

      expect(getCompletedWorksService.getCompletedWorks).toHaveBeenCalledWith(
        worksDTO,
      );
      expect(result).toEqual({
        statusCode: HttpStatus.OK,
        message: 'Obras em executadas retornadas com sucesso',
        data: mockWorksInPortfolio,
      });
    });
  });

  describe('getWorksInPortfolio', () => {
    it('Should build filters, get works with filters and return the result with correct format', async () => {
      const worksDTO: GetWorksDTO = {
        idCircuito: undefined,
        idConjunto: undefined,
        idEmpreendimento: undefined,
        ovnota: undefined,
        idGrupo: undefined,
        idMunicipio: undefined,
        idParceira: undefined,
        idRegional: [1],
        idStatus: undefined,
        idTipo: undefined,
        page: 1,
        dataInicial: undefined,
        dataFinal: undefined,
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

    it('Should not overwrite filters when req does not have idRegional or insufficientPermission', async () => {
      const worksDTO: GetWorksDTO = {
        idCircuito: undefined,
        idConjunto: undefined,
        idEmpreendimento: undefined,
        ovnota: undefined,
        idGrupo: undefined,
        idMunicipio: undefined,
        idParceira: undefined,
        idRegional: undefined,
        idStatus: undefined,
        idTipo: undefined,
        page: 1,

        dataInicial: '01/10/2024',
        dataFinal: '02/10/2024',
      };

      jest
        .spyOn(getWorksInPortfolio, 'getWorksInPortfolio')
        .mockResolvedValue(mockWorksInPortfolio);

      const result = await worksController.getWorksInPortfolio(worksDTO, {
        user: { tipo_usuario: 'INTERNO' },
      } as CustomRequest);

      expect(getWorksInPortfolio.getWorksInPortfolio).toHaveBeenCalledWith(
        worksDTO,
      );
      expect(result).toEqual({
        statusCode: HttpStatus.OK,
        message: 'Obras em carteira retornadas com sucesso',
        data: mockWorksInPortfolio,
      });
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

    it('should convert field data_empreitamento of UpdateWorkDTO to the correct date format', async () => {
      const dto = plainToInstance(UpdateWorkDTO, {
        id_turma: 1,
        id_status: 2,
        data_empreitamento: new Date('2024-01-01'),
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });
  });
});
