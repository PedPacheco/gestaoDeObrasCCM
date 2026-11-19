import { ValidationError } from '../errors/domain.error';

export enum TipoUsuario {
  INTERNO = 'INTERNO',
  PARCEIRA = 'PARCEIRA',
}

export interface UserProps {
  id?: number;
  username: string;
  senha: string; // hash bcrypt
  nome: string;
  email: string;
  tipo_usuario: TipoUsuario;
  is_admin: boolean;
  permissao_edicao: boolean;
  id_regional: number;
  id_turma: number;
  id_area: number | null;
  ativo: boolean;
}

export type CreateUserProps = Omit<
  UserProps,
  'id' | 'ativo' | 'is_admin' | 'permissao_edicao' | 'id_area'
> & {
  is_admin?: boolean;
  permissao_edicao?: boolean;
  id_area?: number | null;
};

export class User {
  readonly id?: number;
  readonly username: string;
  readonly senha: string;
  readonly nome: string;
  readonly email: string;
  readonly tipo_usuario: TipoUsuario;
  readonly is_admin: boolean;
  readonly permissao_edicao: boolean;
  readonly id_regional: number;
  readonly id_turma: number;
  readonly id_area: number | null;
  readonly ativo: boolean;

  private constructor(props: UserProps) {
    this.id = props.id;
    this.username = props.username;
    this.senha = props.senha;
    this.nome = props.nome;
    this.email = props.email;
    this.tipo_usuario = props.tipo_usuario;
    this.is_admin = props.is_admin;
    this.permissao_edicao = props.permissao_edicao;
    this.id_regional = props.id_regional;
    this.id_turma = props.id_turma;
    this.ativo = props.ativo;
    this.id_area =
      props.tipo_usuario === TipoUsuario.PARCEIRA ? null : props.id_area;

    this.validateInternalUserArea();
  }

  /** Novo utilizador: aplica valores por omissão e começa ativo. */
  static create(props: CreateUserProps): User {
    return new User({
      username: props.username,
      senha: props.senha,
      nome: props.nome,
      email: props.email,
      tipo_usuario: props.tipo_usuario,
      id_regional: props.id_regional,
      id_turma: props.id_turma,
      id_area: props.id_area ?? null,
      is_admin: props.is_admin ?? false,
      permissao_edicao: props.permissao_edicao ?? false,
      ativo: true,
    });
  }

  /** Reconstrói um utilizador vindo da persistência. Aceita utilizadores inativos. */
  static restore(props: UserProps): User {
    return new User(props);
  }

  /** Regra de autenticação: chamar no login. */
  assertCanAuthenticate(): void {
    if (!this.ativo) {
      throw new ValidationError('Usuário está inativo no sistema');
    }
  }

  private validateInternalUserArea(): void {
    if (this.tipo_usuario === TipoUsuario.INTERNO && !this.id_area) {
      throw new ValidationError(
        'Usuários internos devem possuir uma área vinculada.',
      );
    }
  }
}
