-- Tabela: Disponibilidade de Recursos CCM - Apoio a Contingência
-- Criação aditiva e idempotente. Schema: construcao_sp.
-- Para reverter: DROP TABLE IF EXISTS construcao_sp.recursos_contingencia;

CREATE TABLE IF NOT EXISTS construcao_sp.recursos_contingencia (
    id                     SERIAL       PRIMARY KEY,
    dia_disponibilidade    DATE         NOT NULL,
    parceira               VARCHAR(100) NOT NULL,
    tipo_recurso_mao_obra  VARCHAR(100) NOT NULL,
    quantidade_mao_obra    INTEGER      NOT NULL DEFAULT 0,
    tipo_recurso_equipe    VARCHAR(100) NOT NULL,
    quantidade_equipe      INTEGER      NOT NULL DEFAULT 0,
    disponibilizado_csd    VARCHAR(100) NOT NULL,
    id_usuario             INTEGER,
    criado_em              TIMESTAMP    DEFAULT now(),
    CONSTRAINT fk_usuario_contingencia
        FOREIGN KEY (id_usuario)
        REFERENCES construcao_sp.novo_tabela_usuarios (id)
        ON DELETE NO ACTION
        ON UPDATE NO ACTION
);
