-- =============================================================================
-- SIGI / CLAI - Sistema Integrado de Gestão Inclusiva
-- Flyway Migration V3: Alinhamento Fiel do PEI e PEA ao Anexo III
-- Banco de Dados: PostgreSQL 14+ (Schema: sigi)
-- =============================================================================

-- 1. Evolução da tabela sigi.pei (Anexo III - Plano Educacional Individualizado)
ALTER TABLE sigi.pei
    ADD COLUMN IF NOT EXISTS semestre_ano VARCHAR(30),
    ADD COLUMN IF NOT EXISTS historico_estudante TEXT,
    ADD COLUMN IF NOT EXISTS necessidades_especificas TEXT,
    ADD COLUMN IF NOT EXISTS dificuldades_apresentadas TEXT;

-- 2. Evolução da tabela sigi.pea (Anexo III - Plano de Ensino Adaptado)
ALTER TABLE sigi.pea
    ADD COLUMN IF NOT EXISTS pei_id UUID REFERENCES sigi.pei(id),
    ADD COLUMN IF NOT EXISTS componente_curricular VARCHAR(200),
    ADD COLUMN IF NOT EXISTS semestre_ano VARCHAR(30),
    ADD COLUMN IF NOT EXISTS docente VARCHAR(255),
    ADD COLUMN IF NOT EXISTS objetivos_especificos TEXT,
    ADD COLUMN IF NOT EXISTS conteudos_programaticos TEXT,
    ADD COLUMN IF NOT EXISTS bibliografia_basica TEXT,
    ADD COLUMN IF NOT EXISTS bibliografia_complementar TEXT;

-- 3. Índice para vínculo direto entre PEA e PEI
CREATE INDEX IF NOT EXISTS idx_pea_pei_id
    ON sigi.pea (pei_id);

-- 4. Metadados de documentação das colunas do Anexo III
COMMENT ON COLUMN sigi.pei.semestre_ano IS 'Semestre/Ano letivo de referência do PEI (Anexo III)';
COMMENT ON COLUMN sigi.pei.historico_estudante IS 'Histórico (antes e na instituição) preenchido pela Equipe Pedagógica, Assistência Estudantil e CLAI (Anexo III)';
COMMENT ON COLUMN sigi.pei.necessidades_especificas IS 'Detalhamento das condições do estudante e recursos de acessibilidade necessários (Anexo III)';
COMMENT ON COLUMN sigi.pei.dificuldades_apresentadas IS 'Dificuldades apresentadas pelo estudante registradas pela Equipe Pedagógica e CLAI (Anexo III)';

COMMENT ON COLUMN sigi.pea.pei_id IS 'Referência opcional/direta ao PEI que este Plano de Ensino Adaptado integra (Anexo III)';
COMMENT ON COLUMN sigi.pea.componente_curricular IS 'Nome do Componente Curricular adaptado pelo docente (Anexo III)';
COMMENT ON COLUMN sigi.pea.semestre_ano IS 'Semestre/Ano letivo do Componente Curricular adaptado (Anexo III)';
COMMENT ON COLUMN sigi.pea.docente IS 'Nome do(a) Docente responsável pelo Componente Curricular (Anexo III)';
COMMENT ON COLUMN sigi.pea.objetivos_especificos IS 'Objetivos específicos definidos para o(a) estudante foco das adaptações curriculares (Anexo III)';
COMMENT ON COLUMN sigi.pea.conteudos_programaticos IS 'Conteúdos programáticos priorizados ou adaptados para o estudante (Anexo III)';
COMMENT ON COLUMN sigi.pea.bibliografia_basica IS 'Bibliografia básica do componente curricular (Título/Periódico; Autor; Ed.; Local; Editora; Ano; LT)';
COMMENT ON COLUMN sigi.pea.bibliografia_complementar IS 'Bibliografia complementar do componente curricular (Título/Periódico; Autor; Ed.; Local; Editora; Ano; LT)';
