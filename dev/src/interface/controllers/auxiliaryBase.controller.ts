import { PermissionGuard } from 'src/core/guards/permission.guard';

import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { VisualizationGuard } from 'src/core/guards/visualization.guard';
import {
  InsertBaseAuxiliaryMarketArrayDTO,
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
    @Body() marketParameters: InsertBaseAuxiliaryMarketArrayDTO,
  ) {
    await this.auxiliaryBaseService.insertAuxiliaryBaseMarket(
      marketParameters.data,
    );

    return {
      statusCode: HttpStatus.CREATED,
      message: 'Obras de mercado inseridas na base auxiliar com sucesso',
    };
  }

  @Delete('mercado/:id')
  @UseGuards(PermissionGuard)
  async DeleteAuxiliaryBaseMarket(@Param('id', ParseIntPipe) id: number) {
    await this.auxiliaryBaseService.delete('baseOv', id);

    return {
      statusCode: HttpStatus.OK,
      message: 'Dados removidos com sucessso',
    };
  }

  @Delete('notas/:id')
  @UseGuards(PermissionGuard)
  async DeleteAuxiliaryBaseNotes(@Param('id', ParseIntPipe) id: number) {
    await this.auxiliaryBaseService.delete('baseNotes', id);

    return {
      statusCode: HttpStatus.OK,
      message: 'Dados removidos com sucessso',
    };
  }
}
