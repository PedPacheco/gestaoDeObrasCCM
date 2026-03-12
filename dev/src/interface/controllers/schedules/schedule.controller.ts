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
import { GetMonthlySummaryService } from 'src/application/usecases/schedule/getMonthlySummary.service';
import { RejectionsOfSchedulesService } from 'src/application/usecases/schedule/rejectionOfSchedules.service';
import { GetTotalValuesScheduleService } from 'src/application/usecases/schedule/getTotalValuesSchedule.service';
import { GetScheduleValuesService } from 'src/application/usecases/schedule/getScheduleValues.service';
import { GetMonthlySummaryForecastService } from 'src/application/usecases/schedule/getMonthlySummaryForecast.service';

@Controller('programacao')
export class ScheduleController {
  constructor(
    private getTotalValuesScheduleService: GetTotalValuesScheduleService,
    private getScheduleValuesService: GetScheduleValuesService,
    private getMonthlySummaryService: GetMonthlySummaryService,
    private rejectionsOfSchedulesService: RejectionsOfSchedulesService,
    private getMonthlySummaryForecastService: GetMonthlySummaryForecastService,
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
    const [firstSummary, secondSummary] = await Promise.all([
      this.getMonthlySummaryService.getSummary(filters),
      this.getMonthlySummaryService.getSecondSummary(filters),
    ]);

    return {
      statusCode: HttpStatus.OK,
      message: 'Resumo mensal retornado com sucesso',
      data: { firstSummary, secondSummary },
    };
  }

  @Get('resumo-mensal-forecast')
  @UseGuards(PermissionGuard)
  async getMonthlySummaryForecast(@Query() filters: GetMonthlySummaryDTO) {
    const [firstSummary, secondSummary] = await Promise.all([
      this.getMonthlySummaryForecastService.getSummary(filters),
      this.getMonthlySummaryForecastService.getSecondSummary(filters),
    ]);

    return {
      statusCode: HttpStatus.OK,
      message: 'Resumo mensal do Forecast retornado com sucesso',
      data: { firstSummary, secondSummary },
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
