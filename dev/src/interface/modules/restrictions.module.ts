import { Module } from '@nestjs/common';

import { RestrictionController } from '../controllers/restrictions.controller';
import { RestrictionsService } from 'src/application/restrictions.service';
import { RESTRICTIONS_REPOSITORY } from 'src/domain/repositories/IRestrictionsRepository';
import { RestrictionsRepository } from 'src/infra/repositories/restrictionsRepository';
import { UsersModule } from './users.module';

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
  exports: [],
})
export class RestrictionsModule {}
