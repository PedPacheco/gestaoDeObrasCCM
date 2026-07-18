import { ValidationPipe, ValidationPipeOptions } from '@nestjs/common';

export class CustomValidationPipe extends ValidationPipe {
  private readonly options: ValidationPipeOptions;

  constructor(options?: ValidationPipeOptions) {
    super(options);
    this.options = options;
  }

  async transform(value: any, metadata: any) {
    const noWhitelistDTOs = [
      'UpdateSchedulesDataDTO',
      'UpdateExecutionReportDTO',
      'FinalizeServicesDTO',
    ];

    if (
      metadata?.metatype?.name &&
      noWhitelistDTOs.includes(metadata.metatype.name)
    ) {
      const pipeWithoutWhitelist = new ValidationPipe({
        ...this.options, // ✅ agora existe
        whitelist: false,
        transform: true,
        forbidNonWhitelisted: false,
      });

      return pipeWithoutWhitelist.transform(value, metadata);
    }

    return super.transform(value, metadata);
  }
}
