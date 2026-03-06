import { ExecutionReportService } from 'src/application/services/executionReport.service';
import { PermissionGuard } from 'src/core/guards/permission.guard';

import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Req,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';

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
  @UseGuards(PermissionGuard)
  @UseInterceptors(FilesInterceptor('files'))
  async update(
    @Req() req: any,
    @Param('id', ParseIntPipe) idExecutionReport: number,
    @Body() data: UpdateExecutionReportDTO,
    @UploadedFiles() files?: Express.Multer.File[],
  ): Promise<any> {
    const idUser = req.user.id;

    await this.executionReportService.update(
      idExecutionReport,
      { ...data.executionReportData, idUser },
      files,
    );

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
