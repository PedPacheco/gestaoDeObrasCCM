import { BadRequestException } from '@nestjs/common';
import { existsSync, mkdirSync } from 'fs';
import { diskStorage } from 'multer';
import { extname } from 'path';

export interface MulterConfig {
  destination: string;
  allowedMimeTypes: string[];
  maxSize: number;
  maxFiles: number;
}

export function createMulterConfig(config: MulterConfig) {
  if (!existsSync(config.destination)) {
    mkdirSync(config.destination, { recursive: true });
  }

  return {
    storage: diskStorage({
      destination: (_req, _file, callback) => {
        callback(null, config.destination);
      },

      filename: (_req, file, callback) => {
        const ext = extname(file.originalname);

        const sanitized = file.originalname
          .replace(ext, '')
          .replace(/[^a-zA-Z0-9]/g, '_');

        const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;

        callback(null, `${sanitized}-${unique}${ext}`);
      },
    }),

    fileFilter: (_req, file, callback) => {
      if (!config.allowedMimeTypes.includes(file.mimetype)) {
        return callback(
          new BadRequestException('Tipo de arquivo não permitido'),
          false,
        );
      }

      callback(null, true);
    },

    limits: {
      fileSize: config.maxSize, // Ex: 5MB
      files: config.maxFiles, // Ex: 3 arquivos
    },
  };
}
