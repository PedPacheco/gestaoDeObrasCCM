import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ExecutionReportService } from 'src/application/executionReport.service';
import { HandleAddScheduleService } from 'src/application/orchestrators/handleAddSchedule.service';
import { HandleSchedulesUpdateService } from 'src/application/orchestrators/handleSchedulesUpdate.service';
import { DeleteSchedulesService } from 'src/application/schedule/deleteSchedules.service';
import { UpdateSchedulesService } from 'src/application/schedule/updateSchedules.service';
import { ValidateConfirmAndRejectSchedulesService } from 'src/application/schedule/validateAndConfirmSchedules.service';
import { UsersService } from 'src/application/users.service';
import { SchedulesActionsController } from 'src/interface/controllers/schedules/schedulesActions.controller';
import {
  SchedulesDataDTO,
  UpdateSchedulesDataDTO,
} from 'src/interface/dtos/scheduleDTO';
import { mockUpdateSchedulesController } from '../../../mocks/mockAddScheduleService';

import { HttpStatus } from '@nestjs/common';
import { Test } from '@nestjs/testing';

describe('ScheduleActionsController', () => {
  let scheduleActionsController: SchedulesActionsController;
  let handleSchedulesUpdateService: HandleSchedulesUpdateService;
  let deleteSchedulesService: DeleteSchedulesService;
  let handleAddScheduleService: HandleAddScheduleService;
  let validateConfirmAndRejectSchedulesService: ValidateConfirmAndRejectSchedulesService;

  const mockReq = {
    insufficientPermission: true,
    idParceira: 1,
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [SchedulesActionsController],
      providers: [
        { provide: HandleAddScheduleService, useValue: { add: jest.fn() } },
        { provide: UpdateSchedulesService, useValue: { update: jest.fn() } },
        { provide: DeleteSchedulesService, useValue: { delete: jest.fn() } },
        { provide: UsersService, useValue: { findUser: jest.fn() } },
        { provide: ExecutionReportService, useValue: { create: jest.fn() } },
        { provide: HandleAddScheduleService, useValue: { add: jest.fn() } },
        {
          provide: ValidateConfirmAndRejectSchedulesService,
          useValue: {
            validate: jest.fn(),
            confirm: jest.fn(),
            reject: jest.fn(),
          },
        },
        {
          provide: HandleSchedulesUpdateService,
          useValue: { update: jest.fn() },
        },
      ],
    }).compile();

    scheduleActionsController = module.get<SchedulesActionsController>(
      SchedulesActionsController,
    );
    handleAddScheduleService = module.get<HandleAddScheduleService>(
      HandleAddScheduleService,
    );
    handleSchedulesUpdateService = module.get<HandleSchedulesUpdateService>(
      HandleSchedulesUpdateService,
    );
    deleteSchedulesService = module.get<DeleteSchedulesService>(
      DeleteSchedulesService,
    );
    validateConfirmAndRejectSchedulesService =
      module.get<ValidateConfirmAndRejectSchedulesService>(
        ValidateConfirmAndRejectSchedulesService,
      );
  });

  it('Should be defined', () => {
    expect(SchedulesActionsController).toBeDefined();
  });

  it('Should call addSchedules and return message', async () => {
    jest.spyOn(handleAddScheduleService, 'add').mockResolvedValue();

    const date = new Date('2025-06-10T00:00:00.000Z');

    const result = await scheduleActionsController.addSchedules({
      idWork: 3146044,
      dataProg: date,
      startTime: '08:00',
      finishTime: '07:00',
      serviceType: 'Inspeção Elétrica',
      prog: 100,
      idProgRestriction1: 1,
      idProgRestriction2: 1,
    });

    expect(result).toEqual({
      statusCode: HttpStatus.CREATED,
      message: 'Programação inserida com sucesso',
    });
    expect(handleAddScheduleService.add).toHaveBeenCalledWith({
      idWork: 3146044,
      dataProg: date,
      startTime: '08:00',
      finishTime: '07:00',
      serviceType: 'Inspeção Elétrica',
      prog: 100,
      idProgRestriction1: 1,
      idProgRestriction2: 1,
    });
  });

  describe('UpdateSchedules', () => {
    it('Should call updateSchedules and return message', async () => {
      jest.spyOn(handleSchedulesUpdateService, 'update').mockResolvedValue();

      const result = await scheduleActionsController.updateSchedules(
        1,
        mockUpdateSchedulesController,
        mockReq,
      );

      expect(result).toEqual({
        statusCode: HttpStatus.NO_CONTENT,
        message: 'Atualização da programação feita com sucesso',
      });
      expect(handleSchedulesUpdateService.update).toHaveBeenCalledWith(
        {
          updateData: { id: 1, ...mockUpdateSchedulesController.updateData },
          executionReportData: {
            ...mockUpdateSchedulesController.executionReportData,
          },
        },
        true,
      );
    });

    it('Should call update method and return correct data', async () => {
      jest.spyOn(handleSchedulesUpdateService, 'update').mockResolvedValue();

      const result = await scheduleActionsController.updateSchedules(
        1,
        mockUpdateSchedulesController,
        { ...mockReq, insufficientPermission: undefined },
      );

      expect(result).toEqual({
        statusCode: HttpStatus.NO_CONTENT,
        message: 'Atualização da programação feita com sucesso',
      });
      expect(handleSchedulesUpdateService.update).toHaveBeenCalledWith(
        {
          updateData: { id: 1, ...mockUpdateSchedulesController.updateData },
          executionReportData: {
            ...mockUpdateSchedulesController.executionReportData,
          },
        },
        undefined,
      );
    });
  });

  it('Should call deleteSchedules and return message', async () => {
    jest.spyOn(deleteSchedulesService, 'delete').mockResolvedValue();

    const result = await scheduleActionsController.deleteSchedules(1);

    expect(result).toEqual({
      statusCode: HttpStatus.OK,
      message: 'Programação excluída com sucesso',
    });
    expect(deleteSchedulesService.delete).toHaveBeenCalledWith(1);
  });

  it('should call validate and return message', async () => {
    jest
      .spyOn(validateConfirmAndRejectSchedulesService, 'validate')
      .mockResolvedValue();

    const result = await scheduleActionsController.validateSchedules([
      { id: 2, validate: true },
    ]);

    expect(result).toEqual({
      statusCode: HttpStatus.NO_CONTENT,
      message: 'Programações validadas com sucesso',
    });
    expect(
      validateConfirmAndRejectSchedulesService.validate,
    ).toHaveBeenCalledTimes(1);
  });

  it('should call confirm and return message', async () => {
    jest
      .spyOn(validateConfirmAndRejectSchedulesService, 'confirm')
      .mockResolvedValue();

    const result = await scheduleActionsController.confirmSchedules([
      { id: 2, confirm: true },
    ]);

    expect(result).toEqual({
      statusCode: HttpStatus.NO_CONTENT,
      message: 'Programações confirmadas com sucesso',
    });
    expect(
      validateConfirmAndRejectSchedulesService.confirm,
    ).toHaveBeenCalledTimes(1);
  });

  it('should call reject and return message', async () => {
    jest
      .spyOn(validateConfirmAndRejectSchedulesService, 'reject')
      .mockResolvedValue();

    const result = await scheduleActionsController.rejectSchedules({
      id: 2,
      reject: true,
      reason: '',
      description: '',
    });

    expect(result).toEqual({
      statusCode: HttpStatus.NO_CONTENT,
      message: 'Programação reprovada com sucesso',
    });
    expect(
      validateConfirmAndRejectSchedulesService.reject,
    ).toHaveBeenCalledTimes(1);
  });

  describe('DTO Validation', () => {
    it('should fail validation if exec is not a number', async () => {
      const payload = {
        idWork: 1,
        dataProg: new Date(),
        startTime: '08:00',
        finishTime: '10:00',
        prog: 50,
        exec: null,
      };

      const dto = plainToInstance(SchedulesDataDTO, payload);
      await validate(dto);

      expect(dto.exec).toBeNull();
    });

    it('should pass validation with correct values', async () => {
      const payload = {
        idWork: 1,
        dataProg: new Date(),
        startTime: '08:00',
        finishTime: '10:00',
        prog: 50,
        exec: 20,
        idProgRestriction1: 1,
        idProgRestriction2: 1,
      };

      const dto = plainToInstance(SchedulesDataDTO, payload);
      const errors = await validate(dto);

      expect(errors.length).toBe(0);
    });

    it('should validate UpdateSchedulesDataDTO with nested SchedulesDataDTO', async () => {
      const payload = {
        updateData: {
          idWork: 1,
          dataProg: new Date(),
          startTime: '08:00',
          finishTime: '10:00',
          prog: 50,
          idProgRestriction1: 1,
          idProgRestriction2: 1,
        },
      };

      const dto = plainToInstance(UpdateSchedulesDataDTO, payload);
      const errors = await validate(dto);

      expect(errors.length).toBe(0);
    });

    it('Should convert string to Date using class-transformer in SchedulesDataDTO', () => {
      const input = {
        idWork: 1,
        dataProg: '2025-06-10',
        startTime: '08:00',
        finishTime: '09:00',
        serviceType: 'Inspeção',
        prog: 1,
        idProgRestriction1: 1,
        idProgRestriction2: 1,
      };

      const dtoAdd = plainToInstance(SchedulesDataDTO, input);

      expect(dtoAdd.dataProg).toBeInstanceOf(Date);
      expect(dtoAdd.dataProg.toISOString().startsWith('2025-06-10')).toBe(true);
    });
  });
});
