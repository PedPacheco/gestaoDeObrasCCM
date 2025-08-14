import { PermissionGuard } from 'src/core/guards/permission.guard';

import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { VisualizationGuard } from 'src/core/guards/visualization.guard';
import {
  InsertBaseAuxiliaryMarketDTO,
  InsertBaseAuxiliaryNotesDTO,
} from '../dtos/auxiliaryBaseDTO';
import { AuxiliaryBaseService } from 'src/application/auxiliaryBase.service';

@Controller('base-auxiliar')
export class AuxiliaryBaseController {
  constructor(private readonly auxiliaryBaseService: AuxiliaryBaseService) {}

  @Get('mercado')
  @UseGuards(VisualizationGuard)
  async GetAuxiliaryBaseMarket(@Query('idRegional') idRegional?: number) {
    const response = await this.auxiliaryBaseService.getMarket(idRegional);

    return {
      statusCode: HttpStatus.OK,
      message: 'Valores retornados com sucesso',
      data: response,
    };
  }

  @Get('notas')
  @UseGuards(VisualizationGuard)
  async GetAuxiliaryBaseNotes(@Query('idRegional') idRegional?: number) {
    const response = await this.auxiliaryBaseService.getNotes(idRegional);

    return {
      statusCode: HttpStatus.OK,
      message: 'Valores das notas na base auxiliar retornadas com sucesso',
      data: response,
    };
  }

  @Post('notas')
  @UseGuards(PermissionGuard)
  async InsertAuxiliaryBaseNotes(
    @Body() notesParameters: InsertBaseAuxiliaryNotesDTO[],
  ) {
    const res =
      await this.auxiliaryBaseService.insertAuxiliaryBaseNotes(notesParameters);

    return {
      statusCode: HttpStatus.CREATED,
      message: 'Notas inseridas na base auxiliar com sucesso',
      res,
    };
  }

  @Post('mercado')
  @UseGuards(PermissionGuard)
  async InsertAuxiliaryBaseMarket(
    @Body() marketParameters: InsertBaseAuxiliaryMarketDTO[],
  ) {
    await this.auxiliaryBaseService.insertAuxiliaryBaseMarket(marketParameters);

    return {
      statusCode: HttpStatus.CREATED,
      message: 'Obras de mercado inseridas na base auxiliar com sucesso',
    };
  }

  @Delete('mercado')
  @UseGuards(PermissionGuard)
  async DeleteAuxiliaryBaseMarket() {
    await this.auxiliaryBaseService.delete('baseOv');

    return {
      statusCode: HttpStatus.OK,
      message: 'Dados removidos com sucessso',
    };
  }

  @Delete('notas')
  @UseGuards(PermissionGuard)
  async DeleteAuxiliaryBaseNotes() {
    await this.auxiliaryBaseService.delete('baseNotes');

    return {
      statusCode: HttpStatus.OK,
      message: 'Dados removidos com sucessso',
    };
  }
}
