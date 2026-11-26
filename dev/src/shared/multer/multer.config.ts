// src/shared/multer/multer.config.ts
import { BadRequestException } from '@nestjs/common';
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface.js';
import { randomUUID } from 'crypto';
import { existsSync, mkdirSync } from 'fs';
import { diskStorage } from 'multer';
import { extname } from 'path';

export interface MulterConfig {
  readonly destination: string;
  readonly allowedMimeTypes: readonly string[];
  readonly allowedExtensions: readonly string[];
  readonly maxSize: number; // bytes por ficheiro
  readonly maxFiles: number; // ficheiros por pedido
}

// ── Limites ──────────────────────────────────────────────────────────
const MAX_FIELDS = 30; // campos de texto por pedido
const MAX_FIELD_SIZE = 1 * 1024 * 1024; // 1 MB por campo de texto
const MAX_BASE_LENGTH = 80; // tamanho máximo do nome legível

type FileFilter = NonNullable<MulterOptions['fileFilter']>;

// ── Helpers (exportados para os testes) ──────────────────────────────

/** "Foto.PNG" → ".png"; "ficheiro" → "". */
export const normalizedExt = (originalName?: string): string =>
  extname(originalName ?? '').toLowerCase();

/**
 * O Multer pode entregar o originalname em latin1 ("RelatÃ³rio").
 * Tenta reinterpretar como UTF-8 e, se o resultado for inválido,
 * assume que o nome já estava correto.
 */
export const fixFilenameEncoding = (name = ''): string => {
  const decoded = Buffer.from(name, 'latin1').toString('utf8');
  return decoded.includes('\uFFFD') ? name : decoded;
};

/** "Relatório Final v2.PDF" → "Relatorio_Final_v2" */
export const sanitizeBaseName = (originalName = ''): string => {
  const ext = extname(originalName);
  const base = ext ? originalName.slice(0, -ext.length) : originalName; // retira só a ÚLTIMA extensão

  const sanitized = base
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove acentos: ó → o, ç → c
    .replace(/[^a-zA-Z0-9]+/g, '_') // tudo o resto vira "_"
    .replace(/^_+|_+$/g, '') // sem "_" no início ou no fim
    .slice(0, MAX_BASE_LENGTH);

  return sanitized || 'arquivo'; // nome só com símbolos → "arquivo"
};

/** Nome legível + identificador aleatório (sem hífens) + extensão validada. */
export const safeFilename = (originalName: string): string => {
  const name = fixFilenameEncoding(originalName);
  return `${sanitizeBaseName(name)}-${randomUUID().replace(/-/g, '')}${normalizedExt(name)}`;
};

/** Aceita o ficheiro só se a extensão E o MIME estiverem na lista. */
export const createFileFilter =
  (
    config: Pick<MulterConfig, 'allowedExtensions' | 'allowedMimeTypes'>,
  ): FileFilter =>
  (_req, file, callback) => {
    const ext = normalizedExt(file.originalname);
    const mime = (file.mimetype ?? '').toLowerCase();

    const ok =
      config.allowedExtensions.includes(ext) &&
      config.allowedMimeTypes.includes(mime);

    if (!ok) {
      return callback(
        new BadRequestException('Tipo de arquivo não permitido'),
        false,
      );
    }
    callback(null, true);
  };

// ── Fábrica ──────────────────────────────────────────────────────────
export function createMulterConfig(config: MulterConfig): MulterOptions {
  if (!config?.destination) {
    throw new Error('Multer destination was not provided');
  }

  // Necessário: com destination em função, o Multer não cria a pasta sozinho.
  if (!existsSync(config.destination)) {
    mkdirSync(config.destination, { recursive: true });
  }

  return {
    storage: diskStorage({
      destination: (_req, _file, callback) => {
        callback(null, config.destination);
      },
      // O fileFilter corre antes do filename, por isso a extensão já foi validada.
      filename: (_req, file, callback) => {
        callback(null, safeFilename(file.originalname));
      },
    }),
    fileFilter: createFileFilter(config),
    limits: {
      fileSize: config.maxSize,
      files: config.maxFiles,
      fields: MAX_FIELDS,
      fieldSize: MAX_FIELD_SIZE,
    },
  };
}
