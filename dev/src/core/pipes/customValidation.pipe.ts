import { ValidationPipe, ValidationPipeOptions } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { DISABLE_WHITELIST_KEY } from 'src/shared/costants';

export class CustomValidationPipe extends ValidationPipe {
  constructor(
    private readonly reflector: Reflector,
    private readonly validationOptions?: ValidationPipeOptions,
  ) {
    super(validationOptions);
  }

  async transform(value: any, metadata: any) {
    const disableWhitelist = this.reflector.get<boolean>(
      DISABLE_WHITELIST_KEY,
      metadata?.metatype,
    );

    if (disableWhitelist) {
      const pipeWithoutWhitelist = new ValidationPipe({
        ...this.validationOptions,
        whitelist: false,
        transform: true,
        forbidNonWhitelisted: false,
      });

      return pipeWithoutWhitelist.transform(value, metadata);
    }

    return super.transform(value, metadata);
  }
}
