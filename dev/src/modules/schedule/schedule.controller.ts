import { Controller, Get, HttpStatus, Query } from '@nestjs/common';
import {
  GetPendingScheduleValuesDTO,
  GetScheduleValuesDTO,
  GetTotalValuesScheduleDTO,
  GetValueWeeklyScheduleDTO,
} from 'src/config/dto/scheduleDTO';
import { GetTotalValuesScheduleService } from './services/getTotalValuesSchedule.service';
import { GetScheduleValuesService } from './services/getScheduleValues.service';
import { GetValuesWeeklyScheduleService } from './services/getValuesWeeklySchedule.service';
import { GetPendingScheduleValuesService } from './services/getPendingScheduleValues.service';
import { GetScheduleRestrictionsService } from './services/getScheduleRestrictions.service';

@Controller('programacao')
export class ScheduleController {
  constructor(
    private getTotalValuesScheduleService: GetTotalValuesScheduleService,
    private getScheduleValuesService: GetScheduleValuesService,
    private getValuesWeeklyScheduleService: GetValuesWeeklyScheduleService,
    private getPendingScheduleValuesService: GetPendingScheduleValuesService,
    private getScheduleRestrictionsService: GetScheduleRestrictionsService,
  ) {}

  @Get()
  async getTotalValues(@Query() filters: GetTotalValuesScheduleDTO) {
    const response =
      await this.getTotalValuesScheduleService.getTotalValues(filters);

    return {
      statusCode: HttpStatus.OK,
      message: 'Todas as obras retornadas com sucesso',
      data: response,
    };
  }

  @Get('mensal')
  async getScheduleValues(@Query() filters: GetScheduleValuesDTO) {
    const response = await this.getScheduleValuesService.getValues(filters);

    return {
      statusCode: HttpStatus.OK,
      message: 'Valores das programações retornadas com sucesso',
      data: response,
    };
  }

  @Get('semanal')
  async getValuesWeeklySchedule(@Query() filters: GetValueWeeklyScheduleDTO) {
    const response =
      await this.getValuesWeeklyScheduleService.getValues(filters);

    return {
      statusCode: HttpStatus.OK,
      message: 'Valores das programações da semana retornadas com sucesso',
      data: response,
    };
  }

  @Get('pendente')
  async getPendingScheduleValues(
    @Query() filters: GetPendingScheduleValuesDTO,
  ) {
    const response =
      await this.getPendingScheduleValuesService.getValues(filters);

    return {
      statusCode: HttpStatus.OK,
      message: 'Valores das programações da semana retornadas com sucesso',
      data: response,
    };
  }

  @Get('restricoes')
  async getScheduleRestrictions(@Query() filters: GetValueWeeklyScheduleDTO) {
    const response =
      await this.getScheduleRestrictionsService.getRestrictions(filters);

    return {
      statusCode: HttpStatus.OK,
      message: 'Restrições das programações retornadas com sucesso',
      data: response,
    };
  }
}
