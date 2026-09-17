-- =============================================================================
-- IMPORTANTE: este script NÃO é executado automaticamente. Precisa ser aplicado
-- MANUALMENTE pelo Pedro (ou outro responsável pelo banco) diretamente no
-- banco Postgres do projeto.
--
-- ORDEM DE APLICAÇÃO: rode este script ANTES de subir/publicar o código desta
-- branch (feat/user-control) em qualquer ambiente (staging/produção).
-- O motivo: o código novo (entidade User, UsersService, AuthService,
-- UserRepository) já lê e grava as colunas ultimo_acesso,
-- desativado_por_inatividade, excluido e data_exclusao a partir do momento em
-- que for deployado. Se essas colunas ainda não existirem na tabela quando o
-- código novo subir, toda query do Prisma contra novo_tabela_usuarios (login,
-- listagem, criação, desativação, reativação, permissão) vai falhar. Portanto:
-- colunas novas sempre precisam existir no banco ANTES do deploy do código
-- que passa a usá-las.
--
-- Tabela alvo: novo_tabela_usuarios (schema public, nome confirmado em
-- dev/src/infra/prisma/schema.prisma - não há @@map nem @@schema definidos
-- para este model, então o nome da tabela real no Postgres é o mesmo nome
-- do model).
-- =============================================================================

BEGIN;

ALTER TABLE public.novo_tabela_usuarios
  ADD COLUMN IF NOT EXISTS ultimo_acesso TIMESTAMP(3) NULL,
  ADD COLUMN IF NOT EXISTS desativado_por_inatividade BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS excluido BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS data_exclusao TIMESTAMP(3) NULL;

-- Preenche ultimo_acesso dos usuários já existentes com o momento da
-- aplicação deste script, para que a contagem de 60 dias de inatividade
-- comece a partir de agora e não desative em massa usuários antigos que
-- nunca tiveram esse campo preenchido.
UPDATE public.novo_tabela_usuarios
SET ultimo_acesso = NOW()
WHERE ultimo_acesso IS NULL;

COMMIT;
