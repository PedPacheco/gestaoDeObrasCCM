import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Query,
} from '@nestjs/common';
import { WorksServicesService } from 'src/application/worksServices.service';
import {
  PerformServicesDTO,
  ScheduleServicesDTO,
} from '../dtos/workServicesDTO';

@Controller('servicos')
export class ServicesController {
  constructor(private readonly worksServicesService: WorksServicesService) {}

  @Get(':id')
  async getServicesByWorkId(
    @Param('id', ParseIntPipe) id: number,
    @Query('ponto') point?: string,
    @Query('servico') service?: string,
    @Query('operacao') operation?: string,
  ) {
    const response = await this.worksServicesService.getById({
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
    const response = await this.worksServicesService.getSelectedServices({
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
      await this.worksServicesService.getServiceScheduleHistory(id);

    return {
      statusCode: HttpStatus.OK,
      message: 'Histórico das programações retornados',
      data: response,
    };
  }

  @Get('filtros/:id')
  async getServicesFilters(@Param('id', ParseIntPipe) id: number) {
    const response = await this.worksServicesService.getServicesFilters(id);

    return {
      statusCode: HttpStatus.OK,
      message: 'Valores dos filtros retornados',
      data: response,
    };
  }

  @Get('contratos/:id')
  async getServiceContracts(@Param('id', ParseIntPipe) id: number) {
    const response = await this.worksServicesService.getServiceContracts(id);

    return {
      statusCode: HttpStatus.OK,
      message: 'Retornado contratos dos serviços',
      data: response,
    };
  }

  @Get('equipes/:id')
  async getTeamsServices(@Param('id', ParseIntPipe) id: number) {
    const response = await this.worksServicesService.getTeamsServices(id);

    return {
      statusCode: HttpStatus.OK,
      message: 'Retornado equipes',
      data: response,
    };
  }

  @Patch()
  async scheduleServices(@Body() scheduleServicesData: ScheduleServicesDTO[]) {
    await this.worksServicesService.scheduleServices(scheduleServicesData);

    return {
      statusCode: HttpStatus.OK,
      message: 'Serviços programados com sucesso',
    };
  }

  // @Patch('finalizar/:id')
  // async finalizaeServices(
  //   @Param('id', ParseIntPipe) id: number,
  //   @Body() data: { id: number },
  // ) {
  //   await this.worksServicesService.finalizeServices(id, data);

  //   return {
  //     statusCode: HttpStatus.OK,
  //     message: 'Programação Finalizada',
  //   };
  // }

  @Patch('cancelar/:id')
  async cancelScheduleService(@Param('id', ParseIntPipe) id: number) {
    await this.worksServicesService.cancel(id);

    return {
      statusCode: HttpStatus.OK,
      message: 'Programação dos serviços foi cancelada',
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

  @Patch('reprogramar')
  async reascheduleServices(@Body() data: { id: number }[]) {
    await this.worksServicesService.reascheduleServices(data);

    return {
      statusCode: HttpStatus.OK,
      message: 'Serviços reprogramados com sucesso',
    };
  }
}
