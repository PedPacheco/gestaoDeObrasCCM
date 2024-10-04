import { HttpStatus } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { plainToInstance } from 'class-transformer';
import { GetAllWorksDTO, GetWorksDTO } from 'src/config/dto/worksDto';
import { GetAllWorksService } from 'src/modules/works/services/getAllWorks.service';
import { GetCompletedWorksService } from 'src/modules/works/services/getCompletedWorks.service';
import { GetWorksInPortfolioService } from 'src/modules/works/services/getWorksInPortfolio.service';
import { WorksController } from 'src/modules/works/works.controller';

describe('WorksController', () => {
  let worksController: WorksController;
  let getAllWorksService: GetAllWorksService;
  let getCompletedWorksService: GetCompletedWorksService;
  let getWorksInPortfolio: GetWorksInPortfolioService;

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
          provide: GetWorksInPortfolioService,
          useValue: { getWorksInPortfolio: jest.fn() },
        },
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
  });

  it('Should be defined', () => {
    expect(worksController).toBeDefined();
  });

  const dataResponse = [
    {
      id: 17617,
      ovnota: '15373379',
      ordemdiagrama: '170000015211',
      status_ov_sap: 99,
      pep: 'X/005016',
      status_pep: null,
      diagrama: null,
      status_diagrama: null,
      ordem_dci: '170000015211',
      status_170: 'LIB ',
      status_usuario_170: 'INVE',
      ordem_dcd: '190000016813',
      status_190: 'ENTE',
      status_usuario_190: 'ENTE',
      ordem_dca: '150000001995',
      status_150: 'ENTE',
      status_usuario_150: 'ENTE',
      ordem_dcim: null,
      status_180: null,
      status_usuario_180: null,
      mun: 'SAE',
      tipo_obra: 'RISCO A SEGURANÇA',
      entrada: '04/09/2024',
      prazo_fim: null,
      qtde_planejada: 0,
      mo_planejada: 91105.824,
      mo_final: null,
      turma: 'ENGELMIG',
      executado: 100,
      data_conclusao: '2024-06-14T00:00:00.000Z',
      last_data_prog: null,
      status: 'EXECUTADA',
      observ_obra: null,
      referencia: null,
    },
  ];

  describe('getAllWorks', () => {
    it('Should build filters, get works with filters and return the result with correct format', async () => {
      const worksDTO: GetAllWorksDTO = {
        idGrupo: undefined,
        idMunicipio: undefined,
        idParceira: undefined,
        idRegional: 1,
        idStatus: undefined,
        idTipo: undefined,
      };

      jest
        .spyOn(getAllWorksService, 'getAllWorks')
        .mockResolvedValue(dataResponse);

      const result = await worksController.getAllWorks(worksDTO);

      const expectedResponse = {
        statusCode: HttpStatus.OK,
        message: 'Todas as obras retornadas com sucesso',
        data: dataResponse,
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
        idRegional: 1,
        idStatus: undefined,
        idTipo: undefined,
      };

      jest
        .spyOn(getCompletedWorksService, 'getCompletedWorks')
        .mockResolvedValue(dataResponse);

      const result = await worksController.GetCompletedWorks(worksDTO);

      const expectedResponse = {
        statusCode: HttpStatus.OK,
        message: 'Obras em executadas retornadas com sucesso',
        data: dataResponse,
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
        idRegional: 1,
        idStatus: undefined,
        idTipo: undefined,
      };

      jest
        .spyOn(getWorksInPortfolio, 'getWorksInPortfolio')
        .mockResolvedValue(dataResponse);

      const result = await worksController.getWorksInPortfolio(worksDTO);

      const expectedResponse = {
        statusCode: HttpStatus.OK,
        message: 'Obras em carteira retornadas com sucesso',
        data: dataResponse,
      };

      expect(getWorksInPortfolio.getWorksInPortfolio).toHaveBeenCalledWith(
        worksDTO,
      );
      expect(result).toEqual(expectedResponse);
    });

    it('Should GetAllWorksDTO transform data of dto filters', () => {
      const filters = {
        idGrupo: '1',
        idRegional: '4',
        idMunicipio: '5',
        idTipo: '7',
        idParceira: '2',
        idStatus: '4',
      };
      const instance = plainToInstance(GetAllWorksDTO, filters);

      expect(instance.idGrupo).toBe(1);
      expect(instance.idMunicipio).toBe(5);
      expect(instance.idParceira).toBe(2);
      expect(instance.idRegional).toBe(4);
      expect(instance.idStatus).toBe(4);
      expect(instance.idTipo).toBe(7);
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
      };
      const instance = plainToInstance(GetWorksDTO, filters);

      expect(instance.idGrupo).toBe(1);
      expect(instance.idMunicipio).toBe(5);
      expect(instance.idParceira).toBe(2);
      expect(instance.idRegional).toBe(4);
      expect(instance.idStatus).toBe(4);
      expect(instance.idTipo).toBe(7);
      expect(instance.idConjunto).toBe(4);
      expect(instance.idEmpreendimento).toBe(23);
      expect(instance.idCircuito).toBe(9);
      expect(instance.idOvnota).toBe(3);
    });
  });
});
