import { open } from 'node:fs/promises';

type Signature = { offset: number; bytes: readonly number[] };

const SIGNATURES: Readonly<Record<string, readonly Signature[]>> = {
  '.pdf': [{ offset: 0, bytes: [0x25, 0x50, 0x44, 0x46] }], // %PDF
  '.jpg': [{ offset: 0, bytes: [0xff, 0xd8, 0xff] }],
  '.jpeg': [{ offset: 0, bytes: [0xff, 0xd8, 0xff] }],
  '.png': [
    { offset: 0, bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
  ],
  '.xlsx': [{ offset: 0, bytes: [0x50, 0x4b, 0x03, 0x04] }], // zip
  '.xls': [
    { offset: 0, bytes: [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1] },
  ],
};

const HEADER_SIZE = 12;

/** Usado nos testes para garantir que todas as extensões dos presets têm assinatura. */
export function hasSignature(ext: string): boolean {
  return ext.toLowerCase() in SIGNATURES;
}

export function matchesSignature(header: Buffer, ext: string): boolean {
  const signatures = SIGNATURES[ext.toLowerCase()];

  if (!signatures) return false; // extensão sem assinatura conhecida = recusa;

  return signatures.some(
    ({ offset, bytes }) =>
      header.length >= offset + bytes.length && // ← ajuste b)
      bytes.every((byte, i) => header[offset + i] === byte),
  );
}

export async function readHeader(file: Express.Multer.File): Promise<Buffer> {
  if (file.buffer) return file.buffer.subarray(0, HEADER_SIZE); //memoryStorage;

  if (!file.path) return Buffer.alloc(0); // sem conteúdo → matchesSignature recusa (400)

  const handle = await open(file.path, 'r');

  try {
    const buffer = Buffer.alloc(HEADER_SIZE);

    const { bytesRead } = await handle.read(buffer, 0, HEADER_SIZE, 0);

    return buffer.subarray(0, bytesRead);
  } finally {
    await handle.close();
  }
}
