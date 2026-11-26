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
} from '@nestjs/common';

import { GapAnalysisAuditService } from 'src/application/usecases/gap-analysis-audit.service';
import {
  CreateGapAnalysisAuditDTO,
  CreateManyGapAnalysisAuditDTO,
  UpdateGapAnalysisAuditDTO,
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
  async create(@Body() dto: CreateGapAnalysisAuditDTO) {
    const data = await this.service.create(dto);
    return { statusCode: HttpStatus.CREATED, data };
  }

  @Post('batch')
  @HttpCode(HttpStatus.CREATED)
  async createMany(@Body() dto: CreateManyGapAnalysisAuditDTO) {
    const result = await this.service.createMany(dto.items);
    return { statusCode: HttpStatus.CREATED, data: result };
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateGapAnalysisAuditDTO,
  ) {
    const data = await this.service.update(id, dto);
    return { statusCode: HttpStatus.OK, data };
  }

  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number) {
    const data = await this.service.delete(id);
    return { statusCode: HttpStatus.OK, data };
  }
}
