import {
  Body,
  Controller,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Req,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';

import { FilesInterceptor } from '@nestjs/platform-express';
import { HandleFinalizeServicesService } from 'src/application/usecases/orchestrators/handleFinalizeServices.service';
import { HandleRescheduleServicesService } from 'src/application/usecases/orchestrators/handleRescheduleServices.service';
import { FinalizeServicesService } from 'src/application/usecases/services/finalizeServices.service';

import {
  FinalizeServicesDTO,
  PerformServicesDTO,
} from 'src/interface/dtos/workServicesDTO';

@Controller('servicos')
export class ServicesExecutionController {
  constructor(
    private readonly finalizeServicesService: FinalizeServicesService,
    private readonly handleFinalizeServicesService: HandleFinalizeServicesService,
    private readonly handleRescheduleServicesService: HandleRescheduleServicesService,
  ) {}

  // @Patch('reprogramar/:id/:scheduleId')
  // async reascheduleServices(
  //   @Param('id', ParseIntPipe) id: number,
  //   @Param('scheduleId', ParseIntPipe) scheduleId: number,
  // ) {
  //   await this.finalizeServicesService.reascheduleServices(id, scheduleId);

  //   return {
  //     statusCode: HttpStatus.OK,
  //     message: 'Serviços reprogramados com sucesso',
  //   };
  // }

  @Patch('reprogramar/:id/:scheduleId')
  async reascheduleServices(
    @Param('id', ParseIntPipe) id: number,
    @Param('scheduleId', ParseIntPipe) scheduleId: number,
  ) {
    await this.handleRescheduleServicesService.execute(id, scheduleId);

    return {
      statusCode: HttpStatus.OK,
      message: 'Serviços reprogramados com sucesso',
    };
  }

  // @Patch('finalizar/:id')
  // @UseInterceptors(FilesInterceptor('files'))
  // async finalizeServices(
  //   @Param('id', ParseIntPipe) id: number,
  //   @Body() executionData: FinalizeServicesDTO,
  //   @UploadedFiles() files: Express.Multer.File[],
  //   @Req() req: any,
  // ) {
  //   const userId = req.user.sub;

  //   const data = {
  //     ...executionData.data,
  //     userId,
  //     executionReportData: executionData.data.executionReport
  //       ? {
  //           ...executionData.data.executionReport,
  //           userId,
  //         }
  //       : undefined,
  //   };

  //   await this.finalizeServicesService.finalizeServices(id, data, files);

  //   return {
  //     statusCode: HttpStatus.OK,
  //     message: 'Programação Finalizada',
  //   };
  // }

  @Patch('finalizar/:id')
  @UseInterceptors(FilesInterceptor('files'))
  async finalizeServices(
    @Param('id', ParseIntPipe) id: number,
    @Body() executionData: FinalizeServicesDTO,
    @UploadedFiles() files: Express.Multer.File[],
    @Req() req: any,
  ) {
    const userId = req.user.sub;

    const data = {
      ...executionData.data,
      userId,
      executionReportData: executionData.data.executionReport
        ? {
            ...executionData.data.executionReport,
            userId,
          }
        : undefined,
    };

    await this.handleFinalizeServicesService.execute(id, data, files);

    return {
      statusCode: HttpStatus.OK,
      message: 'Programação Finalizada',
    };
  }

  @Patch('realizar')
  async performServices(@Body() data: PerformServicesDTO[]) {
    await this.finalizeServicesService.performServices(data);

    return {
      statusCode: HttpStatus.OK,
      message: 'Serviços realizados com sucesso',
    };
  }
}
