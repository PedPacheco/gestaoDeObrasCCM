import { BadRequestException } from '@nestjs/common';
import { TipoUsuario } from '@prisma/client';

export class User {
  id?: number;
  username: string;
  senha: string;
  nome: string;
  email: string;
  tipo_usuario: TipoUsuario;
  is_admin: boolean;
  permissao_edicao: boolean;
  id_regional: number;
  id_turma: number;
  id_area?: number | null;

  constructor(data: Partial<User>) {
    Object.assign(this, data);

    this.validateInternalUserArea();
  }

  private validateInternalUserArea(): void {
    if (this.tipo_usuario === TipoUsuario.INTERNO && !this.id_area) {
      throw new BadRequestException(
        'Usuários internos devem possuir uma área vinculada.',
      );
    }

    if (this.tipo_usuario === TipoUsuario.PARCEIRA) {
      this.id_area = null;
    }
  }
}
