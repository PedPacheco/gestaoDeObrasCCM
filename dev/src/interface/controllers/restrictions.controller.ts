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
  UseGuards,
} from '@nestjs/common';
import { PermissionGuard } from 'src/core/guards/permission.guard';
import { RestrictionsService } from 'src/application/restrictions.service';
import {
  GetRestrictionsDTO,
  InsertPublicationRestrictionsDTO,
  UpdatePublicationRestrictionsDTO,
} from '../dtos/restrictionsDTO';

@Controller('restricao')
export class RestrictionController {
  constructor(private restrictionsService: RestrictionsService) {}

  @Get('programacao')
  @UseGuards(PermissionGuard)
  async getScheduleRestrictions(@Query() filters: GetRestrictionsDTO) {
    const response =
      await this.restrictionsService.getScheduleRestricion(filters);

    return {
      statusCode: HttpStatus.OK,
      message: 'Restrições das programações retornadas com sucesso',
      data: response,
    };
  }

  @Get('publicacoes')
  @UseGuards(PermissionGuard)
  async getPublicationsRestrictions(@Query() filters: GetRestrictionsDTO) {
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
  @UseGuards(PermissionGuard)
  async updatePublicationRestrictions(
    @Body() data: UpdatePublicationRestrictionsDTO,
  ) {
    await this.restrictionsService.updatePublicationRestriction(data);

    return {
      statusCode: HttpStatus.NO_CONTENT,
      message: 'Restrição de publicação atualizadas com sucesso',
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
