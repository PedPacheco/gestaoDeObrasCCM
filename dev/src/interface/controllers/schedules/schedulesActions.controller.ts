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
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { HandleAddScheduleService } from 'src/application/orchestrators/handleAddSchedule.service';
import { HandleSchedulesUpdateService } from 'src/application/orchestrators/handleSchedulesUpdate.service';
import { DeleteSchedulesService } from 'src/application/schedule/deleteSchedules.service';
import { ValidateConfirmAndRejectSchedulesService } from 'src/application/schedule/validateAndConfirmSchedules.service';
import { PermissionGuard } from 'src/core/guards/permission.guard';
import { VisualizationGuard } from 'src/core/guards/visualization.guard';
import {
  ConfirmSchedulesDTO,
  RejectScheduleDTO,
  SchedulesDataDTO,
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
  async addSchedules(@Body() schedulesData: SchedulesDataDTO, @Req() req: any) {
    const idUser = req.user.sub;

    const data = { ...schedulesData, idUser };

    const id = await this.handleAddScheduleService.add(data);

    return {
      statusCode: HttpStatus.CREATED,
      message: 'Programação inserida com sucesso',
      data: id,
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
  @UseInterceptors(FilesInterceptor('files'))
  async updateSchedules(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFiles() files: Express.Multer.File[],
    @Body() schedulesData: UpdateSchedulesDataDTO,
    @Req() req: any,
  ) {
    let permission: boolean;

    if (req.insufficientPermission !== undefined) {
      permission = req.insufficientPermission;
    }

    const idUser = req.user.sub;

    const data = {
      updateData: { id, idUser, ...schedulesData.updateData },
      ...(schedulesData.executionReportData && {
        executionReportData: {
          ...schedulesData.executionReportData,
          idUser,
        },
      }),
    };

    await this.handleSchedulesUpdateService.update(data, permission, files);

    return {
      statusCode: HttpStatus.NO_CONTENT,
      message: 'Atualização da programação feita com sucesso',
    };
  }
}
