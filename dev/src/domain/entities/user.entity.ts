import { BadRequestException } from '@nestjs/common';
import moment from 'moment';

export enum TipoUsuario {
  INTERNO = 'INTERNO',
  PARCEIRA = 'PARCEIRA',
}

export interface EditableUserData {
  nome: string;
  email: string;
  tipo_usuario: TipoUsuario;
  is_admin: boolean;
  permissao_edicao: boolean;
  id_regional: number;
  id_turma: number;
  id_area?: number | null;
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
  ultimo_acesso: Date;

  constructor(data: Partial<User>) {
    Object.assign(this, data);

    this.ativo = data.ativo ?? true;

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

  applyUpdate(data: EditableUserData): User {
    return new User({
      ...this,
      nome: data.nome,
      email: data.email,
      tipo_usuario: data.tipo_usuario,
      is_admin: data.is_admin,
      permissao_edicao: data.permissao_edicao,
      id_regional: data.id_regional,
      id_turma: data.id_turma,
      id_area: data.id_area,
    });
  }

  ensureCanLogin(): void {
    if (!this.ativo) {
      throw new BadRequestException('Usuário está inativo no sistema');
    }
  }

  registerAccess(): void {
    this.ultimo_acesso = moment.utc().toDate();
  }

  exceededInactivityLimit(): boolean {
    if (!this.ultimo_acesso) {
      return false;
    }

    return this.ultimo_acesso < User.inactivityCutoffDate();
  }

  deactivateForInactivity(): void {
    this.ativo = false;
  }
}
