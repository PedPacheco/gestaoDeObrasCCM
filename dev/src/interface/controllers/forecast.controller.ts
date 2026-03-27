import { ForecastSnapshotService } from 'src/application/usecases/schedule/forecastSnapshot.service';
import { VisualizationGuard } from 'src/core/guards/visualization.guard';

import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';

import { CreateForecastSnapshotDTO } from '../dtos/forecastSnapshotDTO';

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
  async getAllSnapshots() {
    const snapshots = await this.forecastSnapshotService.getAll();

    return {
      statusCode: HttpStatus.OK,
      data: snapshots,
    };
  }

  @Post('snapshot')
  @UseGuards(VisualizationGuard)
  async saveForecastSnapshot(@Body() data: CreateForecastSnapshotDTO) {
    const snapshot = await this.forecastSnapshotService.execute(data);

    return {
      statusCode: HttpStatus.CREATED,
      message: 'Snapshot do forecast salvo com sucesso',
      data: snapshot,
    };
  }
}
