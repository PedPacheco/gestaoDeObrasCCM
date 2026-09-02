import { Module } from '@nestjs/common';

import { UsersModule } from './users.module';
import { AdvancePartnerController } from '../controllers/advancePartner.controller';
import { ADVANCE_PARTNER_REPOSITORY } from 'src/domain/repositories/IAdvancePartnerRepository';
import { AdvancePartnerRepository } from 'src/infra/repositories/advancePartnerRepository';
import { AdvancePartnerService } from 'src/application/usecases/advancePartner/advancePartner.service';
import { GetAdvancePartnerIndicatorsService } from 'src/application/usecases/advancePartner/getAdvancePartnerIndicators.service';

@Module({
  imports: [UsersModule],
  controllers: [AdvancePartnerController],
  providers: [
    AdvancePartnerService,
    GetAdvancePartnerIndicatorsService,
    {
      provide: ADVANCE_PARTNER_REPOSITORY,
      useClass: AdvancePartnerRepository,
    },
  ],
  exports: [AdvancePartnerService],
})
export class AdvancePartnerModule {}
