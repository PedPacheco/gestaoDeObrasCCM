import { Module } from '@nestjs/common';
import { ComplaintsAndOmbudsmansOfficeController } from '../controllers/complaintsAndOmbudsmansOffice.controller';
import { ComplaintsAndOmbudsmansOfficeService } from 'src/application/usecases/complaintsAndOmbudsmansOffice.service';
import { COMPLAINTS_AND_OMBUDSMANS_OFFICE_REPOSITORY } from 'src/domain/repositories/IComplaintsAndOmbudsmansOfficeRepository';
import { ComplaintsAndOmbudsmansOfficeRepository } from 'src/infra/repositories/complaintsAndOmbudsmansRepository';

@Module({
  controllers: [ComplaintsAndOmbudsmansOfficeController],
  providers: [
    ComplaintsAndOmbudsmansOfficeService,
    {
      provide: COMPLAINTS_AND_OMBUDSMANS_OFFICE_REPOSITORY,
      useClass: ComplaintsAndOmbudsmansOfficeRepository,
    },
  ],
})
export class complaintsAndOmbudsmansOfficeModule {}
