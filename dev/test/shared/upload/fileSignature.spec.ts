import { mkdtemp, open, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  hasSignature,
  matchesSignature,
  readHeader,
} from 'src/shared/upload/fileSignatures';
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

// Wraps the real `open` in a vi.fn so specific failures can be simulated,
// while keeping the real behaviour in all other tests.
vi.mock('node:fs/promises', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:fs/promises')>();
  return { ...actual, open: vi.fn(actual.open) };
});

const openMock = vi.mocked(open);

const HEADER_SIZE = 12;

const MAGIC = {
  pdf: [0x25, 0x50, 0x44, 0x46],
  jpg: [0xff, 0xd8, 0xff],
  png: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
  zip: [0x50, 0x4b, 0x03, 0x04],
  ole: [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1],
} as const;

/** Builds a header with the magic bytes followed by padding. */
const header = (bytes: readonly number[], padding = 4): Buffer =>
  Buffer.from([...bytes, ...Array(padding).fill(0x00)]);

const makeFile = (
  overrides: Partial<Express.Multer.File>,
): Express.Multer.File =>
  ({
    fieldname: 'file',
    originalname: 'file',
    encoding: '7bit',
    mimetype: 'application/octet-stream',
    size: 0,
    ...overrides,
  }) as Express.Multer.File;

/** Creates a fake FileHandle with controlled read/close. */
const fakeHandle = (read: ReturnType<typeof vi.fn>) => {
  const close = vi.fn().mockResolvedValue(undefined);
  openMock.mockResolvedValueOnce({ read, close } as never);
  return { read, close };
};

