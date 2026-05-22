import { Module } from '@nestjs/common';

import { ForecastSnapshotService } from 'src/application/usecases/forecastSnapshot.service';
import { FORECAST_SNAPSHOT } from 'src/domain/repositories/IForecastSnapshotRepository';
import { ForecastSnapshotRepository } from 'src/infra/repositories/schedule/forecastSnapshotRepository';
import { ForecastController } from '../controllers/forecast.controller';
import { UsersModule } from './users.module';

@Module({
  imports: [UsersModule],
  controllers: [ForecastController],
  providers: [
    ForecastSnapshotService,
    { provide: FORECAST_SNAPSHOT, useClass: ForecastSnapshotRepository },
  ],
  exports: [],
})
export class ForecastModule {}
