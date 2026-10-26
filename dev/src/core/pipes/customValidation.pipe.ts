import { ValidationPipe, ValidationPipeOptions } from '@nestjs/common';

const NO_WHITELIST_DTOS = [
  'UpdateSchedulesDataDTO',
  'UpdateExecutionReportDTO',
  'FinalizeServicesDTO',
];

export class CustomValidationPipe extends ValidationPipe {
  private readonly noWhitelistPipe: ValidationPipe;

  constructor(options?: ValidationPipeOptions) {
    super(options);
    this.noWhitelistPipe = new ValidationPipe({
      ...options,
      whitelist: false,
      transform: true,
      forbidNonWhitelisted: false,
    });
  }

  async transform(value: any, metadata: any) {
    const dtoName = metadata?.metatype?.name;

    if (dtoName && NO_WHITELIST_DTOS.includes(dtoName)) {
      return this.noWhitelistPipe.transform(value, metadata);
    }

    return super.transform(value, metadata);
  }
}
