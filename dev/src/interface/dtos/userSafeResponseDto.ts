import { Exclude, Expose } from 'class-transformer';
import { TipoUsuario } from 'src/domain/entities/user.entity';

@Exclude()
export class UserSafeResponseDTO {
  @Expose()
  id: number;

  @Expose()
  username: string;

  @Expose()
  nome: string;

  @Expose()
  email: string;

  @Expose()
  tipo_usuario: TipoUsuario;

  @Expose()
  is_admin: boolean;

  @Expose()
  permissao_edicao: boolean;

  @Expose()
  id_regional: number;

  @Expose()
  id_turma: number;

  @Expose()
  id_area: number | null;

  @Expose()
  ativo: boolean;

  @Expose()
  regional: number;

  @Expose()
  parceira: number;

  @Expose()
  area: number | null;
}
