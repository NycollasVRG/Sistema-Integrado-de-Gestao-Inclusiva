-- =============================================================================
-- SIGI / CLAI - Sistema Integrado de Gestão Inclusiva
-- Flyway Migration V6: Suporte a URL de foto do estudante (US 09 / TA9.1)
-- Banco de Dados: PostgreSQL 14+ (Schema: sigi)
-- =============================================================================

ALTER TABLE sigi.aluno
    ADD COLUMN IF NOT EXISTS foto_url VARCHAR(1000);

COMMENT ON COLUMN sigi.aluno.foto_url IS 'URL da foto de identificação do estudante exibida no cabeçalho do prontuário (TA9.1)';
