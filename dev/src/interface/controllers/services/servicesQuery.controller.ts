import {
  Controller,
  Get,
  HttpStatus,
  Param,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';

import { QueriesServicesService } from 'src/application/usecases/services/queriesServices.service';
import { AreaViewGuard } from 'src/core/guards/newPermission.guard';

@Controller('servicos')
export class ServicesQueryController {
  constructor(
    private readonly queriesServicesService: QueriesServicesService,
  ) {}

  @Get('materiais')
  @UseGuards(AreaViewGuard({ allowedAreas: [8, 1] }))
  async getMaterials() {
    const response = await this.queriesServicesService.getMaterials();

    return {
      statusCode: HttpStatus.OK,
      message: 'Materiais retornados',
      data: response,
    };
  }

  @Get(':id')
  @UseGuards(AreaViewGuard({ allowedAreas: [8, 1] }))
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
  @UseGuards(AreaViewGuard())
  async getAllItems(@Param('id', ParseIntPipe) id: number) {
    const response = await this.queriesServicesService.getAllItems(id);

    return {
      statusCode: HttpStatus.OK,
      message: 'Todos os materiais e serviços da obra retornados',
      data: response,
    };
  }

  @Get('selecionados/:id')
  @UseGuards(AreaViewGuard({ allowedAreas: [8, 1] }))
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
  @UseGuards(AreaViewGuard({ allowedAreas: [8, 1] }))
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
  @UseGuards(AreaViewGuard({ allowedAreas: [8, 1] }))
  async getServiceContracts(@Param('id', ParseIntPipe) id: number) {
    const response = await this.queriesServicesService.getServiceContracts(id);

    return {
      statusCode: HttpStatus.OK,
      message: 'Retornado contratos dos serviços',
      data: response,
    };
  }

  @Get('equipes/:id')
  @UseGuards(AreaViewGuard({ allowedAreas: [8, 1] }))
  async getTeamsServices(@Param('id', ParseIntPipe) id: number) {
    const response = await this.queriesServicesService.getTeamsServices(id);

    return {
      statusCode: HttpStatus.OK,
      message: 'Retornado equipes',
      data: response,
    };
  }

  @Get('opcoes/:id')
  @UseGuards(AreaViewGuard({ allowedAreas: [8, 1] }))
  async getServiceOptions(@Param('id', ParseIntPipe) id: number) {
    const response = await this.queriesServicesService.getServiceOptions(id);

    return {
      statusCode: HttpStatus.OK,
      message: 'Opções retornados com sucesso',
      data: response,
    };
  }
}
