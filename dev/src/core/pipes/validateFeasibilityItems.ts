// pipes/validate-items.pipe.ts
import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ServiceMaterialItemDto } from 'src/interface/dtos/workServicesDTO';

@Injectable()
export class ValidateFeasibilityItemsPipe implements PipeTransform {
  async transform(value: string) {
    let parsed: any[];

    try {
      parsed = JSON.parse(value);
    } catch {
      throw new BadRequestException('Formato JSON inválido para "items"');
    }

    if (!Array.isArray(parsed)) {
      throw new BadRequestException('"items" precisa ser um array');
    }

    const instances = plainToInstance(ServiceMaterialItemDto, parsed);
    for (const item of instances) {
      const errors = await validate(item);
      if (errors.length > 0) {
        throw new BadRequestException(
          `Item inválido: ${JSON.stringify(errors)}`,
        );
      }
    }

    return instances;
  }
}
