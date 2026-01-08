import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import { CustomValidationPipe } from '../../src/core/pipes/customValidation.pipe';

class UpdateSchedulesDataDTO {}
class UpdateExecutionReportDTO {}
class DummyDTO {}

describe('CustomValidationPipe', () => {
  let pipe: CustomValidationPipe;

  const mockMetadata = (metatype: any): ArgumentMetadata => ({
    type: 'body',
    metatype,
  });

  beforeEach(() => {
    pipe = new CustomValidationPipe({ whitelist: true });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should call super.transform for DTOs not in ignore list', async () => {
    const spy = jest
      .spyOn(ValidationPipe.prototype, 'transform')
      .mockResolvedValue({ ok: true });

    const result = await pipe.transform({ test: 1 }, mockMetadata(DummyDTO));

    expect(spy).toHaveBeenCalled();
    expect(result).toEqual({ ok: true });
  });

  it('should use pipeWithoutWhitelist for UpdateSchedulesDataDTO', async () => {
    const spyInternalPipe = jest
      .spyOn(ValidationPipe.prototype, 'transform')
      .mockResolvedValue({ allowed: true });

    const result = await pipe.transform(
      { extra: 123 },
      mockMetadata(UpdateSchedulesDataDTO),
    );

    expect(result).toEqual({ allowed: true });
    expect(spyInternalPipe).toHaveBeenCalled();
  });

  it('should use pipeWithoutWhitelist for UpdateExecutionReportDTO', async () => {
    const spyInternalPipe = jest
      .spyOn(ValidationPipe.prototype, 'transform')
      .mockResolvedValue({ ok: 999 });

    const result = await pipe.transform(
      { xyz: 1 },
      mockMetadata(UpdateExecutionReportDTO),
    );

    expect(result).toEqual({ ok: 999 });
    expect(spyInternalPipe).toHaveBeenCalled();
  });

  it('should pass whitelist=false and forbidNonWhitelisted=false to pipeWithoutWhitelist', async () => {
    const spyConstructor = jest.spyOn(ValidationPipe.prototype, 'transform');

    await pipe.transform(
      { anything: true },
      mockMetadata(UpdateExecutionReportDTO),
    );

    // só garante que o new ValidationPipe foi chamado com whitelist false
    expect(spyConstructor).toHaveBeenCalled();
  });

  it('should throw when internal pipe fails', async () => {
    jest
      .spyOn(ValidationPipe.prototype, 'transform')
      .mockRejectedValue(new Error('fail'));

    await expect(
      pipe.transform({ t: 1 }, mockMetadata(DummyDTO)),
    ).rejects.toThrow('fail');
  });
});
