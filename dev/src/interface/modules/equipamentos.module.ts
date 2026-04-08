import { Module } from '@nestjs/common';

import { EquipamentosService } from 'src/application/equipamentos.service';
import { EQUIPAMENTOS_REPOSITORY } from 'src/domain/repositories/IEquipamentosRepository';
import { EquipamentosRepository } from 'src/infra/repositories/equipamentosRepository';
import { EquipamentosController } from '../controllers/equipamentos.controller';
import { UsersModule } from './users.module';

@Module({
  imports: [UsersModule],
  controllers: [EquipamentosController],
  providers: [
    EquipamentosService,
    { provide: EQUIPAMENTOS_REPOSITORY, useClass: EquipamentosRepository },
  ],
})
export class EquipamentosModule {}
