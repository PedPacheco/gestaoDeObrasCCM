import { TipoUsuario, User } from 'src/domain/entities/user.entity';

import { BadRequestException } from '@nestjs/common';

const baseUser = {
  id: 1,
  username: 'teste123',
  senha: 'hashPassword',
  nome: 'teste',
  email: 'teste@gmail.com',
  is_admin: false,
  permissao_edicao: false,
  id_regional: 1,
  id_turma: 1,
};

describe('User entity', () => {
  describe('validateInternalUserArea', () => {
    it('should require id_area for INTERNO users', () => {
      expect(
        () =>
          new User({
            ...baseUser,
            tipo_usuario: TipoUsuario.INTERNO,
            id_area: undefined,
          }),
      ).toThrow(
        new BadRequestException(
          'Usuários internos devem possuir uma área vinculada.',
        ),
      );
    });

    it('should accept INTERNO users with id_area', () => {
      const user = new User({
        ...baseUser,
        tipo_usuario: TipoUsuario.INTERNO,
        id_area: 8,
      });

      expect(user.id_area).toBe(8);
    });

    it('should force id_area to null for PARCEIRA users', () => {
      const user = new User({
        ...baseUser,
        tipo_usuario: TipoUsuario.PARCEIRA,
        id_area: 8,
      });

      expect(user.id_area).toBeNull();
    });
  });

  describe('constructor defaults', () => {
    it('should default ativo to true when not provided', () => {
      const user = new User({
        ...baseUser,
        tipo_usuario: TipoUsuario.PARCEIRA,
      });

      expect(user.ativo).toBe(true);
    });

    it('should not throw when building an entity for an inactive user', () => {
      expect(
        () =>
          new User({
            ...baseUser,
            tipo_usuario: TipoUsuario.PARCEIRA,
            ativo: false,
          }),
      ).not.toThrow();
    });
  });

  describe('ensureCanLogin', () => {
    it('should throw when the user is inactive', () => {
      const user = new User({
        ...baseUser,
        tipo_usuario: TipoUsuario.PARCEIRA,
        ativo: false,
      });

      expect(() => user.ensureCanLogin()).toThrow(
        new BadRequestException('Usuário está inativo no sistema'),
      );
    });

    it('should not throw for an active, non excluido user', () => {
      const user = new User({
        ...baseUser,
        tipo_usuario: TipoUsuario.PARCEIRA,
      });

      expect(() => user.ensureCanLogin()).not.toThrow();
    });
  });

  describe('registerAccess', () => {
    it('should set ultimo_acesso to now', () => {
      const user = new User({
        ...baseUser,
        tipo_usuario: TipoUsuario.PARCEIRA,
      });

      user.registerAccess();

      expect(user.ultimo_acesso).toBeInstanceOf(Date);
    });
  });

  describe('exceededInactivityLimit', () => {
    it('should return false when ultimo_acesso is null', () => {
      const user = new User({
        ...baseUser,
        tipo_usuario: TipoUsuario.PARCEIRA,
        ultimo_acesso: null,
      });

      expect(user.exceededInactivityLimit()).toBe(false);
    });

    it('should return false when ultimo_acesso is recent', () => {
      const recent = new Date();
      recent.setDate(recent.getDate() - 10);

      const user = new User({
        ...baseUser,
        tipo_usuario: TipoUsuario.PARCEIRA,
        ultimo_acesso: recent,
      });

      expect(user.exceededInactivityLimit()).toBe(false);
    });

    it('should return true when ultimo_acesso is older than 60 days', () => {
      const old = new Date();
      old.setDate(old.getDate() - 61);

      const user = new User({
        ...baseUser,
        tipo_usuario: TipoUsuario.PARCEIRA,
        ultimo_acesso: old,
      });

      expect(user.exceededInactivityLimit()).toBe(true);
    });
  });

  describe('deactivateForInactivity', () => {
    it('should set ativo=false and desativado_por_inatividade=true', () => {
      const user = new User({
        ...baseUser,
        tipo_usuario: TipoUsuario.PARCEIRA,
      });

      user.deactivateForInactivity();

      expect(user.ativo).toBe(false);
    });
  });
});
