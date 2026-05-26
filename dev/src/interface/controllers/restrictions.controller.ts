import { RestrictionsService } from 'src/application/usecases/restrictions.service';

import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';

import {
  GetRestrictionsDTO,
  InsertPublicationRestrictionsDTO,
  UpdatePublicationRestrictionsDTO,
} from '../dtos/restrictionsDTO';
import {
  AreaEditGuard,
  AreaViewGuard,
} from 'src/core/guards/newPermission.guard';

interface CustomRequest extends Request {
  idParceira?: number;
  insufficientPermission?: boolean;
}

@Controller('restricao')
export class RestrictionController {
  constructor(private restrictionsService: RestrictionsService) {}

  private applyFilters<
    T extends {
      idParceira?: number | number[];
    },
  >(filters: T, req: CustomRequest): T {
    if (req.idParceira) {
      filters.idParceira = req.idParceira;
    }

    return filters;
  }

  @Get('programacao')
  @UseGuards(AreaViewGuard({ allowedAreas: [8, 2], blockPartner: true }))
  async getScheduleRestrictions(
    @Query() restrictionFilters: GetRestrictionsDTO,
    @Req() req: any,
  ) {
    const filters = this.applyFilters(restrictionFilters, req);
    const response =
      await this.restrictionsService.getScheduleRestricion(filters);

    return {
      statusCode: HttpStatus.OK,
      message: 'Restrições das programações retornadas com sucesso',
      data: response,
    };
  }

  @Get('publicacoes')
  @UseGuards(AreaViewGuard({ allowedAreas: [8, 2, 7] }))
  async getPublicationsRestrictions(
    @Query() restrictionFilters: GetRestrictionsDTO,
    @Req() req: any,
  ) {
    const filters = this.applyFilters(restrictionFilters, req);
    const response =
      await this.restrictionsService.getPublicationRestriction(filters);

    return {
      statusCode: HttpStatus.OK,
      message: 'Restrições das programações retornadas com sucesso',
      data: response,
    };
  }

  @Post('publicacoes')
  @UseGuards(AreaEditGuard({ allowedAreas: [8, 7], blockPartner: true }))
  async insertPublicationRestriction(
    @Body() data: InsertPublicationRestrictionsDTO[],
  ) {
    await this.restrictionsService.insertPublicationRestriction(data);

    return {
      statusCode: HttpStatus.NO_CONTENT,
      message: 'Restrição de publicação criada com sucesso',
    };
  }

  @Patch('publicacoes')
  @UseGuards(AreaEditGuard({ allowedAreas: [8, 7] }))
  async updatePublicationRestrictions(
    @Body() data: UpdatePublicationRestrictionsDTO,
  ) {
    await this.restrictionsService.updatePublicationRestriction(data);

    return {
      statusCode: HttpStatus.NO_CONTENT,
      message: 'Restrição de publicação atualizadas com sucesso',
    };
  }

  @Get('publicacoes/:id')
  @UseGuards(AreaViewGuard())
  async getPublicationsRestrictionsByWorkID(
    @Param('id', ParseIntPipe) id: number,
  ) {
    const response =
      await this.restrictionsService.getPublicationRestrictionsByWorkId(id);

    return {
      statusCode: HttpStatus.OK,
      message: 'Restrições de publicação da obra retornadas com sucesso',
      data: response,
    };
  }

  @Delete('publicacoes/:id')
  @UseGuards(AreaEditGuard({ allowedAreas: [8, 7], blockPartner: true }))
  async deletePublicationRestrictions(@Param('id', ParseIntPipe) id: number) {
    await this.restrictionsService.deletePublicationRestriction(id);

    return {
      statusCode: HttpStatus.OK,
      message: 'Restrição de publicação excluída com sucesso',
    };
  }
}
