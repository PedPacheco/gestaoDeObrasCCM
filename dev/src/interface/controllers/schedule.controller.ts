import { HandleAddScheduleService } from 'src/application/orchestrators/handleAddSchedule.service';
import { HandleSchedulesUpdateService } from 'src/application/orchestrators/handleSchedulesUpdate.service';
import { DeleteSchedulesService } from 'src/application/schedule/deleteSchedules.service';
import { GetMonthlySummaryService } from 'src/application/schedule/getMonthlySummary.service';
import { GetScheduleRestrictionsService } from 'src/application/schedule/getScheduleRestrictions.service';
import { GetScheduleValuesService } from 'src/application/schedule/getScheduleValues.service';
import { GetTotalValuesScheduleService } from 'src/application/schedule/getTotalValuesSchedule.service';
import { GetValuesWeeklyScheduleService } from 'src/application/schedule/getValuesWeeklySchedule.service';
import { ValidateAndConfirmSchedulesService } from 'src/application/schedule/validateAndConfirmSchedules.service';
import { PermissionGuard } from 'src/core/guards/permission.guard';
import { VisualizationGuard } from 'src/core/guards/visualization.guard';
import {
  ConfirmSchedulesDTO,
  GetMonthlySummaryDTO,
  GetScheduleValuesDTO,
  GetTotalValuesScheduleDTO,
  GetValueWeeklyScheduleDTO,
  SchedulesDataDTO,
  UpdateSchedulesDataDTO,
  ValidateSchedulesDTO,
} from 'src/interface/dtos/scheduleDTO';

import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';

@Controller('programacao')
export class ScheduleController {
  constructor(
    private getTotalValuesScheduleService: GetTotalValuesScheduleService,
    private getScheduleValuesService: GetScheduleValuesService,
    private getValuesWeeklyScheduleService: GetValuesWeeklyScheduleService,
    private getScheduleRestrictionsService: GetScheduleRestrictionsService,
    private getMonthlySummaryService: GetMonthlySummaryService,
    private handleAddScheduleService: HandleAddScheduleService,
    private handleSchedulesUpdateService: HandleSchedulesUpdateService,
    private deleteSchedulesService: DeleteSchedulesService,
    private validateAndConfirmSchedulesService: ValidateAndConfirmSchedulesService,
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

  @Post()
  async addSchedules(@Body() schedulesData: SchedulesDataDTO) {
    await this.handleAddScheduleService.add(schedulesData);

    return {
      statusCode: HttpStatus.CREATED,
      message: 'Programação inserida com sucesso',
    };
  }

  @Delete(':id')
  @UseGuards(PermissionGuard)
  async deleteSchedules(@Param('id', ParseIntPipe) id: number) {
    await this.deleteSchedulesService.delete(id);

    return {
      statusCode: HttpStatus.OK,
      message: 'Programação excluída com sucesso',
    };
  }

  @Patch('validar')
  @UseGuards(VisualizationGuard)
  async validateSchedules(@Body() data: ValidateSchedulesDTO[]) {
    await this.validateAndConfirmSchedulesService.validate(data);

    return {
      statusCode: HttpStatus.NO_CONTENT,
      message: 'Programações validadas com sucesso',
    };
  }

  @Patch('confirmar')
  @UseGuards(VisualizationGuard)
  async confirmSchedules(@Body() id: ConfirmSchedulesDTO[]) {
    await this.validateAndConfirmSchedulesService.confirm(id);

    return {
      statusCode: HttpStatus.NO_CONTENT,
      message: 'Programações confirmadas com sucesso',
    };
  }

  @Patch(':id')
  @UseGuards(VisualizationGuard)
  async updateSchedules(
    @Param('id', ParseIntPipe) id: number,
    @Body() schedulesData: UpdateSchedulesDataDTO,
    @Req() req: any,
  ) {
    let permission: boolean;

    if (req.insufficientPermission !== undefined) {
      permission = req.insufficientPermission;
    }

    const data = {
      updateData: { id, ...schedulesData.updateData },
      executionReportData: { ...schedulesData.executionReportData },
    };

    await this.handleSchedulesUpdateService.update(data, permission);

    return {
      statusCode: HttpStatus.NO_CONTENT,
      message: 'Atualização da programação feita com sucesso',
    };
  }
}
