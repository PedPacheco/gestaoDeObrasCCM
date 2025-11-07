import {
  Controller,
  Get,
  HttpStatus,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ErrorsReportService } from 'src/application/errorsReport.service';
import { PermissionGuard } from 'src/core/guards/permission.guard';

@Controller('relatorio-erros')
export class ErrorsReportController {
  constructor(private readonly errorsReportService: ErrorsReportService) {}

  @Get('itens-nao-definidos')
  @UseGuards(PermissionGuard)
  async searchWorksWithUndefiendItens(
    @Query('idRegional', new ParseIntPipe({ optional: true }))
    idRegional?: number,
  ) {
    const response =
      await this.errorsReportService.findUndefinedItems(idRegional);

    return {
      statusCode: HttpStatus.OK,
      message: 'Retornados obras com itens não definidos',
      data: response,
    };
  }

  @Get('programacao')
  @UseGuards(PermissionGuard)
  async getWorksWithScheduleError(
    @Query('idRegional', new ParseIntPipe({ optional: true }))
    idRegional?: number,
  ) {
    const response =
      await this.errorsReportService.findScheduleError(idRegional);

    console.log(response.length);

    return {
      statusCode: HttpStatus.OK,
      message: 'Retornados obras com erros na programção',
      data: response,
    };
  }
}
