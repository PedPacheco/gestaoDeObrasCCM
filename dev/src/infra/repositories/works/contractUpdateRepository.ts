import { IContractUpdateRepository } from 'src/domain/repositories/works/IContractUpdateService';
import { PrismaService } from 'src/infra/prisma/prisma.service';

export class ContractUpdateRepository implements IContractUpdateRepository {
  constructor(private readonly prisma: PrismaService) {}

  async update(data: any[]): Promise<any> {
    return await this.prisma.$transaction(
      return data.map((work) => {
        this.prisma.obras.updateMany({
          where: { ovnota: work.ovnota },
        });
      }),
    );
  }
}
