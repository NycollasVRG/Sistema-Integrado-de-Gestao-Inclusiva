-- =============================================================================
-- SIGI / CLAI - Sistema Integrado de Gestão Inclusiva
-- Flyway Migration V4: Evolução de Estudo de Caso (Histórico e Versionamento)
-- Banco de Dados: PostgreSQL 14+ (Schema: sigi)
-- =============================================================================

-- 1. Adiciona campo de histórico geral (TA2.3) e colunas de versionamento (TA2.4)
ALTER TABLE sigi.estudo_de_caso
    ADD COLUMN IF NOT EXISTS historico TEXT,
    ADD COLUMN IF NOT EXISTS versao INTEGER NOT NULL DEFAULT 1,
    ADD COLUMN IF NOT EXISTS estudo_origem_id UUID REFERENCES sigi.estudo_de_caso(id);

-- 2. Índice para consultas de cadeia de versionamento por estudo original
CREATE INDEX IF NOT EXISTS idx_estudo_de_caso_origem_id
    ON sigi.estudo_de_caso (estudo_origem_id);

-- 3. Metadados de documentação
COMMENT ON COLUMN sigi.estudo_de_caso.historico IS 'Histórico acadêmico e clínico geral do estudante obrigatório para conclusão do estudo (TA2.3)';
COMMENT ON COLUMN sigi.estudo_de_caso.versao IS 'Número sequencial da versão do estudo de caso para o estudante (TA2.4)';
COMMENT ON COLUMN sigi.estudo_de_caso.estudo_origem_id IS 'Referência auto-relacionada ao estudo de caso original da cadeia de versões (TA2.4)';
