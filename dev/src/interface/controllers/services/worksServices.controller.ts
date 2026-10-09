import { memoryStorage } from 'multer';
import { ImportServicesSpreadsheetService } from 'src/application/usecases/services/importServicesSpreadsheet.service';
import { WorksServicesService } from 'src/application/usecases/services/worksServices.service';

import {
  Body,
  Controller,
  Delete,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

import {
  AddServicesDTO,
  ApplyAdditonalDTO,
  ScheduleServicesDTO,
} from '../../dtos/workServicesDTO';
import { AreaEditGuard } from 'src/core/guards/newPermission.guard';

@Controller('servicos')
export class ServicesController {
  constructor(
    private readonly worksServicesService: WorksServicesService,
    private readonly importServicesService: ImportServicesSpreadsheetService,
  ) {}

  @Patch('cancelar/:id')
  @UseGuards(AreaEditGuard({ allowedAreas: [8] }))
  async cancelScheduleService(@Param('id', ParseIntPipe) id: number) {
    await this.worksServicesService.cancelServices(id);

    return {
      statusCode: HttpStatus.OK,
      message: 'Programação dos serviços foi cancelada',
    };
  }

  @Patch('programar/:id')
  @UseGuards(AreaEditGuard({ allowedAreas: [8] }))
  async scheduleServices(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: ScheduleServicesDTO[],
  ) {
    await this.worksServicesService.scheduleServices(id, data);

    return {
      statusCode: HttpStatus.OK,
      message: 'Serviços programados com sucesso',
    };
  }

  @Patch('aplicar-adicional/:id')
  @UseGuards(AreaEditGuard({ allowedAreas: [8] }))
  async applyAdditional(
    @Param('id', ParseIntPipe) workId: number,
    @Body() data: ApplyAdditonalDTO[],
  ) {
    await this.worksServicesService.applyAdditional(workId, data);

    return {
      statusCode: HttpStatus.OK,
      message: 'Aplicado adicional no serviço',
    };
  }

  @Post('servico')
  @UseGuards(AreaEditGuard({ allowedAreas: [8] }))
  async addServices(@Body() data: AddServicesDTO) {
    await this.worksServicesService.addItem(data, 'service');

    return {
      statusCode: HttpStatus.OK,
      message: 'Serviços realizados com sucesso',
    };
  }

  @Post('material')
  @UseGuards(AreaEditGuard({ allowedAreas: [8] }))
  async addMaterials(@Body() data: AddServicesDTO) {
    await this.worksServicesService.addItem(data, 'material');

    return {
      statusCode: HttpStatus.OK,
      message: 'Serviços realizados com sucesso',
    };
  }

  @Post('familia')
  @UseGuards(AreaEditGuard({ allowedAreas: [8] }))
  async addFamily(@Body() data: AddServicesDTO) {
    const type = data.type === 'S' ? 'service' : 'material';

    await this.worksServicesService.addItem(data, type);

    return {
      statusCode: HttpStatus.OK,
      message: 'Serviços realizados com sucesso',
    };
  }

  @Post('importar/:id')
  @UseGuards(AreaEditGuard({ allowedAreas: [8], blockPartner: true }))
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  async importServices(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const response = await this.importServicesService.importFromSpreadsheet(
      id,
      file,
    );

    return {
      statusCode: HttpStatus.OK,
      message: 'Planilha processada',
      data: response, // { imported, errors }
    };
  }

  @Delete('todos/:id')
  @UseGuards(AreaEditGuard({ allowedAreas: [8], blockPartner: true }))
  async deleteAllServices(@Param('id', ParseIntPipe) workId: number) {
    await this.worksServicesService.deleteAll(workId);

    return {
      statusCode: HttpStatus.OK,
      message: 'Serviços/Materiais excluídos com sucesso',
    };
  }

  @Delete('/:id')
  @UseGuards(AreaEditGuard({ allowedAreas: [8], blockPartner: true }))
  async deleteMaterialAndService(
    @Param('id', ParseIntPipe) id: number,
    @Query('workId', ParseIntPipe) workId: number,
  ) {
    await this.worksServicesService.delete(id, workId);

    return {
      statusCode: HttpStatus.OK,
      message: 'Serviço/Material excluído com sucesso',
    };
  }
}
