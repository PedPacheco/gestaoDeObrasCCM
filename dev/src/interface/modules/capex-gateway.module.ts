import { Module } from '@nestjs/common';
import { CapexGateway } from '../gateway/capex/capex.gateway';

/**
 * Módulo compartilhado responsável apenas pelo gateway de CAPEX.
 *
 * Importado tanto por AuxiliaryBaseModule quanto por WorksModule,
 * evitando duplicação de providers e garantindo que ambos os fluxos
 * compartilhem a mesma instância do gateway (e portanto do servidor WS).
 */
@Module({
  providers: [CapexGateway],
  exports: [CapexGateway],
})
export class CapexGatewayModule {}
