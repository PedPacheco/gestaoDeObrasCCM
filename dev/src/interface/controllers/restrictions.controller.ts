import { RestrictionsService } from 'src/application/usecases/restrictions.service';
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
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';

import {
  GetRestrictionsAdvancePartnerDTO,
  GetRestrictionsDTO,
  InsertPublicationRestrictionsDTO,
  UpdatePublicationRestrictionsDTO,
} from '../dtos/restrictionsDTO';

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
  @UseGuards(VisualizationGuard)
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
  @UseGuards(VisualizationGuard)
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
  @UseGuards(PermissionGuard)
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
  async updatePublicationRestrictions(
    @Body() data: UpdatePublicationRestrictionsDTO,
  ) {
    await this.restrictionsService.updatePublicationRestriction(data);

    return {
      statusCode: HttpStatus.NO_CONTENT,
      message: 'Restrição de publicação atualizadas com sucesso',
    };
  }

  @Get('avanca-parceira')
  @UseGuards(VisualizationGuard)
  async getRestrictionsAdvancePartner(
    @Query() restrictionFilters: GetRestrictionsAdvancePartnerDTO,
    @Req() req: any,
  ) {
    const filters = this.applyFilters(restrictionFilters, req);

    const data =
      await this.restrictionsService.getRestrictionsAdvancePartner(filters);

    return {
      statusCode: HttpStatus.OK,
      message: 'Dados de eliminação de restrição retornados com sucesso',
      data,
    };
  }

  @Get('aderencia-parceira')
  @UseGuards(VisualizationGuard)
  async getGripPartner(
    @Query() restrictionFilters: GetRestrictionsAdvancePartnerDTO,
    @Req() req: any,
  ) {
    const filters = this.applyFilters(restrictionFilters, req);

    const data = await this.restrictionsService.getGripPartner(filters);

    return {
      statusCode: HttpStatus.OK,
      message: 'Dados de aderência parceira retornados com sucesso',
      data,
    };
  }

  @Get('obras-programadas')
  @UseGuards(VisualizationGuard)
  async getScheduledWorks(
    @Query() restrictionFilters: GetRestrictionsAdvancePartnerDTO,
    @Req() req: any,
  ) {
    const filters = this.applyFilters(restrictionFilters, req);

    const data = await this.restrictionsService.getScheduledWorks(filters);

    return {
      statusCode: HttpStatus.OK,
      message: 'Dados de obras programadas retornados com sucesso',
      data,
    };
  }

  @Get('motivos-reprogramacao')
  @UseGuards(VisualizationGuard)
  async getReaschedulingReasons(
    @Query() restrictionFilters: GetRestrictionsAdvancePartnerDTO,
    @Req() req: any,
  ) {
    const filters = this.applyFilters(restrictionFilters, req);

    const data =
      await this.restrictionsService.getReaschedulingReasons(filters);

    return {
      statusCode: HttpStatus.OK,
      message: 'Motivos de reprogramação retornados com sucesso',
      data,
    };
  }

  @Get('restricoes-execucao')
  @UseGuards(VisualizationGuard)
  async getExecutionRestrictions(
    @Query() restrictionFilters: GetRestrictionsAdvancePartnerDTO,
    @Req() req: any,
  ) {
    const filters = this.applyFilters(restrictionFilters, req);

    const data =
      await this.restrictionsService.getExecutionRestrictions(filters);

    return {
      statusCode: HttpStatus.OK,
      message: 'Restrições de execução retornadas com sucesso',
      data,
    };
  }

  @Get('publicacoes/:id')
  @UseGuards(VisualizationGuard)
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
  @UseGuards(PermissionGuard)
  async deletePublicationRestrictions(@Param('id', ParseIntPipe) id: number) {
    await this.restrictionsService.deletePublicationRestriction(id);

    return {
      statusCode: HttpStatus.OK,
      message: 'Restrição de publicação excluída com sucesso',
    };
  }
}
