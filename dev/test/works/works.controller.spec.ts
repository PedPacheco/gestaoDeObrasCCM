import { HttpStatus } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { plainToInstance } from 'class-transformer';
import { GetAllWorksDTO, GetWorksDTO } from 'src/config/dto/worksDto';
import { UsersService } from 'src/modules/users/users.service';
import { GetAllWorksService } from 'src/modules/works/services/getAllWorks.service';
import { GetCompletedWorksService } from 'src/modules/works/services/getCompletedWorks.service';
import { GetWorkDetailsService } from 'src/modules/works/services/getWorkDetails.service';
import { GetWorksInPortfolioService } from 'src/modules/works/services/getWorksInPortfolio.service';
import { WorksController } from 'src/modules/works/works.controller';

describe('WorksController', () => {
  let worksController: WorksController;
  let getAllWorksService: GetAllWorksService;
  let getCompletedWorksService: GetCompletedWorksService;
  let getWorksInPortfolio: GetWorksInPortfolioService;
  let getWorkDetailsService: GetWorkDetailsService;

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
  });

  describe('getWorkDetails', () => {
    it('Should build filters, get details works with filters and return the result with correct format', async () => {
      const worksDetails = 2;

      const mockResponseDetails = {
        ovnota: '12791122',
        pep: 'X/004604',
        status_pep: null,
        diagrama: null,
        diagrama_antigo: null,
        ordem_dci: '170000004647',
        ordem_dci_antigo: '162000082852',
        ordem_dcd: '190000006101',
        ordem_dcd_antigo: '163000076717',
        ordem_dca: null,
        ordem_dca_antigo: null,
        ordem_dcim: null,
        ordem_dcim_antigo: null,
        status_ov_sap: 20,
        status_diagrama: null,
        status_usuario_diagrama: null,
        status_150: null,
        status_usuario_150: null,
        status_170: 'LIB ',
        status_usuario_170: 'PLAR',
        status_180: null,
        status_usuario_180: null,
        status_190: 'LIB ',
        status_usuario_190: 'EXEC',
        entrada: new Date('2023-04-18T00:00:00.000Z'),
        prazo: 90,
        data_conclusao: null,
        executado: 45,
        qtde_planejada: 0.772,
        qtde_pend: 0.77165,
        mo_planejada: 89223.8157,
        mo_final: null,
        referencia: '190BF006190439',
        capex_mat_pend: 186326.1654099993,
        capex_mat_plan: 186326.1654099993,
        capex_mo_pend: 64982.8126,
        capex_mo_plan: 74310.44331999999,
        tipo_ads: 'CONVENCIONAL',
        data_empreitamento: new Date('2024-08-06T00:00:00.000Z'),
        circuitos: 'CAC-1302',
        empreendimento: null,
        municipios: 'MONTEIRO LOBATO',
        tipos: 'SPACER CABLE',
        turmas: 'ENGELMIG',
        status: 'PROGRAMADO',
        programacoes: [
          {
            data_prog: new Date('2024-09-19T00:00:00.000Z'),
            hora_ini: new Date('1970-01-01T08:00:00.000Z'),
            hora_ter: new Date('1970-01-01T17:00:00.000Z'),
            tipo_servico: 'OBRA LIVRE',
            prog: 45,
            exec: null,
            observ_programacao: 'TRECHO LIVRE',
            chi: 0,
            num_dp: null,
            chave_provisoria: false,
            equipe_linha_morta: 12,
            equipe_linha_viva: 3,
            equipe_regularizacao: 0,
            tecnico: 'NÃO DEFINIDO',
            restricao: null,
            nome_responsavel_execucao: null,
          },
        ],
      };

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
