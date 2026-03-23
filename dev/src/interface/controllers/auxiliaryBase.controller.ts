import { AuxiliaryBaseService } from 'src/application/usecases/auxiliaryBase/auxiliaryBase.service';
import { PermissionGuard } from 'src/core/guards/permission.guard';
import { VisualizationGuard } from 'src/core/guards/visualization.guard';

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

import {
  InsertBaseAuxiliaryMarketDTO,
  NotesDTO,
} from '../dtos/auxiliaryBaseDTO';
import { MaterialCapexDTO } from '../dtos/materialDTO';
import { OperationType } from '../types/baseAuxiliaryInterface';

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
    @Body()
    body: {
      data: NotesDTO[];
      operation: OperationType;
    },
  ) {
    const res = await this.auxiliaryBaseService.insertAuxiliaryBaseNotes(
      body.data,
      body.operation,
    );

    return {
      statusCode: HttpStatus.CREATED,
      message: 'Notas inseridas na base auxiliar com sucesso',
      res,
    };
  }

  @Post('capex')
  @UseGuards(PermissionGuard)
  async InsertAuxiliaryBaseCapex(@Body() data: MaterialCapexDTO[]) {
    await this.auxiliaryBaseService.insertAuxiliaryBaseCapex(data);

    return {
      statusCode: HttpStatus.CREATED,
      message: 'Materiais importados com sucesso',
    };
  }

  @Post('mercado')
  @UseGuards(PermissionGuard)
  async InsertAuxiliaryBaseMarket(
    @Body()
    body: {
      data: InsertBaseAuxiliaryMarketDTO[];
      operation: OperationType;
    },
  ) {
    await this.auxiliaryBaseService.insertAuxiliaryBaseMarket(
      body.data,
      body.operation,
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
      message: 'Obra removida com sucesso',
    };
  }

  @Delete('mercado')
  @UseGuards(PermissionGuard)
  async DeleteAuxiliaryBaseMarketWithoutId() {
    await this.auxiliaryBaseService.delete('baseOv', undefined);

    return {
      statusCode: HttpStatus.OK,
      message: 'Obra removida com sucesso',
    };
  }

  @Delete('notas/:id')
  @UseGuards(PermissionGuard)
  async DeleteAuxiliaryBaseNotes(@Param('id', ParseIntPipe) id: number) {
    await this.auxiliaryBaseService.delete('baseNotes', id);

    return {
      statusCode: HttpStatus.OK,
      message: 'Nota removida com sucesso',
    };
  }

  @Delete('notas/')
  @UseGuards(PermissionGuard)
  async DeleteAuxiliaryBaseNotesWithoutId() {
    await this.auxiliaryBaseService.delete('baseNotes', undefined);

    return {
      statusCode: HttpStatus.OK,
      message: 'Nota removida com sucesso',
    };
  }
}
