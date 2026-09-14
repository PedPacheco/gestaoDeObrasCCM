import { IContractUpdateRepository } from 'src/domain/contracts/works/IContractUpdateRepository';
import { ContractUpdateRepositoryInput } from 'src/domain/types';
import { PrismaService } from 'src/infra/prisma/prisma.service';

import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class ContractUpdateRepository implements IContractUpdateRepository {
  private readonly logger = new Logger(ContractUpdateRepository.name);
  constructor(private readonly prisma: PrismaService) {}

  async update(data: ContractUpdateRepositoryInput[]): Promise<void> {
    await this.prisma.$transaction(
      data.map((work) => {
        return this.prisma.obras.updateMany({
          where: {
            ovnota: work.ovnota.trim(),
            [work.ordemField]: work.ordemDiagrama.trim(),
          },
          data: {
            data_empreitamento: work.dataEmpreitamento,
            id_status: 45,
          },
        });
      }),
    );
  }
}
