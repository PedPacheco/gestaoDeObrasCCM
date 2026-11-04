import { BadRequestException } from '@nestjs/common';
import { promises as fs } from 'fs';
import { extname } from 'path';

/** Todo .xlsx é um zip e começa com "PK\x03\x04". */
const ZIP_SIGNATURE = Buffer.from([0x50, 0x4b, 0x03, 0x04]);

async function hasZipSignature(path: string): Promise<boolean> {
  const handle = await fs.open(path, 'r');
  try {
    const header = Buffer.alloc(ZIP_SIGNATURE.length);
    const { bytesRead } = await handle.read(header, 0, header.length, 0);
    return bytesRead === header.length && header.equals(ZIP_SIGNATURE);
  } finally {
    await handle.close();
  }
}

/**
 * Valida o upload do CAPEX além do mimetype (que é informado pelo cliente):
 * extensão .xlsx e assinatura de zip. Em caso de rejeição, remove o arquivo.
 */
export async function assertXlsxUpload(
  file: Express.Multer.File | undefined,
): Promise<void> {
  if (!file) {
    throw new BadRequestException('Nenhum arquivo foi enviado.');
  }

  const reject = async (message: string): Promise<never> => {
    await fs.unlink(file.path).catch(() => undefined);
    throw new BadRequestException(message);
  };

  if (extname(file.originalname ?? '').toLowerCase() !== '.xlsx') {
    await reject('Apenas arquivos .xlsx são permitidos.');
  }

  if (!(await hasZipSignature(file.path).catch(() => false))) {
    await reject('O arquivo enviado não é uma planilha .xlsx válida.');
  }
}
