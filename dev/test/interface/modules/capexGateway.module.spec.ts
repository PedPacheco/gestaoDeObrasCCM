import { CapexGatewayModule } from 'src/interface/modules/capex-gateway.module';

import { JwtModule } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { CapexGateway } from 'src/interface/gateway/capex/capex.gateway';

describe('CapexGatewayModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [
        // o CapexGateway precisa de JwtService (JwtModule é global no AppModule)
        JwtModule.register({ global: true, secret: 'test-secret' }),
        CapexGatewayModule,
      ],
    }).compile();
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });

  it('should provide CapexGateway', () => {
    expect(module.get(CapexGateway)).toBeInstanceOf(CapexGateway);
  });
});
