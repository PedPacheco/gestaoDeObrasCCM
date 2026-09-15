/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const SQL_SCHEMA_POSTGRES = `-- =========================================================================
-- SIGO (Sistema de Gestão de Obras) - Módulo: Acompanhamento de Núcleos (SMS - Geral)
-- Script de Criação de Tabela para o Banco de Dados (PostgreSQL)
-- =========================================================================

CREATE TABLE sigo_nucleos_sms_geral (
    id VARCHAR(50) PRIMARY KEY,
    
    -- 1. Informações Gerais
    regional VARCHAR(100) NOT NULL,
    municipio VARCHAR(100) NOT NULL,
    nucleo VARCHAR(100) NOT NULL UNIQUE,
    tipo_rede VARCHAR(50) NOT NULL,
    tecnologia VARCHAR(50) NOT NULL,
    
    -- 2. Status e Entrega
    status_nucleo VARCHAR(50) NOT NULL DEFAULT 'Planejado',
    data_entrega_perdas DATE,
    resp_entrega VARCHAR(150),
    
    -- 3. Parceiras
    parceira_sigo VARCHAR(150),
    parceira_responsavel VARCHAR(150),
    
    -- 4. Pendências e Relatório Final
    envio_pendencia_relatorio_final DATE,
    prazo_conclusao_pendencias_relatorio_final DATE,
    
    -- 5. Ligações
    ligacoes_executadas_campo INT DEFAULT 0,
    ligacoes_notas_baixadas INT DEFAULT 0,
    
    -- 6. Restrições (Meio Ambiente, Poder Público, CHI)
    meio_ambiente_status VARCHAR(50) DEFAULT 'Liberado',
    meio_ambiente_restricao_clientes INT DEFAULT 0,
    poder_publico_status VARCHAR(50) DEFAULT 'Liberado',
    poder_publico_restricao_clientes INT DEFAULT 0,
    chi_status VARCHAR(50) DEFAULT 'Liberado',
    chi_restricao_clientes INT DEFAULT 0,
    
    -- 7. Conjunto & CHI
    conjunto VARCHAR(150),
    chi_necessario INT DEFAULT 0,
    chi_limite_btzero INT DEFAULT 0,
    chi_consumido_btzero INT DEFAULT 0,
    chi_disponivel_btzero INT GENERATED ALWAYS AS (chi_limite_btzero - chi_consumido_btzero) STORED,
    oportunidade_chi VARCHAR(50) DEFAULT 'Não',
    
    -- 8. Progresso de Obras % e Prazos
    status_andamento_construcao INT DEFAULT 0 CHECK (status_andamento_construcao BETWEEN 0 AND 100),
    prazo_conclusao_construcao DATE,
    status_andamento_regularizacao INT DEFAULT 0 CHECK (status_andamento_regularizacao BETWEEN 0 AND 100),
    prazo_conclusao_regularizacao DATE,
    status_andamento_desativacao INT DEFAULT 0 CHECK (status_andamento_desativacao BETWEEN 0 AND 100),
    prazo_conclusao_desativacao DATE,
    prioridade_finalizacao VARCHAR(20) DEFAULT 'Média',
    observacoes_gerais TEXT,
    
    -- Metadados do Sistema
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices recomendados para otimização das buscas e filtros do SIGO
CREATE INDEX idx_sigo_nucleos_regional ON sigo_nucleos_sms_geral (regional);
CREATE INDEX idx_sigo_nucleos_status ON sigo_nucleos_sms_geral (status_nucleo);
CREATE INDEX idx_sigo_nucleos_municipio ON sigo_nucleos_sms_geral (municipio);
CREATE INDEX idx_sigo_nucleos_prioridade ON sigo_nucleos_sms_geral (prioridade_finalizacao);
`;

export const SQL_INSERT_SEEDS = `-- =========================================================================
-- Seeds para Popular o Banco de Dados com Dados de Teste
-- =========================================================================

INSERT INTO sigo_nucleos_sms_geral (
    id, regional, municipio, nucleo, tipo_rede, tecnologia, 
    status_nucleo, data_entrega_perdas, resp_entrega, parceira_sigo, 
    parceira_responsavel, envio_pendencia_relatorio_final, 
    prazo_conclusao_pendencias_relatorio_final, ligacoes_executadas_campo, 
    ligacoes_notas_baixadas, meio_ambiente_status, meio_ambiente_restricao_clientes, 
    poder_publico_status, poder_publico_restricao_clientes, chi_status, 
    chi_restricao_clientes, conjunto, chi_necessario, chi_limite_btzero, 
    chi_consumido_btzero, oportunidade_chi, status_andamento_construcao, 
    prazo_conclusao_construcao, status_andamento_regularizacao, 
    prazo_conclusao_regularizacao, status_andamento_desativacao, 
    prazo_conclusao_desativacao, prioridade_finalizacao, observacoes_gerais
) VALUES (
    '1', 'SP - Capital', 'São Paulo', 'NUC-SPO-BERRINI-01', 'FTTH', 'XGS-PON', 
    'Ativo', '2026-02-15', 'Carlos Eduardo Santos', 'Telemont S/A', 
    'Engeselt Ltda', '2026-03-01', '2026-03-20', 1450, 
    1420, 'Liberado', 0, 'Liberado', 0, 'Liberado', 
    0, 'SE BERRINI - CJ 04', 120, 250, 180, 'Não', 100, 
    '2026-01-30', 100, '2026-02-15', 0, NULL, 'Baixa', 
    'Núcleo totalmente concluído e em plena operação comercial. Sem pendências.'
), (
    '2', 'SP - Interior', 'Campinas', 'NUC-CPQ-BARAO-04', 'FTTH', 'GPON', 
    'Em Construção', '2026-05-10', 'Mariana Azevedo', 'Sertel Engenharia', 
    'Sertel Engenharia', '2026-06-05', '2026-06-30', 680, 
    410, 'Pendente', 12, 'Liberado', 0, 'Pendente', 
    5, 'SE COOP - CJ 12', 80, 150, 150, 'Sim', 85, 
    '2026-07-20', 40, '2026-08-15', 0, NULL, 'Alta', 
    'Aguardando licença ambiental para cruzamento de via férrea. CHI limite esgotado.'
);
`;

