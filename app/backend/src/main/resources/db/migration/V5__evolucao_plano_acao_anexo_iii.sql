-- =============================================================================
-- SIGI / CLAI - Sistema Integrado de Gestão Inclusiva
-- Flyway Migration V5: Evolução da tabela sigi.plano_acao alinhada ao Anexo III
-- Banco de Dados: PostgreSQL 14+ (Schema: sigi)
-- =============================================================================

ALTER TABLE sigi.plano_acao
    ADD COLUMN IF NOT EXISTS componente_curricular VARCHAR(200),
    ADD COLUMN IF NOT EXISTS semestre_ano VARCHAR(30),
    ADD COLUMN IF NOT EXISTS docente VARCHAR(255),
    ADD COLUMN IF NOT EXISTS objetivo_geral TEXT,
    ADD COLUMN IF NOT EXISTS objetivos_especificos TEXT,
    ADD COLUMN IF NOT EXISTS conteudos_programaticos TEXT,
    ADD COLUMN IF NOT EXISTS metodologia TEXT,
    ADD COLUMN IF NOT EXISTS avaliacao TEXT,
    ADD COLUMN IF NOT EXISTS bibliografia_basica TEXT,
    ADD COLUMN IF NOT EXISTS bibliografia_complementar TEXT;

COMMENT ON COLUMN sigi.plano_acao.componente_curricular IS 'Nome do Componente Curricular adaptado no Plano de Ação (Anexo III)';
COMMENT ON COLUMN sigi.plano_acao.semestre_ano IS 'Semestre/Ano letivo de referência (Anexo III)';
COMMENT ON COLUMN sigi.plano_acao.docente IS 'Nome do(a) Docente responsável pelo componente curricular (Anexo III)';
COMMENT ON COLUMN sigi.plano_acao.objetivo_geral IS 'Objetivo geral do componente curricular adaptado ao estudante (Anexo III)';
COMMENT ON COLUMN sigi.plano_acao.objetivos_especificos IS 'Objetivos específicos definidos para o estudante (Anexo III)';
COMMENT ON COLUMN sigi.plano_acao.conteudos_programaticos IS 'Conteúdos programáticos priorizados ou substituídos (Anexo III)';
COMMENT ON COLUMN sigi.plano_acao.metodologia IS 'Estratégias diferenciadas e recursos didáticos aplicados (Anexo III)';
COMMENT ON COLUMN sigi.plano_acao.avaliacao IS 'Instrumentos e formas diferenciadas de avaliação (Anexo III)';
COMMENT ON COLUMN sigi.plano_acao.bibliografia_basica IS 'Bibliografia básica recomendada (Anexo III)';
COMMENT ON COLUMN sigi.plano_acao.bibliografia_complementar IS 'Bibliografia complementar recomendada (Anexo III)';
