import { ExecutionReportService } from 'src/domain/services/executionReport.service';

import {
  Controller,
  Get,
  HttpStatus,
  Param,
  ParseIntPipe,
} from '@nestjs/common';

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
}
