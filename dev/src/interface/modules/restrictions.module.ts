import { Module } from '@nestjs/common';

import { RestrictionController } from '../controllers/restrictions.controller';
import { RESTRICTIONS_REPOSITORY } from 'src/domain/repositories/IRestrictionsRepository';
import { RestrictionsRepository } from 'src/infra/repositories/restrictionsRepository';
import { UsersModule } from './users.module';
import { RestrictionsService } from 'src/application/usecases/restrictions.service';

@Module({
  imports: [UsersModule],
  controllers: [RestrictionController],
  providers: [
    RestrictionsService,
    {
      provide: RESTRICTIONS_REPOSITORY,
      useClass: RestrictionsRepository,
    },
  ],
  exports: [RestrictionsService],
})
export class RestrictionsModule {}
