import { PermissionGuard } from 'src/core/guards/permission.guard';
import { VisualizationGuard } from 'src/core/guards/visualization.guard';

import {
  ContractUpdateDTO,
  GetAllWorksDTO,
  GetWorksDTO,
  UpdateNotesDTO,
  UpdateWorkDTO,
} from 'src/interface/dtos/worksDto';

import {
  Body,
  Controller,
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

import { InsertMarketWorksDTO, InsertNotesDTO } from '../dtos/auxiliaryBaseDTO';
import { GetWorksInPortfolioService } from 'src/application/works/getWorksInPortfolio.service';
import { GetAllWorksService } from 'src/application/works/getAllWorks.service';
import { GetCompletedWorksService } from 'src/application/works/getCompletedWorks.service';
import { GetWorkDetailsService } from 'src/application/works/getWorkDetails.service';
import { InsertWorksService } from 'src/application/works/InsertWorks.service';
import { HandleWorkUpdateService } from 'src/application/orchestrators/handleWorkUpdate.service';
import { ContractUpdateService } from 'src/application/works/contractUpdate.service';
import { UpdateOvService } from 'src/application/works/updateOv.service';
import { UpdateNoteService } from 'src/application/works/updateNote.service';

interface CustomRequest extends Request {
  idParceira?: number;
  insufficientPermission?: boolean;
}

@Controller('obras')
export class WorksController {
  constructor(
    private getWorksInPortfolioService: GetWorksInPortfolioService,
    private getAllWorksService: GetAllWorksService,
    private getCompletedWorksService: GetCompletedWorksService,
    private getWorkDetailsService: GetWorkDetailsService,
    private insertWorksService: InsertWorksService,
    private handleWorkUpdateService: HandleWorkUpdateService,
    private contractUpdateService: ContractUpdateService,
    private updateOvService: UpdateOvService,
    private updateNoteService: UpdateNoteService,
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
    if (req.insufficientPermission !== undefined) {
      filters.insufficientPermission = req.insufficientPermission;
    }
    return filters;
  }

  @Get()
  @UseGuards(PermissionGuard)
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
  @UseGuards(VisualizationGuard)
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
  @UseGuards(VisualizationGuard)
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
  async getWorkDetails(@Param('id', ParseIntPipe) id: number) {
    const response = await this.getWorkDetailsService.get(id);

    return {
      statusCode: HttpStatus.OK,
      message: 'Retornado os detalhes da obra',
      data: response,
    };
  }

  @Post('inserir-ov')
  @UseGuards(PermissionGuard)
  async InsertMarketWorks(
    @Body() marketWorksParameters: InsertMarketWorksDTO[],
  ) {
    const { insertedCount, message, skipped } =
      await this.insertWorksService.insertMarketWorks(marketWorksParameters);

    return {
      statusCode: HttpStatus.OK,
      message,
      insertedCount,
      skipped,
    };
  }

  @Post('inserir-notas')
  @UseGuards(PermissionGuard)
  async InsertNotes(@Body() data: InsertNotesDTO[]) {
    await this.insertWorksService.insertNotes(data);

    return {
      statusCode: HttpStatus.OK,
      message: 'Notas inseridas com sucesso',
    };
  }

  @Post('atualizar-empreitamento')
  @UseGuards(PermissionGuard)
  async ContractUpdate(@Body() data: ContractUpdateDTO[]) {
    await this.contractUpdateService.update(data);

    return {
      statusCode: HttpStatus.OK,
      message: 'Empreitamento das obras atualizado com sucesso',
    };
  }

  @Patch(':id')
  @UseGuards(VisualizationGuard)
  async Update(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdateWorkDTO,
    @Req() req: CustomRequest,
  ) {
    const insufficientPermission = req.insufficientPermission;

    await this.handleWorkUpdateService.update(data, id, insufficientPermission);

    return {
      statusCode: HttpStatus.OK,
      message: 'Obras atualizada com sucesso',
    };
  }

  @Post('atualizar-ov')
  @UseGuards(PermissionGuard)
  async updateOv(
    @Body()
    body: InsertMarketWorksDTO[],
  ) {
    await this.updateOvService.update(body);

    return {
      statusCode: HttpStatus.OK,
      message: 'Obras atualizada com sucesso',
    };
  }

  @Post('atualizar-nota')
  @UseGuards(PermissionGuard)
  async updateNote(@Body() data: UpdateNotesDTO[]) {
    await this.updateNoteService.update(data);

    return {
      statusCode: HttpStatus.OK,
      message: 'Obras atualizada com sucesso',
    };
  }
}
