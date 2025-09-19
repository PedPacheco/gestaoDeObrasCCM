import {
  Controller,
  Get,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import { GetServicesByWorkIdService } from 'src/application/services/getServicesByWorkId.service';

@Controller('servicos')
export class ServicesController {
  constructor(
    private readonly getServicesByWorkIdService: GetServicesByWorkIdService,
  ) {}

  @Get(':id')
  async getServicesByWorkId(@Param('id', ParseIntPipe) id: number) {
    await this.getServicesByWorkIdService.get(id);

    return {
      statusCode: HttpStatus.OK,
      message: 'Programação excluída com sucesso',
    };
  }

  @Get('filtros')
  async getServiceFilters() {}

  @Get('programados')
  async getScheduledServices() {}

  @Get('historico')
  async getScheduleHistory() {}

  @Post('adicionar')
  async addServices() {}
}
