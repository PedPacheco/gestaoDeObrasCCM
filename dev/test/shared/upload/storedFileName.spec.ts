import { uploadedPaths } from 'src/shared/upload/storedFileName';
import { describe, expect, it } from 'vitest';

const makeFile = (
  overrides: Partial<Express.Multer.File> = {},
): Express.Multer.File =>
  ({
    fieldname: 'file',
    originalname: 'file',
    encoding: '7bit',
    mimetype: 'application/octet-stream',
    size: 0,
    ...overrides,
  }) as Express.Multer.File;

describe('stored-files', () => {
  // ---------------------------------------------------------------------------
  describe('uploadedPaths', () => {
    it('returns [] when called without arguments', () => {
      expect(uploadedPaths()).toEqual([]);
    });

    it('returns [] for undefined', () => {
      expect(uploadedPaths(undefined)).toEqual([]);
    });

    it('returns [] for an empty array', () => {
      expect(uploadedPaths([])).toEqual([]);
    });

    it('accepts a single (non-array) file with a path', () => {
      expect(uploadedPaths(makeFile({ path: '/tmp/a.pdf' }))).toEqual([
        '/tmp/a.pdf',
      ]);
    });

    it('returns [] for a single memoryStorage file (no path)', () => {
      expect(uploadedPaths(makeFile({ buffer: Buffer.from('x') }))).toEqual([]);
    });

    it('returns the paths of an array of files, preserving order', () => {
      expect(
        uploadedPaths([
          makeFile({ path: '/tmp/a.pdf' }),
          makeFile({ path: '/tmp/b.png' }),
        ]),
      ).toEqual(['/tmp/a.pdf', '/tmp/b.png']);
    });

    it('ignores files without a path (memoryStorage) or with an empty path', () => {
      expect(
        uploadedPaths([
          makeFile({ path: '/tmp/a.pdf' }),
          makeFile({ buffer: Buffer.from('x') }),
          makeFile({ path: '' }),
          makeFile({ path: '/tmp/b.png' }),
        ]),
      ).toEqual(['/tmp/a.pdf', '/tmp/b.png']);
    });

    it('returns [] when all files are in memory', () => {
      expect(
        uploadedPaths([
          makeFile({ buffer: Buffer.from('a') }),
          makeFile({ buffer: Buffer.from('b') }),
        ]),
      ).toEqual([]);
    });
  });
});
