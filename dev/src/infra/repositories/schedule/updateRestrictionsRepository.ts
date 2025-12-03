// import { Injectable } from '@nestjs/common';
// import { IUpdateRestrictionsRepository } from 'src/domain/repositories/schedule/IUpdateRestrictionsRepository';
// import { PrismaService } from 'src/infra/prisma/prisma.service';
// import { UpdateRestrictionsDTO } from 'src/interface/dtos/scheduleDTO';

// @Injectable()
// export class UpdateRestrictionsRepository
//   implements IUpdateRestrictionsRepository
// {
//   constructor(private readonly prisma: PrismaService) {}

//   async update(data: UpdateRestrictionsDTO): Promise<void> {
//     await this.prisma.programacoes.update({
//       where: { id: data.id },
//       data: {
//         id_restricao_prog1: data.idProgRestriction1,
//         id_restricao_prog2: data.idProgRestriction2,
//         responsabilidade1: data.responsiblityProg,
//         responsabilidade2: data.responsiblityProg2,
//         nome_responsavel: data.responsibleName,
//         nome_responsavel2: data.responsibleName2,
//         area_responsavel1: data.responsibleArea,
//         area_responsavel2: data.responsibleArea2,
//         status_restricao1: data.restrictionStatus,
//         status_restricao2: data.restrictionStatus2,
//         data_resolucao1: data.resolutionDate,
//         data_resolucao2: data.resolutionDate2,
//       },
//     });
//   }
// }