export const BACKEND_CONTROLLER_CODE = `/**
 * Controller em Node.js (Express & PostgreSQL usando pg-pool)
 * para a Nova Rotina do SIGO - Controle de Núcleos SMS Geral
 */
import { Request, Response } from 'express';
import { Pool } from 'pg';

// Pool do Postgres (ajustar variáveis de ambiente conforme infraestrutura do SIGO)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

/**
 * GET /api/nucleos
 * Retorna todos os núcleos cadastrados com paginação e filtros dinâmicos
 */
export async function getNucleos(req: Request, res: Response) {
  try {
    const { regional, statusNucleo, prioridade, search } = req.query;
    
    let queryText = 'SELECT *, (chi_limite_btzero - chi_consumido_btzero) AS chi_disponivel_btzero FROM sigo_nucleos_sms_geral WHERE 1=1';
    const queryParams: any[] = [];
    
    if (regional) {
      queryParams.push(regional);
      queryText += \` AND regional = \$\${queryParams.length}\`;
    }
    
    if (statusNucleo) {
      queryParams.push(statusNucleo);
      queryText += \` AND status_nucleo = \$\${queryParams.length}\`;
    }
    
    if (prioridade) {
      queryParams.push(prioridade);
      queryText += \` AND prioridade_finalizacao = \$\${queryParams.length}\`;
    }
    
    if (search) {
      queryParams.push(\`%\${search}%\`);
      queryText += \` AND (nucleo ILIKE \$\${queryParams.length} OR municipio ILIKE \$\${queryParams.length})\`;
    }
    
    queryText += ' ORDER BY prioridade_finalizacao = \\'Alta\\' DESC, criado_em DESC';
    
    const { rows } = await pool.query(queryText, queryParams);
    return res.status(200).json({ success: true, data: rows });
  } catch (error: any) {
    console.error('Erro ao buscar núcleos no SIGO:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * POST /api/nucleos
 * Cria um novo núcleo de acompanhamento no SIGO
 */
export async function createNucleo(req: Request, res: Response) {
  try {
    const data = req.body;
    const queryText = \`
      INSERT INTO sigo_nucleos_sms_geral (
        id, regional, municipio, nucleo, tipo_rede, tecnologia, 
        status_nucleo, data_entrega_perdas, resp_entrega, parceira_sigo, 
        parceira_responsavel, envio_pendencia_relatorio_final, 
        prazo_conclusao_pendencias_relatorio_final, ligacoes_executadas_campo, 
        ligacoes_notas_baixadas, meio_ambiente_status, meio_ambiente_restricao_clientes, 
        poder_publico_status, poder_publico_restricao_clientes, chi_status, 
        chi_restricao_clientes, conjunto, chi_necessario, chi_limite_btzero, 
        chi_consumido_btzero, oportunidade_chi, status_andamento_construcao, 
        prazo_conclusao_construcao, status_andamento_regularizacao, 
        prazo_conclusao_regularizacao, status_andamento_desativacao, 
        prazo_conclusao_desativacao, prioridade_finalizacao, observacoes_gerais
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, 
        $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, 
        $30, $31, $32, $33, $34
      ) RETURNING *
    \`;
    
    const id = 'nuc_' + Math.random().toString(36).substr(2, 9);
    const params = [
      id, data.regional, data.municipio, data.nucleo, data.tipoRede, data.tecnologia,
      data.statusNucleo || 'Planejado', data.dataEntregaPerdas || null, data.respEntrega,
      data.parceiraSigo, data.parceiraResponsavel, data.envioPendenciaRelatorioFinal || null,
      data.prazoConclusaoPendenciasRelatorioFinal || null, data.ligacoesExecutadasCampo || 0,
      data.ligacoesNotasBaixadas || 0, data.meioAmbienteStatus || 'Liberado', data.meioAmbienteRestricaoClientes || 0,
      data.poderPublicoStatus || 'Liberado', data.poderPublicoRestricaoClientes || 0, data.chiStatus || 'Liberado',
      data.chiRestricaoClientes || 0, data.conjunto, data.chiNecessario || 0, data.chiLimiteBtzero || 0,
      data.chiConsumidoBtzero || 0, data.oportunidadeChi || 'Não', data.statusAndamentoConstrucao || 0,
      data.prazoConclusaoConstrucao || null, data.statusAndamentoRegularizacao || 0, data.prazoConclusaoRegularizacao || null,
      data.statusAndamentoDesativacao || 0, data.prazoConclusaoDesativacao || null, data.prioridadeFinalizacao || 'Média',
      data.observacoesGerais
    ];
    
    const { rows } = await pool.query(queryText, params);
    return res.status(201).json({ success: true, data: rows[0] });
  } catch (error: any) {
    console.error('Erro ao salvar núcleo no banco do SIGO:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
`;
