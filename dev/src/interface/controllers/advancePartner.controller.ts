import {
  Controller,
  Get,
  HttpStatus,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { GetRestrictionsAdvancePartnerDTO } from '../dtos/restrictionsDTO';
import { AdvancePartnerService } from 'src/application/usecases/advancePartner.service';
import { AreaViewGuard } from 'src/core/guards/newPermission.guard';

interface CustomRequest extends Request {
  idParceira?: number;
  insufficientPermission?: boolean;
}

@Controller('avanca-parceira')
export class AdvancePartnerController {
  constructor(private readonly service: AdvancePartnerService) {}

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

  @Get()
  @UseGuards(AreaViewGuard({ allowedAreas: [8, 1] }))
  async getRestrictionsAdvancePartner(
    @Query() restrictionFilters: GetRestrictionsAdvancePartnerDTO,
    @Req() req: any,
  ) {
    const filters = this.applyFilters(restrictionFilters, req);

    const data = await this.service.getRestrictionsAdvancePartner(filters);

    return {
      statusCode: HttpStatus.OK,
      message: 'Dados de eliminação de restrição retornados com sucesso',
      data,
    };
  }

  @Get('aderencia-parceira')
  @UseGuards(AreaViewGuard({ allowedAreas: [8, 1] }))
  async getGripPartner(
    @Query() restrictionFilters: GetRestrictionsAdvancePartnerDTO,
    @Req() req: any,
  ) {
    const filters = this.applyFilters(restrictionFilters, req);

    const data = await this.service.getGripPartner(filters);

    return {
      statusCode: HttpStatus.OK,
      message: 'Dados de aderência parceira retornados com sucesso',
      data,
    };
  }

  @Get('motivos-reprogramacao')
  @UseGuards(AreaViewGuard({ allowedAreas: [8, 1] }))
  async getReaschedulingReasons(
    @Query() restrictionFilters: GetRestrictionsAdvancePartnerDTO,
    @Req() req: any,
  ) {
    const filters = this.applyFilters(restrictionFilters, req);

    const data = await this.service.getReaschedulingReasons(filters);

    return {
      statusCode: HttpStatus.OK,
      message: 'Motivos de reprogramação retornados com sucesso',
      data,
    };
  }

  @Get('sparklines-parceira')
  @UseGuards(AreaViewGuard({ allowedAreas: [8, 1] }))
  async getSparklinesByPartner(
    @Query() restrictionFilters: GetRestrictionsAdvancePartnerDTO,
    @Req() req: any,
  ) {
    const filters = this.applyFilters(restrictionFilters, req);
    const data = await this.service.getSparklinesByPartner(filters);

    return {
      statusCode: HttpStatus.OK,
      message: 'Sparklines por parceira retornados com sucesso',
      data,
    };
  }

  @Get('semanas-parceira')
  @UseGuards(AreaViewGuard({ allowedAreas: [8, 1] }))
  async getWeeksByPartner(
    @Query() restrictionFilters: GetRestrictionsAdvancePartnerDTO,
    @Req() req: any,
  ) {
    const filters = this.applyFilters(restrictionFilters, req);
    const data = await this.service.getWeeksByPartner(filters);

    return {
      statusCode: HttpStatus.OK,
      message: 'Semanas programadas por parceira retornadas com sucesso',
      data,
    };
  }
}
