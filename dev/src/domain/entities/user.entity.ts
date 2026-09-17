import { BadRequestException } from '@nestjs/common';

export enum TipoUsuario {
  INTERNO = 'INTERNO',
  PARCEIRA = 'PARCEIRA',
}

export class User {
  static readonly INACTIVITY_LIMIT_DAYS = 60;

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
  ultimo_acesso?: Date | null;
  desativado_por_inatividade: boolean;
  excluido: boolean;
  data_exclusao?: Date | null;

  constructor(data: Partial<User>) {
    Object.assign(this, data);

    this.ativo = data.ativo ?? true;
    this.desativado_por_inatividade = data.desativado_por_inatividade ?? false;
    this.excluido = data.excluido ?? false;

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

  static inactivityCutoffDate(): Date {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - User.INACTIVITY_LIMIT_DAYS);
    return cutoff;
  }

  ensureCanLogin(): void {
    if (this.excluido || !this.ativo) {
      throw new BadRequestException('Usuário está inativo no sistema');
    }
  }

  deactivate(requesterId: number): void {
    if (this.id === requesterId) {
      throw new BadRequestException(
        'Você não pode desativar sua própria conta',
      );
    }

    this.ativo = false;
  }

  reactivate(): void {
    if (this.ativo) {
      throw new BadRequestException('Usuário já está ativo');
    }

    this.ativo = true;
    this.desativado_por_inatividade = false;
    this.ultimo_acesso = new Date();
  }

  changeEditPermission(value: boolean): void {
    this.permissao_edicao = value;
  }

  archive(requesterId: number): void {
    if (this.id === requesterId) {
      throw new BadRequestException('Você não pode excluir sua própria conta');
    }

    this.excluido = true;
    this.ativo = false;
    this.data_exclusao = new Date();
  }

  registerAccess(): void {
    this.ultimo_acesso = new Date();
  }

  exceededInactivityLimit(): boolean {
    if (!this.ultimo_acesso) {
      return false;
    }

    return this.ultimo_acesso < User.inactivityCutoffDate();
  }

  deactivateForInactivity(): void {
    this.ativo = false;
    this.desativado_por_inatividade = true;
  }
}
