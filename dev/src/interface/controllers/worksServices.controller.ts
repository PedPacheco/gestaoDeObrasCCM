import {
  Controller,
  Get,
  HttpStatus,
  Param,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { WorksServicesService } from 'src/application/worksServices.service';

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
    @Query('dataProg') dataProg: string,
    @Query('ponto') point?: string,
    @Query('servico') service?: string,
    @Query('operacao') operation?: string,
  ) {
    const response = await this.worksServicesService.getSelectedServices({
      id,
      dataProg,
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

  @Get('contratos')
  async getServiceContracts(
    @Query('idRegional', new ParseIntPipe({ optional: true }))
    idRegional?: number,
  ) {
    const response =
      await this.worksServicesService.getServiceContracts(idRegional);

    return {
      statusCode: HttpStatus.OK,
      message: 'Retornado contratos dos serviços',
      data: response,
    };
  }
}
