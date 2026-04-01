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

  @Get(':id')
  async getServicesByWorkId(
    @Param('id', ParseIntPipe) id: number,
    @Query('ponto') point?: string,
    @Query('servico') service?: string,
    @Query('operacao') operation?: string,
  ) {
    const response = await this.queriesServicesService.getById({
      id,
      point,
      service,
      operation,
    });

    return {
      statusCode: HttpStatus.OK,
      message: 'Serviços da obra retornados',
      data: response,
    };
  }

  @Get('selecionados/:id')
  async getScheduledServices(
    @Param('id', ParseIntPipe) id: number,
    @Query('idProgramacao', ParseIntPipe) idProgramacao: number,
    @Query('ponto') point?: string,
    @Query('servico') service?: string,
    @Query('operacao') operation?: string,
  ) {
    const response = await this.queriesServicesService.getSelectedServices({
      id,
      idProgramacao,
      point,
      service,
      operation,
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

  @Get('filtros/:id')
  async getServicesFilters(@Param('id', ParseIntPipe) id: number) {
    const response = await this.queriesServicesService.getServicesFilters(id);

    return {
      statusCode: HttpStatus.OK,
      message: 'Valores dos filtros retornados',
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

  @Patch('reprogramar')
  async reascheduleServices(@Body() data: { id: number }[]) {
    await this.worksServicesService.reascheduleServices(data);

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
      ...(executionData.data.executionReport && {
        executionReportData: {
          ...executionData.data.executionReport,
          idUser,
        },
      }),
    };

    await this.finalizeServicesService.finalizeServices(id, data, files);

    return {
      statusCode: HttpStatus.OK,
      message: 'Programação Finalizada',
    };
  }

  @Patch('realizar')
  async performServices(@Body() data: PerformServicesDTO[]) {
    await this.worksServicesService.performServices(data);

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

  @Post('adicionar')
  async addServices(@Body() data: AddServicesDTO) {
    await this.worksServicesService.addServices(data);

    return {
      statusCode: HttpStatus.OK,
      message: 'Serviços realizados com sucesso',
    };
  }
}
