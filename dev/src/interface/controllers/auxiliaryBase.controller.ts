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
import { OperationType } from 'src/application/types';
import { AuxiliaryBaseService } from 'src/application/usecases/auxiliaryBase/auxiliaryBase.service';
import {
  AreaEditGuard,
  AreaViewGuard,
} from 'src/core/guards/newPermission.guard';
import {
  InsertBaseAuxiliaryMarketDTO,
  NotesDTO,
} from '../dtos/auxiliaryBaseDTO';

import { CONSTRUCTION_AREA_ID } from '../shared/costants';

// O fluxo de CAPEX (POST capex/pipeline) vive no CapexController.
const AREA_EDIT = AreaEditGuard({
  allowedAreas: [CONSTRUCTION_AREA_ID],
  blockPartner: true,
});
const AREA_VIEW = AreaViewGuard({
  allowedAreas: [CONSTRUCTION_AREA_ID],
  blockPartner: true,
});

@Controller('base-auxiliar')
export class AuxiliaryBaseController {
  constructor(private readonly auxiliaryBaseService: AuxiliaryBaseService) {}

  @Get('mercado')
  @UseGuards(AREA_VIEW)
  async GetAuxiliaryBaseMarket(@Query('idRegional') idRegional?: number) {
    const response = await this.auxiliaryBaseService.getMarket(idRegional);
    return {
      statusCode: HttpStatus.OK,
      message: 'Valores retornados com sucesso',
      data: response,
    };
  }

  @Get('notas')
  @UseGuards(AREA_VIEW)
  async GetAuxiliaryBaseNotes(@Query('idRegional') idRegional?: number) {
    const response = await this.auxiliaryBaseService.getNotes(idRegional);
    return {
      statusCode: HttpStatus.OK,
      message: 'Valores das notas na base auxiliar retornadas com sucesso',
      data: response,
    };
  }

  @Post('notas')
  @UseGuards(AREA_EDIT)
  async InsertAuxiliaryBaseNotes(
    @Body() body: { data: NotesDTO[]; operation: OperationType },
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

  @Post('mercado')
  @UseGuards(AREA_EDIT)
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
  @UseGuards(AREA_EDIT)
  async DeleteAuxiliaryBaseMarket(@Param('id', ParseIntPipe) id: number) {
    await this.auxiliaryBaseService.delete('baseOv', id);
    return { statusCode: HttpStatus.OK, message: 'Obra removida com sucesso' };
  }

  @Delete('mercado')
  @UseGuards(AREA_EDIT)
  async DeleteAuxiliaryBaseMarketWithoutId() {
    await this.auxiliaryBaseService.delete('baseOv', undefined);
    return { statusCode: HttpStatus.OK, message: 'Obra removida com sucesso' };
  }

  @Delete('notas/:id')
  @UseGuards(AREA_EDIT)
  async DeleteAuxiliaryBaseNotes(@Param('id', ParseIntPipe) id: number) {
    await this.auxiliaryBaseService.delete('baseNotes', id);
    return { statusCode: HttpStatus.OK, message: 'Nota removida com sucesso' };
  }

  @Delete('notas/')
  @UseGuards(AREA_EDIT)
  async DeleteAuxiliaryBaseNotesWithoutId() {
    await this.auxiliaryBaseService.delete('baseNotes', undefined);
    return { statusCode: HttpStatus.OK, message: 'Nota removida com sucesso' };
  }
}
