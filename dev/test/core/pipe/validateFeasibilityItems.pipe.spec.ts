import * as classTransformer from 'class-transformer';
import * as classValidator from 'class-validator';
import { ValidateFeasibilityItemsPipe } from 'src/core/pipes/validateFeasibilityItems.pipe';

import { BadRequestException } from '@nestjs/common';

describe('ValidateFeasibilityItemsPipe', () => {
  let pipe: ValidateFeasibilityItemsPipe;

  beforeEach(() => {
    pipe = new ValidateFeasibilityItemsPipe();
  });

  // ─── JSON PARSING ──────────────────────────────────────

  describe('JSON parsing', () => {
    it('should throw BadRequestException when value is not valid JSON', async () => {
      await expect(pipe.transform('{invalid')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw with correct message for invalid JSON', async () => {
      await expect(pipe.transform('not-json')).rejects.toThrow(
        'Formato JSON inválido para "items"',
      );
    });

    it('should throw BadRequestException for empty string', async () => {
      await expect(pipe.transform('')).rejects.toThrow(BadRequestException);
    });
  });

  // ─── ARRAY VALIDATION ─────────────────────────────────

  describe('array validation', () => {
    it('should throw BadRequestException when parsed value is an object', async () => {
      await expect(pipe.transform('{"id": 1}')).rejects.toThrow(
        '"items" precisa ser um array',
      );
    });

    it('should throw BadRequestException when parsed value is a string', async () => {
      await expect(pipe.transform('"hello"')).rejects.toThrow(
        '"items" precisa ser um array',
      );
    });

    it('should throw BadRequestException when parsed value is a number', async () => {
      await expect(pipe.transform('42')).rejects.toThrow(
        '"items" precisa ser um array',
      );
    });

    it('should throw BadRequestException when parsed value is null', async () => {
      await expect(pipe.transform('null')).rejects.toThrow(
        '"items" precisa ser um array',
      );
    });

    it('should throw BadRequestException when parsed value is a boolean', async () => {
      await expect(pipe.transform('true')).rejects.toThrow(
        '"items" precisa ser um array',
      );
    });
  });

  // ─── ITEM VALIDATION ──────────────────────────────────

  describe('item validation', () => {
    it('should throw BadRequestException when an item fails validation', async () => {
      const spy = jest.spyOn(classValidator, 'validate').mockResolvedValueOnce([
        {
          property: 'id',
          constraints: { isNotEmpty: 'id should not be empty' },
        },
      ] as any);

      await expect(pipe.transform('[{}]')).rejects.toThrow(BadRequestException);

      spy.mockRestore();
    });

    it('should include "Item inválido" in the error message for invalid items', async () => {
      const spy = jest.spyOn(classValidator, 'validate').mockResolvedValueOnce([
        {
          property: 'id',
          constraints: { isNotEmpty: 'id should not be empty' },
        },
      ] as any);

      await expect(pipe.transform('[{}]')).rejects.toThrow('Item inválido');

      spy.mockRestore();
    });

    it('should fail on the first invalid item without validating the rest', async () => {
      const spy = jest
        .spyOn(classValidator, 'validate')
        .mockResolvedValueOnce([
          { property: 'id', constraints: { isNotEmpty: 'required' } },
        ] as any);

      await expect(pipe.transform('[{}, {}]')).rejects.toThrow(
        BadRequestException,
      );

      // validate was called only once — it stopped at the first invalid item
      expect(spy).toHaveBeenCalledTimes(1);

      spy.mockRestore();
    });
  });

  // ─── HAPPY PATH ────────────────────────────────────────

  describe('happy path', () => {
    it('should return transformed instances when all items are valid', async () => {
      const mockInstances = [{ id: 1, quantidade: 10, valor: 100 }];

      const plainSpy = jest
        .spyOn(classTransformer, 'plainToInstance')
        .mockReturnValue(mockInstances as any);

      const validateSpy = jest
        .spyOn(classValidator, 'validate')
        .mockResolvedValue([]);

      const result = await pipe.transform(
        '[{"id": 1, "quantidade": 10, "valor": 100}]',
      );

      expect(result).toEqual(mockInstances);

      plainSpy.mockRestore();
      validateSpy.mockRestore();
    });

    it('should return an empty array when input is an empty array', async () => {
      const plainSpy = jest
        .spyOn(classTransformer, 'plainToInstance')
        .mockReturnValue([] as any);

      const result = await pipe.transform('[]');

      expect(result).toEqual([]);

      plainSpy.mockRestore();
    });

    it('should call plainToInstance with ServiceMaterialItemDto and parsed data', async () => {
      const inputArray = [{ id: 1 }];

      const plainSpy = jest
        .spyOn(classTransformer, 'plainToInstance')
        .mockReturnValue([] as any);

      await pipe.transform(JSON.stringify(inputArray));

      expect(plainSpy).toHaveBeenCalledWith(
        expect.any(Function), // ServiceMaterialItemDto class
        inputArray,
      );

      plainSpy.mockRestore();
    });

    it('should call validate for each item in the array', async () => {
      const mockInstances = [{ id: 1 }, { id: 2 }, { id: 3 }];

      const plainSpy = jest
        .spyOn(classTransformer, 'plainToInstance')
        .mockReturnValue(mockInstances as any);

      const validateSpy = jest
        .spyOn(classValidator, 'validate')
        .mockResolvedValue([]);

      await pipe.transform('[{}, {}, {}]');

      expect(validateSpy).toHaveBeenCalledTimes(3);

      plainSpy.mockRestore();
      validateSpy.mockRestore();
    });
  });
});
