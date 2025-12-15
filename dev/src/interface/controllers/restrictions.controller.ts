import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PermissionGuard } from 'src/core/guards/permission.guard';
import { RestrictionsService } from 'src/application/restrictions.service';
import {
  GetRestrictionsDTO,
  InsertPublicationRestrictionsDTO,
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
    @Body() data: InsertPublicationRestrictionsDTO,
  ) {
    await this.restrictionsService.insertPublicationRestriction(data);

    return {
      statusCode: HttpStatus.NO_CONTENT,
      message: 'Restrições atualizadas com sucesso',
    };
  }
}
