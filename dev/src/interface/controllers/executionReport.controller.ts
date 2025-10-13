import { ExecutionReportService } from 'src/application/executionReport.service';

import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  UseGuards,
} from '@nestjs/common';

import { PermissionGuard } from 'src/core/guards/permission.guard';
import { ExecutionReportDataDTO } from '../dtos/executionReportDTO';

@Controller('relatorio-execucao')
export class ExecutionReportController {
  constructor(private executionReportService: ExecutionReportService) {}

  @Get(':id')
  async findByWorkId(@Param('id', ParseIntPipe) idWork: number): Promise<any> {
    const response = await this.executionReportService.findByWorkId(idWork);

    return {
      statusCode: HttpStatus.OK,
      message: 'Relatórios de execução retornados com sucesso',
      data: response,
    };
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) idExecutionReport: number,
    @Body() data: ExecutionReportDataDTO,
  ): Promise<any> {
    await this.executionReportService.update(idExecutionReport, data);

    return {
      statusCode: HttpStatus.NO_CONTENT,
      message: 'Atualização do relatório feita com sucesso',
    };
  }

  @Delete(':id')
  @UseGuards(PermissionGuard)
  async delete(@Param('id', ParseIntPipe) id: number): Promise<any> {
    await this.executionReportService.delete(id);

    return {
      statusCode: HttpStatus.NO_CONTENT,
      message: 'Relatório excluído com sucesso',
    };
  }
}
