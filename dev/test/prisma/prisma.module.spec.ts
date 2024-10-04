import { Test } from '@nestjs/testing';
import { PrismaModule } from 'src/config/prisma/prisma.module';
import { PrismaService } from 'src/config/prisma/prisma.service';

describe('PrismaModule', () => {
  let prismaService: PrismaService;

  beforeEach(async () => {
    jest.resetAllMocks();

    const moduleRef = await Test.createTestingModule({
      imports: [PrismaModule],
    }).compile();

    prismaService = moduleRef.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(prismaService).toBeDefined();
  });
});
