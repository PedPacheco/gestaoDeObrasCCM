import { BadRequestException } from '@nestjs/common';

export enum TipoUsuario {
  INTERNO = 'INTERNO',
  PARCEIRA = 'PARCEIRA',
}

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
  ativo: boolean;

  constructor(data: Partial<User>) {
    Object.assign(this, data);

    this.ativo = data.ativo ?? true;

    this.validateInternalUserArea();
    this.userIsActive();
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

  private userIsActive(): void {
    if (!this.ativo) {
      throw new BadRequestException('Usuário está inativo no sistema');
    }
  }
}
