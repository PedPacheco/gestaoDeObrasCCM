import { Module } from '@nestjs/common';

import { UsersModule } from './users.module';
import { EquipmentController } from '../controllers/equipment.controller';
import { EquipmentService } from 'src/application/usecases/equipment.service';
import { EQUIPMENT_REPOSITORY } from 'src/domain/contracts/IEquipmentRepository';
import { EquipmentRepository } from 'src/infra/repositories/equipmentRepository';

@Module({
  imports: [UsersModule],
  controllers: [EquipmentController],
  providers: [
    EquipmentService,
    { provide: EQUIPMENT_REPOSITORY, useClass: EquipmentRepository },
  ],
})
export class EquipmentsModule {}
