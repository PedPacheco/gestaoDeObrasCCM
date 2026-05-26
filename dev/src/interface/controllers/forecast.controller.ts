import { ForecastSnapshotService } from 'src/application/usecases/forecastSnapshot.service';

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
import {
  AreaEditGuard,
  AreaViewGuard,
} from 'src/core/guards/newPermission.guard';

@Controller('forecast')
export class ForecastController {
  constructor(private forecastSnapshotService: ForecastSnapshotService) {}

  @Get('snapshot/:id')
  @UseGuards(AreaViewGuard({ allowedAreas: [8, 2], blockPartner: true }))
  async getSnapshotById(@Param('id') id: number) {
    const snapshot = await this.forecastSnapshotService.get(id);

    return {
      statusCode: HttpStatus.OK,
      message: 'Retornado dados do forecast',
      data: snapshot,
    };
  }

  @Get('snapshot')
  @UseGuards(AreaViewGuard({ allowedAreas: [8, 2], blockPartner: true }))
  async getAllSnapshots(@Query() query: GetSnapshotsQueryDto) {
    const snapshots = await this.forecastSnapshotService.getAll(query);

    return {
      statusCode: HttpStatus.OK,
      data: snapshots,
    };
  }

  @Post('snapshot')
  @UseGuards(AreaEditGuard({ adminOnly: true }))
  async saveForecastSnapshot(@Body() data: CreateForecastSnapshotDTO) {
    const snapshot = await this.forecastSnapshotService.execute(data);

    return {
      statusCode: HttpStatus.CREATED,
      message: 'Snapshot do forecast salvo com sucesso',
      data: snapshot,
    };
  }

  @Delete('snapshot/:id')
  @UseGuards(AreaEditGuard({ adminOnly: true }))
  async deleteForecastSnapshot(@Param('id') id: number) {
    await this.forecastSnapshotService.delete(id);

    return {
      statusCode: HttpStatus.CREATED,
      message: 'Snapshot do forecast deletado com sucesso',
    };
  }
}