describe('file-signature', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  // ---------------------------------------------------------------------------
  describe('hasSignature', () => {
    it.each(['.pdf', '.jpg', '.jpeg', '.png', '.xlsx', '.xls'])(
      'returns true for supported extension %s',
      (ext) => {
        expect(hasSignature(ext)).toBe(true);
      },
    );

    it.each(['.PDF', '.JpG', '.XLSX'])('is case-insensitive (%s)', (ext) => {
      expect(hasSignature(ext)).toBe(true);
    });

    it.each(['.exe', '.txt', '.docx', '', 'pdf'])(
      'returns false for unsupported extension "%s"',
      (ext) => {
        expect(hasSignature(ext)).toBe(false);
      },
    );
  });

  // ---------------------------------------------------------------------------
  describe('matchesSignature', () => {
    it.each([
      ['.pdf', MAGIC.pdf],
      ['.jpg', MAGIC.jpg],
      ['.jpeg', MAGIC.jpg],
      ['.png', MAGIC.png],
      ['.xlsx', MAGIC.zip],
      ['.xls', MAGIC.ole],
    ] as const)('accepts a valid header for %s', (ext, bytes) => {
      expect(matchesSignature(header(bytes), ext)).toBe(true);
    });

    it('accepts a header exactly as long as the signature', () => {
      expect(matchesSignature(Buffer.from(MAGIC.pdf), '.pdf')).toBe(true);
    });

    it('is case-insensitive on the extension', () => {
      expect(matchesSignature(header(MAGIC.png), '.PNG')).toBe(true);
    });

    it('rejects an extension with no known signature', () => {
      expect(matchesSignature(header(MAGIC.pdf), '.exe')).toBe(false);
    });

    it('rejects when the bytes do not match the extension', () => {
      // PNG content declared as PDF
      expect(matchesSignature(header(MAGIC.png), '.pdf')).toBe(false);
    });

    // it('rejects when only the last byte differs', () => {
    //   const bytes = [...MAGIC.png];
    //   bytes[bytes.length - 1] = 0x00;
    //   expect(matchesSignature(header(bytes), '.png')).toBe(false);
    // });

    it('rejects a header shorter than the signature', () => {
      // the first 3 PNG bytes are not enough (the signature has 8)
      expect(matchesSignature(Buffer.from(MAGIC.png.slice(0, 3)), '.png')).toBe(
        false,
      );
    });

    it('rejects an empty header', () => {
      expect(matchesSignature(Buffer.alloc(0), '.pdf')).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  describe('readHeader', () => {
    let dir: string;

    beforeAll(async () => {
      dir = await mkdtemp(join(tmpdir(), 'file-signature-'));
    });

    afterAll(async () => {
      await rm(dir, { recursive: true, force: true });
    });

    describe('memoryStorage (file.buffer)', () => {
      it('returns the first 12 bytes of the buffer without opening files', async () => {
        const content = Buffer.from(Array.from({ length: 50 }, (_, i) => i));

        const result = await readHeader(makeFile({ buffer: content }));

        expect(result).toHaveLength(HEADER_SIZE);
        expect(result.equals(content.subarray(0, HEADER_SIZE))).toBe(true);
        expect(openMock).not.toHaveBeenCalled();
      });

      it('returns the whole buffer when it is shorter than 12 bytes', async () => {
        const content = Buffer.from(MAGIC.pdf);

        const result = await readHeader(makeFile({ buffer: content }));

        expect(result.equals(content)).toBe(true);
      });

      it('prefers the buffer even when a path is also present', async () => {
        const content = header(MAGIC.pdf);

        const result = await readHeader(
          makeFile({ buffer: content, path: '/non/existent/path' }),
        );

        expect(result.equals(content.subarray(0, HEADER_SIZE))).toBe(true);
        expect(openMock).not.toHaveBeenCalled();
      });
    });

    describe('without buffer and without path', () => {
      it('returns an empty buffer', async () => {
        const result = await readHeader(makeFile({}));

        expect(result).toHaveLength(0);
        expect(openMock).not.toHaveBeenCalled();
      });

      it('the result is rejected by matchesSignature', async () => {
        const result = await readHeader(makeFile({}));

        expect(matchesSignature(result, '.pdf')).toBe(false);
      });
    });

    describe('diskStorage (file.path)', () => {
      it('reads only the first 12 bytes of the file', async () => {
        const content = Buffer.concat([
          header(MAGIC.png),
          Buffer.alloc(100, 1),
        ]);
        const path = join(dir, 'large.png');
        await writeFile(path, content);

        const result = await readHeader(makeFile({ path }));

        expect(openMock).toHaveBeenCalledWith(path, 'r');
        expect(result).toHaveLength(HEADER_SIZE);
        expect(result.equals(content.subarray(0, HEADER_SIZE))).toBe(true);
        expect(matchesSignature(result, '.png')).toBe(true);
      });

      it('returns only the bytes read when the file is shorter than 12 bytes', async () => {
        const content = Buffer.from(MAGIC.jpg);
        const path = join(dir, 'small.jpg');
        await writeFile(path, content);

        const result = await readHeader(makeFile({ path }));

        expect(result).toHaveLength(content.length);
        expect(result.equals(content)).toBe(true);
      });

      it('returns an empty buffer for an empty file', async () => {
        const path = join(dir, 'empty.pdf');
        await writeFile(path, Buffer.alloc(0));

        const result = await readHeader(makeFile({ path }));

        expect(result).toHaveLength(0);
      });

      it('propagates the error when the file does not exist', async () => {
        const path = join(dir, 'missing.pdf');

        await expect(readHeader(makeFile({ path }))).rejects.toMatchObject({
          code: 'ENOENT',
        });
      });

      it('closes the handle even when the read fails (finally)', async () => {
        const { read, close } = fakeHandle(
          vi.fn().mockRejectedValue(new Error('read failure')),
        );

        await expect(
          readHeader(makeFile({ path: '/any/file.pdf' })),
        ).rejects.toThrow('read failure');

        expect(read).toHaveBeenCalledWith(
          expect.any(Buffer),
          0,
          HEADER_SIZE,
          0,
        );
        expect(close).toHaveBeenCalledTimes(1);
      });

      it('closes the handle after a successful read', async () => {
        const { close } = fakeHandle(
          vi.fn().mockImplementation(async (buf: Buffer) => {
            Buffer.from(MAGIC.pdf).copy(buf);
            return { bytesRead: MAGIC.pdf.length, buffer: buf };
          }),
        );

        const result = await readHeader(makeFile({ path: '/x.pdf' }));

        expect(result.equals(Buffer.from(MAGIC.pdf))).toBe(true);
        expect(close).toHaveBeenCalledTimes(1);
      });
    });
  });
});
