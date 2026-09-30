import { BadRequestException } from '@nestjs/common';
import { resolveFileDiff } from 'src/domain/services/resolveFileDiff.service';

const expectBadRequest = (fn: () => unknown) => {
  expect(fn).toThrow(BadRequestException);
  expect(fn).toThrow(
    'Lista de anexos contém ficheiros que não pertencem a esta programação.',
  );
};

describe('resolveFileDiff', () => {
  // =========================================================================
  // Cenários base
  // =========================================================================
  describe('sem alterações', () => {
    it('deve devolver listas vazias quando não há nada', () => {
      expect(resolveFileDiff([], undefined, [])).toEqual({
        finalPaths: [],
        toRemove: [],
      });
    });

    it('deve manter os ficheiros existentes quando keptFiles é undefined', () => {
      expect(resolveFileDiff(['a.pdf', 'b.pdf'], undefined, [])).toEqual({
        finalPaths: ['a.pdf', 'b.pdf'],
        toRemove: [],
      });
    });

    it('deve manter os ficheiros quando keptFiles repete o armazenado', () => {
      expect(
        resolveFileDiff(['a.pdf', 'b.pdf'], ['a.pdf', 'b.pdf'], []),
      ).toEqual({ finalPaths: ['a.pdf', 'b.pdf'], toRemove: [] });
    });
  });

  // =========================================================================
  // Adição
  // =========================================================================
  describe('adição de ficheiros', () => {
    it('deve acrescentar os uploads ao conjunto existente', () => {
      expect(resolveFileDiff(['a.pdf'], ['a.pdf'], ['novo.pdf'])).toEqual({
        finalPaths: ['a.pdf', 'novo.pdf'],
        toRemove: [],
      });
    });

    it('deve acrescentar múltiplos uploads', () => {
      expect(resolveFileDiff([], [], ['n1.pdf', 'n2.pdf', 'n3.pdf'])).toEqual({
        finalPaths: ['n1.pdf', 'n2.pdf', 'n3.pdf'],
        toRemove: [],
      });
    });

    it('deve acrescentar uploads quando keptFiles é undefined', () => {
      expect(resolveFileDiff(['a.pdf'], undefined, ['novo.pdf'])).toEqual({
        finalPaths: ['a.pdf', 'novo.pdf'],
        toRemove: [],
      });
    });

    it('deve preservar a ordem: mantidos primeiro, novos depois', () => {
      const { finalPaths } = resolveFileDiff(
        ['a.pdf', 'b.pdf'],
        ['b.pdf', 'a.pdf'],
        ['z.pdf'],
      );

      expect(finalPaths).toEqual(['b.pdf', 'a.pdf', 'z.pdf']);
    });
  });

  // =========================================================================
  // Remoção
  // =========================================================================
  describe('remoção de ficheiros', () => {
    it('deve marcar para remoção os que saíram de keptFiles', () => {
      expect(
        resolveFileDiff(['a.pdf', 'b.pdf', 'c.pdf'], ['a.pdf'], []),
      ).toEqual({ finalPaths: ['a.pdf'], toRemove: ['b.pdf', 'c.pdf'] });
    });

    it('deve remover todos quando keptFiles é uma lista vazia', () => {
      expect(resolveFileDiff(['a.pdf', 'b.pdf'], [], [])).toEqual({
        finalPaths: [],
        toRemove: ['a.pdf', 'b.pdf'],
      });
    });

    it('deve distinguir lista vazia de undefined', () => {
      const comVazio = resolveFileDiff(['a.pdf'], [], []);
      const comUndefined = resolveFileDiff(['a.pdf'], undefined, []);

      expect(comVazio.toRemove).toEqual(['a.pdf']);
      expect(comUndefined.toRemove).toEqual([]);
    });

    it('deve preservar a ordem original em toRemove', () => {
      const { toRemove } = resolveFileDiff(
        ['a.pdf', 'b.pdf', 'c.pdf', 'd.pdf'],
        ['c.pdf'],
        [],
      );

      expect(toRemove).toEqual(['a.pdf', 'b.pdf', 'd.pdf']);
    });
  });

  // =========================================================================
  // Substituição (remoção + adição simultâneas)
  // =========================================================================
  describe('substituição', () => {
    it('deve remover os antigos e acrescentar os novos', () => {
      expect(
        resolveFileDiff(
          ['antigo1.pdf', 'antigo2.pdf'],
          ['antigo1.pdf'],
          ['novo.pdf'],
        ),
      ).toEqual({
        finalPaths: ['antigo1.pdf', 'novo.pdf'],
        toRemove: ['antigo2.pdf'],
      });
    });

    it('deve substituir integralmente o conjunto', () => {
      expect(
        resolveFileDiff(['a.pdf', 'b.pdf'], [], ['n1.pdf', 'n2.pdf']),
      ).toEqual({
        finalPaths: ['n1.pdf', 'n2.pdf'],
        toRemove: ['a.pdf', 'b.pdf'],
      });
    });
  });

  // =========================================================================
  // Validação de integridade
  // =========================================================================
  describe('validação de ficheiros forjados', () => {
    it('deve rejeitar um ficheiro que não está armazenado', () => {
      expectBadRequest(() =>
        resolveFileDiff(['a.pdf'], ['a.pdf', 'forjado.pdf'], []),
      );
    });

    it('deve rejeitar quando o armazenado está vazio mas keptFiles não', () => {
      expectBadRequest(() => resolveFileDiff([], ['inventado.pdf'], []));
    });

    it('deve rejeitar múltiplos ficheiros forjados', () => {
      expectBadRequest(() =>
        resolveFileDiff(['a.pdf'], ['f1.pdf', 'f2.pdf'], []),
      );
    });

    it('deve rejeitar mesmo que apenas um de vários seja forjado', () => {
      expectBadRequest(() =>
        resolveFileDiff(
          ['a.pdf', 'b.pdf'],
          ['a.pdf', 'b.pdf', 'intruso.pdf'],
          [],
        ),
      );
    });

    it('deve rejeitar uma tentativa de travessia de diretório', () => {
      expectBadRequest(() =>
        resolveFileDiff(['a.pdf'], ['../../etc/passwd'], []),
      );
    });

    it('deve validar antes de considerar os uploads', () => {
      // o erro ocorre mesmo havendo uploads válidos
      expectBadRequest(() =>
        resolveFileDiff(['a.pdf'], ['forjado.pdf'], ['novo.pdf']),
      );
    });

    it('não deve validar os uploads contra o armazenado', () => {
      // uploads são sempre novos por definição — não devem ser rejeitados
      expect(() =>
        resolveFileDiff(['a.pdf'], ['a.pdf'], ['ficheiro-totalmente-novo.pdf']),
      ).not.toThrow();
    });

    it('não deve validar quando keptFiles é undefined', () => {
      // o fallback usa o próprio stored, logo nunca há forjados
      expect(() => resolveFileDiff(['a.pdf'], undefined, [])).not.toThrow();
    });
  });

  // =========================================================================
  // Sensibilidade e comparação exata
  // =========================================================================
  describe('comparação de caminhos', () => {
    it('deve ser sensível a maiúsculas e minúsculas', () => {
      expectBadRequest(() => resolveFileDiff(['A.pdf'], ['a.pdf'], []));
    });

    it('deve ser sensível a espaços envolventes', () => {
      expectBadRequest(() => resolveFileDiff(['a.pdf'], [' a.pdf'], []));
    });

    it('deve distinguir caminhos com diretórios diferentes', () => {
      expectBadRequest(() =>
        resolveFileDiff(['pasta1/a.pdf'], ['pasta2/a.pdf'], []),
      );
    });

    it('deve aceitar caminhos idênticos com diretórios', () => {
      expect(resolveFileDiff(['pasta/a.pdf'], ['pasta/a.pdf'], [])).toEqual({
        finalPaths: ['pasta/a.pdf'],
        toRemove: [],
      });
    });
  });

  // =========================================================================
  // Duplicados
  // =========================================================================
  describe('duplicados', () => {
    it('deve aceitar duplicados em keptFiles (validação delega à entidade)', () => {
      const result = resolveFileDiff(['a.pdf'], ['a.pdf', 'a.pdf'], []);

      expect(result.finalPaths).toEqual(['a.pdf', 'a.pdf']);
      expect(result.toRemove).toEqual([]);
    });

    it('deve propagar duplicados entre mantidos e enviados', () => {
      const result = resolveFileDiff(['a.pdf'], ['a.pdf'], ['a.pdf']);

      expect(result.finalPaths).toEqual(['a.pdf', 'a.pdf']);
    });

    it('deve lidar com duplicados no armazenado', () => {
      const result = resolveFileDiff(['a.pdf', 'a.pdf'], ['a.pdf'], []);

      // includes é verdadeiro para ambos: nada é removido
      expect(result.toRemove).toEqual([]);
    });
  });

  // =========================================================================
  // Imutabilidade
  // =========================================================================
  describe('imutabilidade', () => {
    it('não deve mutar o array stored', () => {
      const stored = ['a.pdf', 'b.pdf'];
      const snapshot = [...stored];

      resolveFileDiff(stored, ['a.pdf'], ['novo.pdf']);

      expect(stored).toEqual(snapshot);
    });

    it('não deve mutar o array keptFiles', () => {
      const kept = ['a.pdf'];
      const snapshot = [...kept];

      resolveFileDiff(['a.pdf', 'b.pdf'], kept, ['novo.pdf']);

      expect(kept).toEqual(snapshot);
    });

    it('não deve mutar o array uploaded', () => {
      const uploaded = ['novo.pdf'];
      const snapshot = [...uploaded];

      resolveFileDiff(['a.pdf'], ['a.pdf'], uploaded);

      expect(uploaded).toEqual(snapshot);
    });

    it('deve devolver novos arrays, não referências das entradas', () => {
      const stored = ['a.pdf'];
      const kept = ['a.pdf'];

      const result = resolveFileDiff(stored, kept, []);

      expect(result.finalPaths).not.toBe(stored);
      expect(result.finalPaths).not.toBe(kept);
      expect(result.toRemove).not.toBe(stored);
    });

    it('deve usar stored como fallback sem devolver a mesma referência', () => {
      const stored = ['a.pdf'];

      expect(resolveFileDiff(stored, undefined, []).finalPaths).not.toBe(
        stored,
      );
    });
  });

  // =========================================================================
  // Coerência do resultado
  // =========================================================================
  describe('coerência', () => {
    it('finalPaths e toRemove nunca devem intersectar-se', () => {
      const { finalPaths, toRemove } = resolveFileDiff(
        ['a.pdf', 'b.pdf', 'c.pdf'],
        ['a.pdf', 'c.pdf'],
        ['novo.pdf'],
      );

      const intersecao = finalPaths.filter((p) => toRemove.includes(p));
      expect(intersecao).toEqual([]);
    });

    it('todo o armazenado deve estar em finalPaths ou em toRemove', () => {
      const stored = ['a.pdf', 'b.pdf', 'c.pdf'];
      const { finalPaths, toRemove } = resolveFileDiff(
        stored,
        ['a.pdf'],
        ['novo.pdf'],
      );

      stored.forEach((path) => {
        expect(finalPaths.includes(path) || toRemove.includes(path)).toBe(true);
      });
    });

    it('todos os uploads devem estar em finalPaths', () => {
      const uploaded = ['n1.pdf', 'n2.pdf'];
      const { finalPaths } = resolveFileDiff(['a.pdf'], [], uploaded);

      uploaded.forEach((path) => expect(finalPaths).toContain(path));
    });

    it('nenhum upload deve constar em toRemove', () => {
      const { toRemove } = resolveFileDiff(['a.pdf'], [], ['novo.pdf']);

      expect(toRemove).not.toContain('novo.pdf');
    });
  });

  // =========================================================================
  // Volume
  // =========================================================================
  describe('volume', () => {
    it('deve processar listas grandes corretamente', () => {
      const stored = Array.from({ length: 500 }, (_, i) => `f${i}.pdf`);
      const kept = stored.slice(0, 250);

      const { finalPaths, toRemove } = resolveFileDiff(stored, kept, ['n.pdf']);

      expect(finalPaths).toHaveLength(251);
      expect(toRemove).toHaveLength(250);
    });
  });
});
