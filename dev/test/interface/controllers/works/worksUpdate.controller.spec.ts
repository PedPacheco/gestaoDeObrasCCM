import { HandleWorkUpdateService } from 'src/application/usecases/orchestrators/handleWorkUpdate.service';
import { UsersService } from 'src/application/usecases/users.service';
import { ContractUpdateService } from 'src/application/usecases/works/management/contractUpdate.service';
import { SuspensionWorkService } from 'src/application/usecases/works/management/suspensionWork.service';
import { UpdateNoteService } from 'src/application/usecases/works/management/updateNote.service';
import { UpdateOvService } from 'src/application/usecases/works/management/updateOv.service';
import { WorksUpdateController } from 'src/interface/controllers/works/worksUpdate.controller';

import { HttpStatus } from '@nestjs/common';
import { Test } from '@nestjs/testing';

import {
  mockMarketWorks,
  mockUpdateNotes,
} from '../../../mocks/mockWorksController';

interface CustomRequest extends Request {
  idParceira?: number;
  insufficientPermission?: boolean;
}

describe('WorksUpdateController', () => {
  let worksController: WorksUpdateController;
  let handleWorkUpdateService: HandleWorkUpdateService;
  let contractUpdateService: ContractUpdateService;
  let updateOvService: UpdateOvService;
  let updateNoteService: UpdateNoteService;
  let suspensionWorksService: SuspensionWorkService;

  const mockReq: CustomRequest = {
    idParceira: 1,
    insufficientPermission: true,
  } as unknown as CustomRequest;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [WorksUpdateController],
      providers: [
        { provide: UsersService, useValue: { findUser: jest.fn() } },
        { provide: HandleWorkUpdateService, useValue: { update: jest.fn() } },
        { provide: ContractUpdateService, useValue: { update: jest.fn() } },
        { provide: UpdateOvService, useValue: { update: jest.fn() } },
        { provide: UpdateNoteService, useValue: { update: jest.fn() } },
        {
          provide: SuspensionWorkService,
          useValue: {
            createMultipleSuspensions: jest.fn(),
          },
        },
      ],
    }).compile();

    worksController = module.get<WorksUpdateController>(WorksUpdateController);
    handleWorkUpdateService = module.get<HandleWorkUpdateService>(
      HandleWorkUpdateService,
    );
    contractUpdateService = module.get<ContractUpdateService>(
      ContractUpdateService,
    );
    updateOvService = module.get<UpdateOvService>(UpdateOvService);
    updateNoteService = module.get<UpdateNoteService>(UpdateNoteService);
    suspensionWorksService = module.get<SuspensionWorkService>(
      SuspensionWorkService,
    );
  });

  it('Should be defined', () => {
    expect(worksController).toBeDefined();
  });

  describe('Update', () => {
    it('Should be call the method Update and return the correctly data', async () => {
      jest.spyOn(handleWorkUpdateService, 'update').mockResolvedValue();

      const result = await worksController.Update(
        1,
        {
          id_turma: 1,
          id_status: 4,
          data_empreitamento: new Date('05-17-2025'),
        },
        mockReq as CustomRequest,
      );

      const expectedResponse = {
        statusCode: HttpStatus.OK,
        message: 'Obra atualizada com sucesso',
      };

      expect(handleWorkUpdateService.update).toHaveBeenCalledWith(
        {
          id_turma: 1,
          id_status: 4,
          data_empreitamento: new Date('05-17-2025'),
        },
        1,
        true,
      );
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('ContractUpdate', () => {
    it('Should be call the method ContractUpdate and return the correctly data', async () => {
      jest.spyOn(contractUpdateService, 'update').mockResolvedValue();

      const result = await worksController.ContractUpdate([
        {
          ovnota: '3435',
          ordemDiagrama: '43435',
          dataEmpreitamento: new Date('05-17-2025'),
        },
      ]);

      const expectedResponse = {
        statusCode: HttpStatus.OK,
        message: 'Empreitamento das obras atualizado com sucesso',
      };

      expect(contractUpdateService.update).toHaveBeenCalledWith([
        {
          ovnota: '3435',
          ordemDiagrama: '43435',
          dataEmpreitamento: new Date('05-17-2025'),
        },
      ]);
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('UpdateOV', () => {
    it('Should call the update method of the UpdateOv service correctly', async () => {
      jest.spyOn(updateOvService, 'update').mockResolvedValue();

      const result = await worksController.updateOv(mockMarketWorks);

      const expectedResponse = {
        statusCode: HttpStatus.OK,
        message: 'Obras atualizadas com sucesso',
      };

      expect(updateOvService.update).toHaveBeenCalledWith(mockMarketWorks);
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('UpdateNote', () => {
    it('Should call the update method of the UpdateNote service correctly', async () => {
      jest.spyOn(updateNoteService, 'update').mockResolvedValue();

      const result = await worksController.updateNote(mockUpdateNotes);

      const expectedResponse = {
        statusCode: HttpStatus.OK,
        message: 'Obras atualizadas com sucesso',
      };

      expect(updateNoteService.update).toHaveBeenCalledWith(mockUpdateNotes);
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('SuspensionWorks', () => {
    it('Should call the update method of the SuspensionWork service correctly', async () => {
      jest
        .spyOn(suspensionWorksService, 'createMultipleSuspensions')
        .mockResolvedValue();

      const result = await worksController.SuspensionWorks([
        { ovnota: '234', ordemDiagrama: '190000', motivo: 'obra suspensa' },
      ]);

      const expectedResponse = {
        statusCode: HttpStatus.OK,
        message: 'Obras suspensas com sucesso',
      };

      expect(
        suspensionWorksService.createMultipleSuspensions,
      ).toHaveBeenCalledWith([
        { ovnota: '234', ordemDiagrama: '190000', motivo: 'obra suspensa' },
      ]);
      expect(result).toEqual(expectedResponse);
    });
  });
});
