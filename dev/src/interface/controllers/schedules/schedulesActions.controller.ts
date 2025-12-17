import {
  Body,
  Controller,
  Delete,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { HandleAddScheduleService } from 'src/application/orchestrators/handleAddSchedule.service';
import { HandleSchedulesUpdateService } from 'src/application/orchestrators/handleSchedulesUpdate.service';
import { DeleteSchedulesService } from 'src/application/schedule/deleteSchedules.service';
//import { UpdateRestrictionsService } from 'src/application/schedule/updateRestrictions.service';
import { ValidateConfirmAndRejectSchedulesService } from 'src/application/schedule/validateAndConfirmSchedules.service';
import { PermissionGuard } from 'src/core/guards/permission.guard';
import { VisualizationGuard } from 'src/core/guards/visualization.guard';
import {
  ConfirmSchedulesDTO,
  RejectScheduleDTO,
  SchedulesDataDTO,
  // UpdateRestrictionsDTO,
  UpdateSchedulesDataDTO,
  ValidateSchedulesDTO,
} from 'src/interface/dtos/scheduleDTO';

@Controller('programacao')
export class SchedulesActionsController {
  constructor(
    private handleAddScheduleService: HandleAddScheduleService,
    private handleSchedulesUpdateService: HandleSchedulesUpdateService,
    private deleteSchedulesService: DeleteSchedulesService,
    private validateConfirmAndRejectSchedulesService: ValidateConfirmAndRejectSchedulesService,
  ) {}

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
    await this.validateConfirmAndRejectSchedulesService.validate(data);

    return {
      statusCode: HttpStatus.NO_CONTENT,
      message: 'Programações validadas com sucesso',
    };
  }

  @Patch('confirmar')
  @UseGuards(VisualizationGuard)
  async confirmSchedules(@Body() id: ConfirmSchedulesDTO[]) {
    await this.validateConfirmAndRejectSchedulesService.confirm(id);

    return {
      statusCode: HttpStatus.NO_CONTENT,
      message: 'Programações confirmadas com sucesso',
    };
  }

  @Patch('reprovar')
  @UseGuards(VisualizationGuard)
  async rejectSchedules(@Body() data: RejectScheduleDTO) {
    await this.validateConfirmAndRejectSchedulesService.reject(data);

    return {
      statusCode: HttpStatus.NO_CONTENT,
      message: 'Programação reprovada com sucesso',
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
