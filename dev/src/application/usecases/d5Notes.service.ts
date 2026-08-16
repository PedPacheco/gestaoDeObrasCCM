import { BadRequestException, Inject, Injectable } from '@nestjs/common';

@Injectable()
export class D5NotesService {
  constructor(
    @Inject(D5_NOTES_REPOSITORY)
    private readonly d5NotesRepository: ID5NotesRepository,
  ) {}

  async get(filters: any) {
    return await this.d5NotesRepository.get(filters);
  }

  async getById(id: number) {
    if (!id) {
      throw new BadRequestException('Obra não foi enviada');
    }

    const response = await this.d5NotesRepository.getById(id);

    return response.map((item) => ({
      descricao: item.descricao,
      motivo: item.motivo,
      usuario: item.novo_tabela_usuarios.nome,
      criado_em: item.criado_em,
    }));
  }
}
