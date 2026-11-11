import { BadRequestException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { UploadSignaturePipe } from 'src/core/pipes/uploadSignature.pipe';

// ─── Shared mock state (hoisted so the vi.mock factories can use it) ──
const h = vi.hoisted(() => ({
  readHeader: vi.fn(),
  matchesSignature: vi.fn(),
  unlink: vi.fn(),
}));

// The specifiers must match the source imports.
vi.mock('src/shared/upload/fileSignatures', () => ({
  readHeader: h.readHeader,
  matchesSignature: h.matchesSignature,
}));

vi.mock('node:fs/promises', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:fs/promises')>();
  return { ...actual, unlink: h.unlink }; // never calls the real unlink
});

// ─── Helpers ────────────────────────────────────────────────────────
const MESSAGE =
  'O conteúdo do arquivo enviado não corresponde ao tipo informado.';

/** Files whose content must be reported as not matching the extension. */
let invalid: Set<Express.Multer.File>;

const file = (
  originalname: string | undefined,
  overrides: Partial<Express.Multer.File> = {},
): Express.Multer.File =>
  ({
    fieldname: 'file',
    originalname,
    encoding: '7bit',
    mimetype: 'application/octet-stream',
    size: 1,
    ...overrides,
  }) as Express.Multer.File;

const onDisk = (name: string, path = `/uploads/${name}`) =>
  file(name, { path });
const inMemory = (name: string) => file(name, { buffer: Buffer.from('x') });

/** Marks the file as having content that does not match its extension. */
const bad = (f: Express.Multer.File) => {
  invalid.add(f);
  return f;
};

/** Awaits a promise that must reject and returns the rejection reason. */
const rejection = (promise: Promise<unknown>) =>
  promise.then(
    () => {
      throw new Error('Expected the promise to reject');
    },
    (reason: unknown) => reason,
  );

/** Reports whether the promise is still pending after pending callbacks run. */
const state = (promise: Promise<unknown>) =>
  Promise.race([
    promise.then(
      () => 'fulfilled',
      () => 'rejected',
    ),
    new Promise((resolve) => setTimeout(resolve, 0, 'pending')),
  ]);

