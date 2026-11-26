import { Module } from '@nestjs/common';
import { CapexGateway } from '../gateway/capex/capex.gateway';

/**
 * Módulo compartilhado responsável apenas pelo gateway de CAPEX.
 *
 * Importado pelo CapexModule. Requer um JwtService disponível (o JwtModule é
 * global no AppModule); em testes de módulo, registre-o com global: true.
 */
@Module({
  providers: [CapexGateway],
  exports: [CapexGateway],
})
export class CapexGatewayModule {}
