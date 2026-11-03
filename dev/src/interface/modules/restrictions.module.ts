import { Module } from '@nestjs/common';

import { RestrictionsService } from 'src/application/usecases/restrictions.service';
import { RESTRICTIONS_REPOSITORY } from 'src/domain/contracts/IRestrictionsRepository';
import { RestrictionsRepository } from 'src/infra/repositories/restrictionsRepository';
import { RestrictionController } from '../controllers/restrictions.controller';
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
  exports: [RestrictionsService],
})
export class RestrictionsModule {}
