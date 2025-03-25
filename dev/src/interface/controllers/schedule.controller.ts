import { PermissionGuard } from 'src/core/guards/permission.guard';
import { VisualizationGuard } from 'src/core/guards/visualization.guard';
import { GetMonthlySummaryService } from 'src/domain/services/schedule/getMonthlySummary.service';
import { GetPendingScheduleValuesService } from 'src/domain/services/schedule/getPendingScheduleValues.service';
import { GetScheduleRestrictionsService } from 'src/domain/services/schedule/getScheduleRestrictions.service';
import { GetScheduleValuesService } from 'src/domain/services/schedule/getScheduleValues.service';
import { GetTotalValuesScheduleService } from 'src/domain/services/schedule/getTotalValuesSchedule.service';
import { GetValuesWeeklyScheduleService } from 'src/domain/services/schedule/getValuesWeeklySchedule.service';
import {
  GetMonthlySummaryDTO,
  GetPendingScheduleValuesDTO,
  GetScheduleValuesDTO,
  GetTotalValuesScheduleDTO,
  GetValueWeeklyScheduleDTO,
} from 'src/interface/dtos/scheduleDTO';

import { Controller, Get, HttpStatus, Query, UseGuards } from '@nestjs/common';

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
  @UseGuards(VisualizationGuard)
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
  @UseGuards(VisualizationGuard)
  async getScheduleValues(@Query() filters: GetScheduleValuesDTO) {
    const response = await this.getScheduleValuesService.getValues(filters);

    return {
      statusCode: HttpStatus.OK,
      message: 'Valores das programações retornadas com sucesso',
      data: response,
    };
  }

  @Get('semanal')
  @UseGuards(VisualizationGuard)
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
