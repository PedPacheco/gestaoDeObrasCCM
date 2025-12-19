import { GetMonthlySummaryService } from 'src/application/schedule/getMonthlySummary.service';
import { GetScheduleValuesService } from 'src/application/schedule/getScheduleValues.service';
import { GetTotalValuesScheduleService } from 'src/application/schedule/getTotalValuesSchedule.service';
import { RejectionsOfSchedulesService } from 'src/application/schedule/rejectionOfSchedules.service';
import { PermissionGuard } from 'src/core/guards/permission.guard';
import { VisualizationGuard } from 'src/core/guards/visualization.guard';
import {
  GetMonthlySummaryDTO,
  GetScheduleValuesDTO,
  GetTotalValuesScheduleDTO,
} from 'src/interface/dtos/scheduleDTO';

import {
  Controller,
  Get,
  HttpStatus,
  Param,
  ParseIntPipe,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';

@Controller('programacao')
export class ScheduleController {
  constructor(
    private getTotalValuesScheduleService: GetTotalValuesScheduleService,
    private getScheduleValuesService: GetScheduleValuesService,

    private getMonthlySummaryService: GetMonthlySummaryService,
    private rejectionsOfSchedulesService: RejectionsOfSchedulesService,
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
  @UseGuards(VisualizationGuard)
  async getScheduleValues(
    @Query() filters: GetScheduleValuesDTO,
    @Req() req: any,
  ) {
    if (req.idParceira) {
      filters.idParceira = req.idParceira;
    }

    const response = await this.getScheduleValuesService.getValues(filters);

    return {
      statusCode: HttpStatus.OK,
      message: 'Valores das programações retornadas com sucesso',
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

  @Get('reprovacoes/:id')
  async GetRejectionsOfSchedules(@Param('id', ParseIntPipe) idWork: number) {
    const response = await this.rejectionsOfSchedulesService.get(idWork);

    return {
      statusCode: HttpStatus.OK,
      message: 'Retornados as reprovações das programções',
      data: response,
    };
  }
}
