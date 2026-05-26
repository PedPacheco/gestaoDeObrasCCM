import {
  GetExecMonitoringDTO,
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
import { MonthlySummaryService } from 'src/application/usecases/schedule/getMonthlySummary.service';
import { RejectionsOfSchedulesService } from 'src/application/usecases/schedule/rejectionOfSchedules.service';
import { GetTotalValuesScheduleService } from 'src/application/usecases/schedule/getTotalValuesSchedule.service';
import { GetScheduleValuesService } from 'src/application/usecases/schedule/getScheduleValues.service';
import { GetMonthlySummaryForecastService } from 'src/application/usecases/schedule/getMonthlySummaryForecast.service';
import { ExecMonitoringService } from 'src/application/usecases/schedule/execMonitoring.service';
import { AreaViewGuard } from 'src/core/guards/newPermission.guard';

@Controller('programacao')
export class ScheduleController {
  constructor(
    private getTotalValuesScheduleService: GetTotalValuesScheduleService,
    private getScheduleValuesService: GetScheduleValuesService,
    private getMonthlySummaryService: MonthlySummaryService,
    private rejectionsOfSchedulesService: RejectionsOfSchedulesService,
    private getMonthlySummaryForecastService: GetMonthlySummaryForecastService,
    private execMonitoringService: ExecMonitoringService,
  ) {}

  private applyFilters<
    T extends {
      idParceira?: number | number[];
    },
  >(filters: T, req: { idParceira?: number }): T {
    if (req.idParceira) {
      filters.idParceira = req.idParceira;
    }

    return filters;
  }

  @Get()
  @UseGuards(AreaViewGuard({ allowedAreas: [8, 2], blockPartner: true }))
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
  @UseGuards(AreaViewGuard())
  async getScheduleValues(
    @Query() scheduleFilters: GetScheduleValuesDTO,
    @Req() req: any,
  ) {
    const filters = this.applyFilters(scheduleFilters, req);

    const response = await this.getScheduleValuesService.getValues(filters);

    return {
      statusCode: HttpStatus.OK,
      message: 'Valores das programações retornadas com sucesso',
      data: response,
    };
  }

  @Get('resumo-mensal')
  @UseGuards(AreaViewGuard({ allowedAreas: [8, 2], blockPartner: true }))
  async getMonthlySummary(
    @Query() scheduleFilters: GetMonthlySummaryDTO,
    @Req() req: any,
  ) {
    const filters = this.applyFilters(scheduleFilters, req);

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
  @UseGuards(AreaViewGuard({ allowedAreas: [8, 2], blockPartner: true }))
  async getMonthlySummaryForecast(
    @Query() scheduleFilters: GetMonthlySummaryDTO,
    @Req() req: any,
  ) {
    const filters = this.applyFilters(scheduleFilters, req);

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

  @Get('acompanhamento-mensal')
  @UseGuards(AreaViewGuard({ allowedAreas: [8, 2], blockPartner: true }))
  async getExecMonitoring(
    @Query() scheduleFilters: GetExecMonitoringDTO,
    @Req() req: any,
  ) {
    const filters = this.applyFilters(scheduleFilters, req);

    const data = await this.execMonitoringService.getData(filters);
    return {
      statusCode: HttpStatus.OK,
      message: 'Acompanhamento mensal retornado com sucesso',
      data,
    };
  }

  @Get('reprovacoes/:id')
  @UseGuards(AreaViewGuard())
  async GetRejectionsOfSchedules(@Param('id', ParseIntPipe) idWork: number) {
    const response = await this.rejectionsOfSchedulesService.get(idWork);

    return {
      statusCode: HttpStatus.OK,
      message: 'Retornados as reprovações das programções',
      data: response,
    };
  }
}
