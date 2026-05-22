import { ForecastSnapshotService } from 'src/application/usecases/forecastSnapshot.service';
import { TotalPermissionGuard } from 'src/core/guards/totalPermission.guard';

import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import {
  CreateForecastSnapshotDTO,
  GetSnapshotsQueryDto,
} from '../dtos/forecastSnapshotDTO';

@Controller('forecast')
export class ForecastController {
  constructor(private forecastSnapshotService: ForecastSnapshotService) {}

  @Get('snapshot/:id')
  async getSnapshotById(@Param('id') id: number) {
    const snapshot = await this.forecastSnapshotService.get(id);

    return {
      statusCode: HttpStatus.OK,
      message: 'Retornado dados do forecast',
      data: snapshot,
    };
  }

  @Get('snapshot')
  async getAllSnapshots(@Query() query: GetSnapshotsQueryDto) {
    const snapshots = await this.forecastSnapshotService.getAll(query);

    return {
      statusCode: HttpStatus.OK,
      data: snapshots,
    };
  }

  @Post('snapshot')
  @UseGuards(TotalPermissionGuard)
  async saveForecastSnapshot(@Body() data: CreateForecastSnapshotDTO) {
    const snapshot = await this.forecastSnapshotService.execute(data);

    return {
      statusCode: HttpStatus.CREATED,
      message: 'Snapshot do forecast salvo com sucesso',
      data: snapshot,
    };
  }

  @Delete('snapshot/:id')
  @UseGuards(TotalPermissionGuard)
  async deleteForecastSnapshot(@Param('id') id: number) {
    await this.forecastSnapshotService.delete(id);

    return {
      statusCode: HttpStatus.CREATED,
      message: 'Snapshot do forecast deletado com sucesso',
    };
  }
}
