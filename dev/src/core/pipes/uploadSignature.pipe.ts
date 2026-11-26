import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { unlink } from 'node:fs/promises';
import { extname } from 'node:path';
import { matchesSignature, readHeader } from 'src/shared/upload/fileSignatures';

type Upload = Express.Multer.File | Express.Multer.File[] | undefined;

@Injectable()
export class UploadSignaturePipe implements PipeTransform<
  Upload,
  Promise<Upload>
> {
  async transform(value: Upload): Promise<Upload> {
    const files = !value ? [] : Array.isArray(value) ? value : [value];

    for (const file of files) {
      const ext = extname(file.originalname ?? '').toLowerCase();

      const header = await readHeader(file);

      if (!matchesSignature(header, ext)) {
        // apaga TODOS os arquivos desta requisição (os que estão em disco)
        await Promise.allSettled(
          files.filter((f) => f.path).map((f) => unlink(f.path)),
        );

        throw new BadRequestException(
          'O conteúdo do arquivo enviado não corresponde ao tipo informado.',
        );
      }
    }
    return value;
  }
}
