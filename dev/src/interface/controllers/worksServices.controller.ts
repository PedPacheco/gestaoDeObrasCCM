import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import {
  AddServicesDTO,
  ApplyAdditonalDTO,
  FinalizeServicesDTO,
  PerformServicesDTO,
  ScheduleServicesDTO,
} from '../dtos/workServicesDTO';

import { FilesInterceptor } from '@nestjs/platform-express';
import { FinalizeServicesService } from 'src/application/usecases/services/finalizeServices.service';
import { QueriesServicesService } from 'src/application/usecases/services/queriesServices.service';
import { WorksServicesService } from 'src/application/usecases/services/worksServices.service';

@Controller('servicos')
export class ServicesController {
  constructor(
    private readonly worksServicesService: WorksServicesService,
    private readonly queriesServicesService: QueriesServicesService,
    private readonly finalizeServicesService: FinalizeServicesService,
  ) {}

  @Get('materiais')
  async getMaterials() {
    const response = await this.queriesServicesService.getMaterials();

    return {
      statusCode: HttpStatus.OK,
      message: 'Materiais retornados',
      data: response,
    };
  }

  @Get(':id')
  async getNotScheduledServices(@Param('id', ParseIntPipe) id: number) {
    const response =
      await this.queriesServicesService.getNotScheduledServices(id);

    return {
      statusCode: HttpStatus.OK,
      message: 'Serviços da obra retornados',
      data: response,
    };
  }

  @Get('todos/:id')
  async getAllItems(@Param('id', ParseIntPipe) id: number) {
    const response = await this.queriesServicesService.getAllItems(id);

    return {
      statusCode: HttpStatus.OK,
      message: 'Todos os materiais e serviços da obra retornados',
      data: response,
    };
  }

  @Get('selecionados/:id')
  async getScheduledServices(
    @Param('id', ParseIntPipe) id: number,
    @Query('idProgramacao', ParseIntPipe) idProgramacao: number,
  ) {
    const response = await this.queriesServicesService.getSelectedServices({
      id,
      idProgramacao,
    });

    return {
      statusCode: HttpStatus.OK,
      message: 'Serviços Selecionados da obra retornados',
      data: response,
    };
  }

  @Get('historico/:id')
  async getServicesScheduleHistory(@Param('id', ParseIntPipe) id: number) {
    const response =
      await this.queriesServicesService.getServiceScheduleHistory(id);

    return {
      statusCode: HttpStatus.OK,
      message: 'Histórico das programações retornados',
      data: response,
    };
  }

  @Get('contratos/:id')
  async getServiceContracts(@Param('id', ParseIntPipe) id: number) {
    const response = await this.queriesServicesService.getServiceContracts(id);

    return {
      statusCode: HttpStatus.OK,
      message: 'Retornado contratos dos serviços',
      data: response,
    };
  }

  @Get('equipes/:id')
  async getTeamsServices(@Param('id', ParseIntPipe) id: number) {
    const response = await this.queriesServicesService.getTeamsServices(id);

    return {
      statusCode: HttpStatus.OK,
      message: 'Retornado equipes',
      data: response,
    };
  }

  @Get('pontos/:id')
  async getServicePoints(@Param('id', ParseIntPipe) id: number) {
    const response = await this.queriesServicesService.getServicePoints(id);

    return {
      statusCode: HttpStatus.OK,
      message: 'Pontos da obra retornado com sucesso',
      data: response,
    };
  }

  @Patch('cancelar/:id')
  async cancelScheduleService(@Param('id', ParseIntPipe) id: number) {
    await this.worksServicesService.cancelServices(id);

    return {
      statusCode: HttpStatus.OK,
      message: 'Programação dos serviços foi cancelada',
    };
  }

  @Patch('programar/:id')
  async scheduleServices(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: ScheduleServicesDTO[],
  ) {
    await this.worksServicesService.scheduleServices(id, data);

    return {
      statusCode: HttpStatus.OK,
      message: 'Serviços programados com sucesso',
    };
  }

  @Patch('reprogramar/:id/:scheduleId')
  async reascheduleServices(
    @Param('id', ParseIntPipe) id: number,
    @Param('scheduleId', ParseIntPipe) scheduleId: number,
  ) {
    await this.worksServicesService.reascheduleServices(id, scheduleId);

    return {
      statusCode: HttpStatus.OK,
      message: 'Serviços reprogramados com sucesso',
    };
  }

  @Patch('finalizar/:id')
  @UseInterceptors(FilesInterceptor('files'))
  async finalizeServices(
    @Param('id', ParseIntPipe) id: number,
    @Body() executionData: FinalizeServicesDTO,
    @UploadedFiles() files: Express.Multer.File[],
    @Req() req: any,
  ) {
    const idUser = req.user.sub;

    const data = {
      ...executionData.data,
      idUser,
      executionReportData: executionData.data.executionReport
        ? {
            ...executionData.data.executionReport,
            idUser,
          }
        : undefined,
    };

    await this.finalizeServicesService.finalizeServices(id, data, files);

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

  @Patch('aplicar-adicional')
  async applyAdditional(@Body() data: ApplyAdditonalDTO[]) {
    await this.worksServicesService.applyAdditional(data);

    return {
      statusCode: HttpStatus.OK,
      message: 'Aplicado adicional no serviço',
    };
  }

  @Post('servico')
  async addServices(@Body() data: AddServicesDTO) {
    await this.worksServicesService.addItem(data, 'service');

    return {
      statusCode: HttpStatus.OK,
      message: 'Serviços realizados com sucesso',
    };
  }

  @Post('material')
  async addMaterials(@Body() data: AddServicesDTO) {
    await this.worksServicesService.addItem(data, 'material');

    return {
      statusCode: HttpStatus.OK,
      message: 'Serviços realizados com sucesso',
    };
  }
}
