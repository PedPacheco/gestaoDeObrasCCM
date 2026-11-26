import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '../generated/prisma/client';

@Injectable()
export class DbSchema {
  readonly name: string;

  constructor(config: ConfigService) {
    const schema = config.getOrThrow<string>('DB_SCHEMA');

    if (!/^[a-z_][a-z0-9_]*$/i.test(schema)) {
      throw new Error(`DB_SCHEMA inválido: ${schema}`);
    }

    this.name = schema;
  }

  table(table: string): Prisma.Sql {
    return Prisma.raw(`${this.name}.${table}`);
  }
}
