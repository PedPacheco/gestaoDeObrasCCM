import { GetAllWorksDTO, GetWorksDTO } from 'src/interface/dtos/worksDto';

import {
  Controller,
  Get,
  HttpStatus,
  Param,
  ParseIntPipe,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { GetWorksInPortfolioService } from 'src/application/usecases/works/getWorksInPortfolio.service';
import { GetAllWorksService } from 'src/application/usecases/works/getAllWorks.service';
import { GetCompletedWorksService } from 'src/application/usecases/works/getCompletedWorks.service';
import { GetWorkDetailsService } from 'src/application/usecases/works/getWorkDetails.service';
import { AreaViewGuard } from 'src/core/guards/newPermission.guard';

interface CustomRequest extends Request {
  idParceira?: number;
  insufficientPermission?: boolean;
  user: any;
}

@Controller('obras')
export class WorksController {
  constructor(
    private getWorksInPortfolioService: GetWorksInPortfolioService,
    private getAllWorksService: GetAllWorksService,
    private getCompletedWorksService: GetCompletedWorksService,
    private getWorkDetailsService: GetWorkDetailsService,
  ) {}

  private applyFilters<
    T extends {
      idParceira?: number | number[];
      insufficientPermission?: boolean;
    },
  >(filters: T, req: CustomRequest): T {
    if (req.idParceira) {
      filters.idParceira = req.idParceira;
    }
    if (req.user.tipo_usuario === 'PARCEIRA') {
      filters.insufficientPermission = req.insufficientPermission;
    }
    return filters;
  }

  @Get()
  @UseGuards(AreaViewGuard({ allowedAreas: [8, 1], blockPartner: true }))
  async getAllWorks(
    @Query() worksFilters: GetAllWorksDTO,
    @Req() req: CustomRequest,
  ) {
    const filters = this.applyFilters(worksFilters, req);
    const response = await this.getAllWorksService.getAllWorks(filters);

    return {
      statusCode: HttpStatus.OK,
      message: 'Todas as obras retornadas com sucesso',
      data: response,
    };
  }

  @Get('obras-carteira')
  @UseGuards(AreaViewGuard({ allowedAreas: [8, 1] }))
  async getWorksInPortfolio(
    @Query() worksFilters: GetWorksDTO,
    @Req() req: CustomRequest,
  ) {
    const filters = this.applyFilters(worksFilters, req);
    const response =
      await this.getWorksInPortfolioService.getWorksInPortfolio(filters);

    return {
      statusCode: HttpStatus.OK,
      message: 'Obras em carteira retornadas com sucesso',
      data: response,
    };
  }

  @Get('obras-executadas')
  @UseGuards(AreaViewGuard({ allowedAreas: [8, 1] }))
  async GetCompletedWorks(
    @Query() worksFilters: GetWorksDTO,
    @Req() req: CustomRequest,
  ) {
    const filters = this.applyFilters(worksFilters, req);
    const response =
      await this.getCompletedWorksService.getCompletedWorks(filters);

    return {
      statusCode: HttpStatus.OK,
      message: 'Obras em executadas retornadas com sucesso',
      data: response,
    };
  }

  @Get(':id')
  @UseGuards(AreaViewGuard())
  async getWorkDetails(@Param('id', ParseIntPipe) id: number) {
    const response = await this.getWorkDetailsService.get(id);

    return {
      statusCode: HttpStatus.OK,
      message: 'Retornado os detalhes da obra',
      data: response,
    };
  }
}
