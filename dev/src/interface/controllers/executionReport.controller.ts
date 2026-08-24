import { ExecutionReportService } from 'src/application/usecases/executionReport.service';

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
import {
  AreaEditGuard,
  AreaViewGuard,
} from 'src/core/guards/newPermission.guard';

@Controller('relatorio-execucao')
export class ExecutionReportController {
  constructor(private executionReportService: ExecutionReportService) {}

  @Get(':id')
  @UseGuards(AreaViewGuard())
  async findByWorkId(@Param('id', ParseIntPipe) idWork: number): Promise<any> {
    const response = await this.executionReportService.findByWorkId(idWork);

    return {
      statusCode: HttpStatus.OK,
      message: 'Relatórios de execução retornados com sucesso',
      data: response,
    };
  }

  @Patch(':id')
  @UseInterceptors(FilesInterceptor('files'))
  @UseGuards(AreaEditGuard({ allowedAreas: [8] }))
  async update(
    @Req() req: any,
    @Param('id', ParseIntPipe) idExecutionReport: number,
    @Body() data: UpdateExecutionReportDTO,
    @UploadedFiles() files?: Express.Multer.File[],
  ): Promise<any> {
    const { id: userId } = req.user;

    await this.executionReportService.update(
      idExecutionReport,
      { ...data.executionReportData, userId },
      files,
    );

    return {
      statusCode: HttpStatus.NO_CONTENT,
      message: 'Atualização do relatório feita com sucesso',
    };
  }

  @Delete(':id')
  @UseGuards(AreaEditGuard({ allowedAreas: [8], blockPartner: true }))
  async delete(@Param('id', ParseIntPipe) id: number): Promise<any> {
    await this.executionReportService.delete(id);

    return {
      statusCode: HttpStatus.NO_CONTENT,
      message: 'Relatório excluído com sucesso',
    };
  }
}
