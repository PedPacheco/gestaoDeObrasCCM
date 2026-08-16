import { BadRequestException } from '@nestjs/common';
import { extname } from 'path';

import * as fs from 'fs';
import { createMulterConfig } from 'src/shared/multer/multer.config';

jest.mock('fs');

describe('createMulterConfig (Jest)', () => {
  const existsSync = fs.existsSync as jest.Mock;
  const mkdirSync = fs.mkdirSync as jest.Mock;

  const baseConfig = {
    destination: '/uploads',
    allowedMimeTypes: ['image/png', 'application/pdf'],
    allowedExtensions: ['pdf', 'jpeg'],
    maxSize: 5 * 1024 * 1024,
    maxFiles: 3,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create directory if not existing', () => {
    existsSync.mockReturnValue(false);

    createMulterConfig(baseConfig);

    expect(mkdirSync).toHaveBeenCalledWith('/uploads', { recursive: true });
  });

  it('should NOT create directory if it already exists', () => {
    existsSync.mockReturnValue(true);

    createMulterConfig(baseConfig);

    expect(mkdirSync).not.toHaveBeenCalled();
  });

  it('should configure destination correctly', () => {
    existsSync.mockReturnValue(true);

    const config = createMulterConfig(baseConfig);
    const callback = jest.fn();

    const storage: any = config.storage;
    storage.getDestination({}, {} as any, callback);

    expect(callback).toHaveBeenCalledWith(null, '/uploads');
  });

  it('should generate sanitized and unique filename', () => {
    existsSync.mockReturnValue(true);

    const config = createMulterConfig(baseConfig);
    const callback = jest.fn();

    const file = { originalname: 'meu arqùivo 2024@#.pdf' } as any;

    const storage = config.storage as any;

    storage.getFilename({}, file, callback);

    const generatedName = callback.mock.calls[0][1];

    expect(generatedName).toMatch(/^meu_arq_ivo_2024__/);
    expect(generatedName.endsWith('.pdf')).toBe(true);

    const ext = extname(generatedName);
    const name = generatedName.replace(ext, '');
    const parts = name.split('-');

    expect(parts.length).toBeGreaterThan(1);
  });

  it('should accept allowed mimetype', () => {
    existsSync.mockReturnValue(true);

    const config = createMulterConfig(baseConfig);
    const callback = jest.fn();

    const file = { mimetype: 'image/png' } as any;

    config.fileFilter({} as any, file, callback);

    expect(callback).toHaveBeenCalledWith(null, true);
  });

  it('should reject disallowed mimetype', () => {
    existsSync.mockReturnValue(true);

    const config = createMulterConfig(baseConfig);
    const callback = jest.fn();

    const file = { mimetype: 'text/plain' } as any;

    config.fileFilter({} as any, file, callback);

    expect(callback.mock.calls[0][0]).toBeInstanceOf(BadRequestException);
    expect(callback.mock.calls[0][1]).toBe(false);
  });

  it('should set multer limits correctly', () => {
    existsSync.mockReturnValue(true);

    const config = createMulterConfig(baseConfig);

    expect(config.limits.fileSize).toBe(baseConfig.maxSize);
    expect(config.limits.files).toBe(baseConfig.maxFiles);
  });
});
