import { Module } from '@nestjs/common';

import { UsersModule } from './users.module';
import { AdvancePartnerController } from '../controllers/advancePartner.controller';
import { ADVANCE_PARTNER_REPOSITORY } from 'src/domain/contracts/IAdvancePartnerRepository';
import { AdvancePartnerRepository } from 'src/infra/repositories/advancePartnerRepository';
import { AdvancePartnerService } from 'src/application/usecases/advancePartner.service';

@Module({
  imports: [UsersModule],
  controllers: [AdvancePartnerController],
  providers: [
    AdvancePartnerService,
    {
      provide: ADVANCE_PARTNER_REPOSITORY,
      useClass: AdvancePartnerRepository,
    },
  ],
  exports: [AdvancePartnerService],
})
export class AdvancePartnerModule {}
