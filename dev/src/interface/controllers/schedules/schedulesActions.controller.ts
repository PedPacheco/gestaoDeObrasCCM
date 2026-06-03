import { HandleAddScheduleService } from 'src/application/usecases/orchestrators/handleAddSchedule.service';
import { HandleSchedulesUpdateService } from 'src/application/usecases/orchestrators/handleSchedulesUpdate.service';
import { DeleteSchedulesService } from 'src/application/usecases/schedule/deleteSchedules.service';
import { ValidateConfirmAndRejectSchedulesService } from 'src/application/usecases/schedule/validateAndConfirmSchedules.service';
import { AreaEditGuard } from 'src/core/guards/newPermission.guard';
import {
  ConfirmSchedulesDTO,
  CreateScheduleWithServicesDTO,
  RejectScheduleDTO,
  SchedulesDataDTO,
  ValidateSchedulesDTO,
} from 'src/interface/dtos/scheduleDTO';

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

@Controller('programacao')
export class SchedulesActionsController {
  constructor(
    private handleAddScheduleService: HandleAddScheduleService,
    private handleSchedulesUpdateService: HandleSchedulesUpdateService,
    private deleteSchedulesService: DeleteSchedulesService,
    private validateConfirmAndRejectSchedulesService: ValidateConfirmAndRejectSchedulesService,
  ) {}

  @Post()
  @UseGuards(AreaEditGuard({ allowedAreas: [8] }))
  async addSchedules(
    @Body() schedulesData: CreateScheduleWithServicesDTO,
    @Req() req: any,
  ) {
    const idUser = req.user.sub;

    const data = {
      ...schedulesData,
      schedule: {
        ...schedulesData.schedule,
        idUser,
      },
    };

    const id = await this.handleAddScheduleService.add(data);

    return {
      statusCode: HttpStatus.CREATED,
      message: 'Programação inserida com sucesso',
      data: id,
    };
  }

  @Delete(':id')
  @UseGuards(AreaEditGuard({ allowedAreas: [8], blockPartner: true }))
  async deleteSchedules(@Param('id', ParseIntPipe) id: number) {
    await this.deleteSchedulesService.delete(id);

    return {
      statusCode: HttpStatus.OK,
      message: 'Programação excluída com sucesso',
    };
  }

  @Patch('validar')
  @UseGuards(AreaEditGuard({ allowedAreas: [8], blockPartner: true }))
  async validateSchedules(@Body() data: ValidateSchedulesDTO[]) {
    await this.validateConfirmAndRejectSchedulesService.validate(data);

    return {
      statusCode: HttpStatus.NO_CONTENT,
      message: 'Programações validadas com sucesso',
    };
  }

  @Patch('confirmar')
  @UseGuards(AreaEditGuard({ allowedAreas: [8], blockPartner: true }))
  async confirmSchedules(@Body() id: ConfirmSchedulesDTO[]) {
    await this.validateConfirmAndRejectSchedulesService.confirm(id);

    return {
      statusCode: HttpStatus.NO_CONTENT,
      message: 'Programações confirmadas com sucesso',
    };
  }

  @Patch('reprovar')
  @UseGuards(AreaEditGuard({ allowedAreas: [8], blockPartner: true }))
  async rejectSchedules(@Body() data: RejectScheduleDTO[]) {
    await this.validateConfirmAndRejectSchedulesService.reject(data);

    return {
      statusCode: HttpStatus.NO_CONTENT,
      message: 'Programação reprovada com sucesso',
    };
  }

  // @Patch(':id')
  // @UseGuards(VisualizationGuard)
  // async updateSchedules(
  //   @Param('id', ParseIntPipe) id: number,
  //   @Body() schedulesData: UpdateSchedulesDataDTO,
  //   @Req() req: any,
  // ) {
  //   let permission: boolean;

  //   if (req.insufficientPermission !== undefined) {
  //     permission = req.insufficientPermission;
  //   }

  //   const idUser = req.user.sub;

  //   const data = {
  //     updateData: { id, idUser, ...schedulesData.updateData },
  //     ...(schedulesData.executionReportData && {
  //       executionReportData: {
  //         ...schedulesData.executionReportData,
  //         idUser,
  //       },
  //     }),
  //   };

  //   await this.handleSchedulesUpdateService.update(data, permission, files);

  //   return {
  //     statusCode: HttpStatus.NO_CONTENT,
  //     message: 'Atualização da programação feita com sucesso',
  //   };
  // }

  @Patch(':id')
  @UseGuards(AreaEditGuard({ allowedAreas: [8] }))
  async updateSchedules(
    @Param('id', ParseIntPipe) id: number,
    @Body() schedulesData: SchedulesDataDTO,
    @Req() req: any,
  ) {
    let permission: boolean;

    if (req.insufficientPermission !== undefined) {
      permission = req.insufficientPermission;
    }

    const idUser = req.user.sub;

    const data = { id, idUser, ...schedulesData };
    // ...(schedulesData.executionReportData && {
    //   executionReportData: {
    //     ...schedulesData.executionReportData,
    //     idUser,
    //   },
    // }),

    await this.handleSchedulesUpdateService.update(data, permission);

    return {
      statusCode: HttpStatus.NO_CONTENT,
      message: 'Atualização da programação feita com sucesso',
    };
  }
}
