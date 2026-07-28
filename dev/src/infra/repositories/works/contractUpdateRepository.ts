import { Injectable, Logger } from '@nestjs/common';
import {
  ContractUpdateRepositoryInterface,
  IContractUpdateRepository,
} from 'src/domain/repositories/works/IContractUpdateRepository';
import { PrismaService } from 'src/infra/prisma/prisma.service';

@Injectable()
export class ContractUpdateRepository implements IContractUpdateRepository {
  private readonly logger = new Logger(ContractUpdateRepository.name);
  constructor(private readonly prisma: PrismaService) {}

  async update(data: ContractUpdateRepositoryInterface[]): Promise<void> {
    try {
      await this.prisma.$transaction(
        data.map((work) => {
          return this.prisma.obras.updateMany({
            where: {
              ovnota: work.ovnota.trim(),
              [work.ordemField]: work.ordemDiagrama.trim(),
            },
            data: {
              data_empreitamento: work.dataEmpreitamento,
              id_status: 1,
            },
          });
        }),
      );
    } catch (error: any) {
      this.logger.error(
        `Erro ao atualizar contratos. Payload: ${JSON.stringify(data)}`,
        error.stack,
      );
      throw error;
    }
  }
}
