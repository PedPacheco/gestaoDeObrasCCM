// import { BadRequestException, Inject, Injectable } from '@nestjs/common';
// import {
//   IUpdateRestrictionsRepository,
//   UPDATE_RESTRICTIONS_REPOSITORY,
// } from 'src/domain/repositories/schedule/IUpdateRestrictionsRepository';
// import { UpdateRestrictionsDTO } from 'src/interface/dtos/scheduleDTO';

// @Injectable()
// export class UpdateRestrictionsService {
//   constructor(
//     @Inject(UPDATE_RESTRICTIONS_REPOSITORY)
//     private readonly updateRestrictionsRepository: IUpdateRestrictionsRepository,
//   ) {}

//   async update(data: UpdateRestrictionsDTO) {
//     if (!data.id) {
//       throw new BadRequestException();
//     }

//     await this.updateRestrictionsRepository.update(data);
//   }
// }
