import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import { GapAnalysisAuditService } from 'src/application/usecases/gap-analysis-audit.service';
import { AreaViewGuard } from 'src/core/guards/newPermission.guard';
import {
  CreateManyGapAnalysisAuditDTO,
  GapAnalysisAuditDTO,
} from '../dtos/gapAnalysisAuditDTO';

@Controller('gap-analysis')
export class GapAnalysisAuditController {
  constructor(private readonly service: GapAnalysisAuditService) {}

  @Get()
  async findAll() {
    const data = await this.service.findAll();
    return { statusCode: HttpStatus.OK, data };
  }

  @Post()
  @UseGuards(AreaViewGuard({ blockPartner: true, allowedAreas: [8] }))
  async create(@Body() dto: GapAnalysisAuditDTO) {
    const data = await this.service.create(dto);
    return { statusCode: HttpStatus.CREATED, data };
  }

  @Post('batch')
  @UseGuards(AreaViewGuard({ blockPartner: true, allowedAreas: [8] }))
  @HttpCode(HttpStatus.CREATED)
  async createMany(@Body() dto: CreateManyGapAnalysisAuditDTO) {
    const result = await this.service.createMany(dto.items);
    return { statusCode: HttpStatus.CREATED, data: result };
  }

  @Patch(':id')
  @UseGuards(AreaViewGuard({ blockPartner: true, allowedAreas: [8] }))
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: GapAnalysisAuditDTO,
  ) {
    const data = await this.service.update(id, dto);
    return { statusCode: HttpStatus.OK, data };
  }

  @Delete(':id')
  @UseGuards(AreaViewGuard({ blockPartner: true, allowedAreas: [8] }))
  async delete(@Param('id', ParseIntPipe) id: number) {
    const data = await this.service.delete(id);
    return { statusCode: HttpStatus.OK, data };
  }
}
