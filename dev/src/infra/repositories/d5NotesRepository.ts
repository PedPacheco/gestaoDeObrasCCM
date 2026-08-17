import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ID5NotesRepository } from 'src/domain/repositories/d5notesRepository';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class D5NotesRepository implements ID5NotesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async get(filters: any) {
    await this.prisma.notas_d5.findMany();
  }

  async getById(id: number): Promise<void> {
    try {
      await this.prisma.notas_d5.findUnique({
        where: { id },
      });
    } catch (error) {
      throw error;
    }
  }
}