// ─── Suite ──────────────────────────────────────────────────────────
describe('UploadSignaturePipe', () => {
  let pipe: UploadSignaturePipe;

  beforeEach(() => {
    invalid = new Set();

    h.readHeader
      .mockReset()
      .mockImplementation(async (f: Express.Multer.File) =>
        Buffer.from(invalid.has(f) ? 'bad' : 'ok'),
      );
    h.matchesSignature
      .mockReset()
      .mockImplementation((header: Buffer) => header.toString() === 'ok');
    h.unlink.mockReset().mockResolvedValue(undefined);

    pipe = new UploadSignaturePipe();
  });

  // ───────────────────────────────────────────────────────────────────
  describe('without files', () => {
    it.each([
      ['undefined', undefined],
      ['null', null],
      ['an empty array', []],
    ])('returns the value unchanged when it is %s', async (_, value) => {
      await expect(pipe.transform(value as never)).resolves.toBe(value);

      expect(h.readHeader).not.toHaveBeenCalled();
      expect(h.unlink).not.toHaveBeenCalled();
    });
  });

  // ───────────────────────────────────────────────────────────────────
  describe('valid files', () => {
    it('returns the same single file', async () => {
      const upload = onDisk('capex.xlsx');

      await expect(pipe.transform(upload)).resolves.toBe(upload);

      expect(h.readHeader).toHaveBeenCalledWith(upload);
      expect(h.matchesSignature).toHaveBeenCalledWith(
        Buffer.from('ok'),
        '.xlsx',
      );
      expect(h.unlink).not.toHaveBeenCalled();
    });

    it('returns the same array after validating every file in order', async () => {
      const uploads = [onDisk('a.pdf'), inMemory('b.png'), onDisk('c.jpg')];

      await expect(pipe.transform(uploads)).resolves.toBe(uploads);

      expect(h.readHeader.mock.calls.map(([f]) => f)).toEqual(uploads);
      expect(h.matchesSignature.mock.calls.map(([, ext]) => ext)).toEqual([
        '.pdf',
        '.png',
        '.jpg',
      ]);
    });

    it('validates the files one at a time', async () => {
      let active = 0;
      let maxActive = 0;
      h.readHeader.mockImplementation(async () => {
        active++;
        maxActive = Math.max(maxActive, active);
        await new Promise((resolve) => setTimeout(resolve, 2));
        active--;
        return Buffer.from('ok');
      });

      await pipe.transform([onDisk('a.pdf'), onDisk('b.pdf'), onDisk('c.pdf')]);

      expect(maxActive).toBe(1);
    });
  });

  // ───────────────────────────────────────────────────────────────────
  describe('extension handling', () => {
    it.each([
      ['CAPEX.XLSX', '.xlsx'],
      ['Foto.JpEg', '.jpeg'],
      ['backup.tar.gz', '.gz'],
      ['report.pdf.exe', '.exe'], // only the last extension counts
      ['no-extension', ''],
      ['.hidden', ''],
    ])('checks %s against the extension %j', async (name, ext) => {
      await pipe.transform(onDisk(name));

      expect(h.matchesSignature).toHaveBeenCalledWith(expect.any(Buffer), ext);
    });

    it('uses an empty extension when originalname is missing', async () => {
      await pipe.transform(file(undefined, { path: '/uploads/x' }));

      expect(h.matchesSignature).toHaveBeenCalledWith(expect.any(Buffer), '');
    });
  });

  // ───────────────────────────────────────────────────────────────────
  describe('invalid files', () => {
    it('rejects with 400 and deletes the file stored on disk', async () => {
      const upload = bad(onDisk('fake.xlsx'));

      const error = await rejection(pipe.transform(upload));

      expect(error).toBeInstanceOf(BadRequestException);
      expect((error as Error).message).toBe(MESSAGE);
      expect(h.unlink).toHaveBeenCalledTimes(1);
      expect(h.unlink).toHaveBeenCalledWith('/uploads/fake.xlsx');
    });

    it('does not call unlink for memoryStorage files', async () => {
      await expect(pipe.transform(bad(inMemory('fake.pdf')))).rejects.toThrow(
        MESSAGE,
      );

      expect(h.unlink).not.toHaveBeenCalled();
    });

    it('deletes every disk file of the request, including the ones already validated', async () => {
      const uploads = [
        onDisk('ok-before.pdf'),
        inMemory('memory.png'),
        bad(onDisk('fake.pdf')),
        onDisk('not-checked.pdf'),
        file('empty-path.pdf', { path: '' }),
      ];

      await expect(pipe.transform(uploads)).rejects.toBeInstanceOf(
        BadRequestException,
      );

      expect(h.unlink.mock.calls.map(([path]) => path)).toEqual([
        '/uploads/ok-before.pdf',
        '/uploads/fake.pdf',
        '/uploads/not-checked.pdf',
      ]);
    });

    it('stops validating at the first invalid file', async () => {
      const uploads = [onDisk('a.pdf'), bad(onDisk('b.pdf')), onDisk('c.pdf')];

      await pipe.transform(uploads).catch(() => undefined);

      expect(h.readHeader).toHaveBeenCalledTimes(2);
      expect(h.readHeader).not.toHaveBeenCalledWith(uploads[2]);
    });

    it('still rejects with 400 when deleting a file fails', async () => {
      h.unlink
        .mockRejectedValueOnce(
          Object.assign(new Error('busy'), { code: 'EBUSY' }),
        )
        .mockResolvedValueOnce(undefined);
      const uploads = [onDisk('a.pdf'), bad(onDisk('b.pdf'))];

      const error = await rejection(pipe.transform(uploads));

      expect(error).toBeInstanceOf(BadRequestException);
      expect(h.unlink).toHaveBeenCalledTimes(2);
    });

    it('only rejects after the deletion has finished', async () => {
      let release!: () => void;
      h.unlink.mockReturnValueOnce(
        new Promise<void>((resolve) => {
          release = resolve;
        }),
      );

      const result = pipe.transform(bad(onDisk('fake.pdf')));

      expect(await state(result)).toBe('pending');
      release();
      await expect(result).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  // ───────────────────────────────────────────────────────────────────
  describe('header read failures', () => {
    it('propagates the error without deleting the files (current behaviour)', async () => {
      const failure = Object.assign(new Error('no such file'), {
        code: 'ENOENT',
      });
      h.readHeader.mockRejectedValueOnce(failure);

      await expect(pipe.transform(onDisk('a.pdf'))).rejects.toBe(failure);

      expect(h.matchesSignature).not.toHaveBeenCalled();
      expect(h.unlink).not.toHaveBeenCalled();
    });
  });
});
