import {
  DOCUMENT_AND_SPREADSHEET_UPLOAD_PRESET,
  INLINE_EXTENSIONS,
  isInlineExtension,
  MIME_BY_EXTENSION,
  mimeTypeFor,
  XLS_MIME,
  XLSX_MIME,
} from 'src/shared/upload/uploadPresets';
import { describe, expect, it } from 'vitest';

const OCTET_STREAM = 'application/octet-stream';

describe('mimeTypeFor', () => {
  it.each([
    ['.pdf', 'application/pdf'],
    ['.jpg', 'image/jpeg'],
    ['.jpeg', 'image/jpeg'],
    ['.png', 'image/png'],
    ['.xlsx', XLSX_MIME],
    ['.xls', XLS_MIME],
  ])('maps %s to %s', (ext, expected) => {
    expect(mimeTypeFor(ext)).toBe(expected);
  });

  it.each([
    ['unknown extension', '.exe'],
    ['html', '.html'],
    ['empty string', ''],
    ['extension without dot', 'pdf'],
    ['uppercase (caller must lowercase)', '.PDF'],
  ])('falls back to octet-stream for %s', (_label, ext) => {
    expect(mimeTypeFor(ext)).toBe(OCTET_STREAM);
  });

  it.each(['constructor', 'toString', '__proto__', 'hasOwnProperty'])(
    'ignores inherited prototype key %s',
    (key) => {
      expect(mimeTypeFor(key)).toBe(OCTET_STREAM);
    },
  );

  it('always returns a string', () => {
    for (const ext of ['.pdf', '.exe', '', 'constructor']) {
      expect(typeof mimeTypeFor(ext)).toBe('string');
    }
  });
});

describe('isInlineExtension', () => {
  it.each(['.pdf', '.jpg', '.jpeg', '.png'])('returns true for %s', (ext) => {
    expect(isInlineExtension(ext)).toBe(true);
  });

  it.each([
    ['spreadsheet xlsx', '.xlsx'],
    ['spreadsheet xls', '.xls'],
    ['html', '.html'],
    ['svg (can carry scripts)', '.svg'],
    ['unknown extension', '.exe'],
    ['empty string', ''],
    ['extension without dot', 'pdf'],
    ['uppercase (caller must lowercase)', '.PDF'],
    ['prototype key', 'constructor'],
  ])('returns false for %s', (_label, ext) => {
    expect(isInlineExtension(ext)).toBe(false);
  });
});

describe('consistency between presets and delivery maps', () => {
  it('every accepted upload extension has a MIME type', () => {
    for (const ext of DOCUMENT_AND_SPREADSHEET_UPLOAD_PRESET.allowedExtensions) {
      expect(Object.hasOwn(MIME_BY_EXTENSION, ext)).toBe(true);
    }
  });

  it('every inline extension has a MIME type', () => {
    for (const ext of INLINE_EXTENSIONS) {
      expect(mimeTypeFor(ext)).not.toBe(OCTET_STREAM);
    }
  });

  it('inline extensions are only PDF or images', () => {
    for (const ext of INLINE_EXTENSIONS) {
      expect(mimeTypeFor(ext)).toMatch(/^(application\/pdf|image\/)/);
    }
  });
});
