// custom-validation.pipe.ts
import { ValidationPipe, ValidationPipeOptions } from '@nestjs/common';

export class CustomValidationPipe extends ValidationPipe {
  options: ValidationPipeOptions;
  constructor(options?: ValidationPipeOptions) {
    super(options);
  }

  async transform(value: any, metadata: any) {
    // Lista de DTOs que devem ignorar whitelist
    const noWhitelistDTOs = [
      'UpdateSchedulesDataDTO',
      'UpdateExecutionReportDTO',
    ];

    if (
      metadata?.metatype?.name &&
      noWhitelistDTOs.includes(metadata.metatype.name)
    ) {
      const pipeWithoutWhitelist = new ValidationPipe({
        ...this.options,
        whitelist: false,
        forbidNonWhitelisted: false,
      });
      return pipeWithoutWhitelist.transform(value, metadata);
    }

    return super.transform(value, metadata);
  }
}
