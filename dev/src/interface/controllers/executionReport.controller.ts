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
} from '@nestjs/common';

import { UpdateExecutionReportDTO } from '../dtos/executionReportDTO';

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
    @Body() data: UpdateExecutionReportDTO,
  ): Promise<any> {
    await this.executionReportService.update(idExecutionReport, data);

    return {
      statusCode: HttpStatus.NO_CONTENT,
      message: 'Atualização do relatório feita com sucesso',
    };
  }

  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number): Promise<any> {
    await this.executionReportService.delete(id);

    return {
      statusCode: HttpStatus.NO_CONTENT,
      message: 'Relatório excluído com sucesso',
    };
  }
}
