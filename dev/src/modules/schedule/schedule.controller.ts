import { Controller, Get, HttpStatus, Query, UseGuards } from '@nestjs/common';
import {
  GetMonthlySummaryDTO,
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
import { GetMonthlySummaryService } from './services/getMonthlySummary.service';
import { PermissionGuard } from 'src/common/guards/permission.guard';

@Controller('programacao')
export class ScheduleController {
  constructor(
    private getTotalValuesScheduleService: GetTotalValuesScheduleService,
    private getScheduleValuesService: GetScheduleValuesService,
    private getValuesWeeklyScheduleService: GetValuesWeeklyScheduleService,
    private getPendingScheduleValuesService: GetPendingScheduleValuesService,
    private getScheduleRestrictionsService: GetScheduleRestrictionsService,
    private getMonthlySummaryService: GetMonthlySummaryService,
  ) {}

  @Get()
  @UseGuards(PermissionGuard)
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
  @UseGuards(PermissionGuard)
  async getScheduleValues(@Query() filters: GetScheduleValuesDTO) {
    const response = await this.getScheduleValuesService.getValues(filters);

    return {
      statusCode: HttpStatus.OK,
      message: 'Valores das programações retornadas com sucesso',
      data: response,
    };
  }

  @Get('semanal')
  @UseGuards(PermissionGuard)
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
  @UseGuards(PermissionGuard)
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
  @UseGuards(PermissionGuard)
  async getScheduleRestrictions(@Query() filters: GetValueWeeklyScheduleDTO) {
    const response =
      await this.getScheduleRestrictionsService.getRestrictions(filters);

    return {
      statusCode: HttpStatus.OK,
      message: 'Restrições das programações retornadas com sucesso',
      data: response,
    };
  }

  @Get('resumo-mensal')
  @UseGuards(PermissionGuard)
  async getMonthlySummary(@Query() filters: GetMonthlySummaryDTO) {
    const response = await this.getMonthlySummaryService.getSummary(filters);

    return {
      statusCode: HttpStatus.OK,
      message: 'Resumo mensal retornado com sucesso',
      data: response,
    };
  }

  @Get('resumo-mensal-2')
  @UseGuards(PermissionGuard)
  async getSecondMonthlySummary(@Query() filters: GetMonthlySummaryDTO) {
    const response =
      await this.getMonthlySummaryService.getSecondSummary(filters);

    return {
      statusCode: HttpStatus.OK,
      message: 'Resumo mensal retornado com sucesso',
      data: response,
    };
  }
}
