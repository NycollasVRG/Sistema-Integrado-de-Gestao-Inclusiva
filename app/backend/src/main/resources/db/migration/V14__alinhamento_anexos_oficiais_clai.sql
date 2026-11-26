-- =============================================================================
-- SIGI / CLAI - Sistema Integrado de Gestão Inclusiva
-- Flyway Migration V14: Alinhamento fiel aos Anexos Oficiais da CLAI
--   - Anexo II: Plano de Ação da CLAI (substitui campos indevidos da V5)
--   - Anexo V: Relatório de Acompanhamento Individualizado (RAI) + habilidades
--   - Anexo III: Assinaturas de PEA e PEI
-- Banco de Dados: PostgreSQL 14+ (Schema: sigi)
-- =============================================================================

-- 1. ANEXO II: PLANO DE AÇÃO DA CLAI (sigi.plano_acao)
ALTER TABLE sigi.plano_acao
    DROP COLUMN IF EXISTS componente_curricular,
    DROP COLUMN IF EXISTS semestre_ano,
    DROP COLUMN IF EXISTS docente,
    DROP COLUMN IF EXISTS objetivo_geral,
    DROP COLUMN IF EXISTS objetivos_especificos,
    DROP COLUMN IF EXISTS conteudos_programaticos,
    DROP COLUMN IF EXISTS metodologia,
    DROP COLUMN IF EXISTS avaliacao,
    DROP COLUMN IF EXISTS bibliografia_basica,
    DROP COLUMN IF EXISTS bibliografia_complementar;

ALTER TABLE sigi.plano_acao
    ADD COLUMN IF NOT EXISTS periodo_letivo VARCHAR(30),
    ADD COLUMN IF NOT EXISTS periodo_ingresso VARCHAR(30),
    ADD COLUMN IF NOT EXISTS data_nascimento DATE,
    ADD COLUMN IF NOT EXISTS telefone_estudante VARCHAR(30),
    ADD COLUMN IF NOT EXISTS email_estudante VARCHAR(255),
    ADD COLUMN IF NOT EXISTS nome_responsavel VARCHAR(255),
    ADD COLUMN IF NOT EXISTS grau_parentesco_responsavel VARCHAR(100),
    ADD COLUMN IF NOT EXISTS telefone_responsavel VARCHAR(30),
    ADD COLUMN IF NOT EXISTS email_responsavel VARCHAR(255),
    ADD COLUMN IF NOT EXISTS possui_comorbidade BOOLEAN,
    ADD COLUMN IF NOT EXISTS comorbidade_detalhes TEXT,
    ADD COLUMN IF NOT EXISTS usa_medicacao_continua BOOLEAN,
    ADD COLUMN IF NOT EXISTS medicacao_detalhes TEXT,
    ADD COLUMN IF NOT EXISTS frequenta_servicos_apoio BOOLEAN,
    ADD COLUMN IF NOT EXISTS servicos_apoio_detalhes TEXT,
    ADD COLUMN IF NOT EXISTS apresentou_documentos_comprobatorios BOOLEAN,
    ADD COLUMN IF NOT EXISTS documentos_comprobatorios_detalhes TEXT,
    ADD COLUMN IF NOT EXISTS identificacao_necessidades_especificas TEXT,
    ADD COLUMN IF NOT EXISTS relato_percurso_educacional TEXT,
    ADD COLUMN IF NOT EXISTS assinatura_coordenador_clai VARCHAR(255),
    ADD COLUMN IF NOT EXISTS data_assinatura DATE;

COMMENT ON COLUMN sigi.plano_acao.periodo_letivo IS 'Período letivo de referência do Plano de Ação da CLAI (Anexo II)';
COMMENT ON COLUMN sigi.plano_acao.periodo_ingresso IS 'Período de ingresso do estudante na instituição (Anexo II)';
COMMENT ON COLUMN sigi.plano_acao.identificacao_necessidades_especificas IS 'Identificação das necessidades específicas e considerações (Anexo II)';
COMMENT ON COLUMN sigi.plano_acao.relato_percurso_educacional IS 'Relato sistematizado dos avanços, dificuldades e potencialidades no percurso educacional (Anexo II)';
COMMENT ON COLUMN sigi.plano_acao.assinatura_coordenador_clai IS 'Nome/identificação para assinatura do(a) coordenador(a) da CLAI (Anexo II)';

-- 2. ANEXO V: RELATÓRIO DE ACOMPANHAMENTO INDIVIDUALIZADO (sigi.rai)
ALTER TABLE sigi.rai
    ADD COLUMN IF NOT EXISTS periodo_letivo VARCHAR(30),
    ADD COLUMN IF NOT EXISTS componente_curricular VARCHAR(200),
    ADD COLUMN IF NOT EXISTS docente VARCHAR(255),
    ADD COLUMN IF NOT EXISTS relacionamento_opcoes TEXT,
    ADD COLUMN IF NOT EXISTS relacionamento_outros VARCHAR(255),
    ADD COLUMN IF NOT EXISTS relacionamento_comentario TEXT,
    ADD COLUMN IF NOT EXISTS habilidades_cognitivas_opcoes TEXT,
    ADD COLUMN IF NOT EXISTS habilidades_cognitivas_outros VARCHAR(255),
    ADD COLUMN IF NOT EXISTS habilidades_cognitivas_comentario TEXT,
    ADD COLUMN IF NOT EXISTS habilidades_socioemocionais_opcoes TEXT,
    ADD COLUMN IF NOT EXISTS habilidades_socioemocionais_outros VARCHAR(255),
    ADD COLUMN IF NOT EXISTS habilidades_socioemocionais_comentario TEXT,
    ADD COLUMN IF NOT EXISTS avancos_gerais TEXT,
    ADD COLUMN IF NOT EXISTS dificuldades_aprendizagem TEXT,
    ADD COLUMN IF NOT EXISTS fatores_externos TEXT,
    ADD COLUMN IF NOT EXISTS parecer TEXT,
    ADD COLUMN IF NOT EXISTS data_relatorio DATE,
    ADD COLUMN IF NOT EXISTS assinatura_docente VARCHAR(255);

CREATE TABLE IF NOT EXISTS sigi.rai_habilidade (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rai_id UUID NOT NULL,
    ordem INTEGER NOT NULL DEFAULT 0,
    habilidade_desenvolvida TEXT NOT NULL,
    nivel_aprendizado VARCHAR(20) NOT NULL,
    observacoes TEXT,
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    criado_em TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    criado_por UUID,
    atualizado_por UUID,
    CONSTRAINT fk_rai_habilidade_rai FOREIGN KEY (rai_id) REFERENCES sigi.rai (id) ON DELETE CASCADE,
    CONSTRAINT ck_rai_habilidade_nivel CHECK (nivel_aprendizado IN ('SATISFATORIO', 'BOM', 'OTIMO'))
);

CREATE INDEX IF NOT EXISTS idx_rai_habilidade_rai_id
    ON sigi.rai_habilidade (rai_id, ordem);

COMMENT ON TABLE sigi.rai_habilidade IS 'Habilidades e competências desenvolvidas pelo estudante no componente curricular (Anexo V - RAI)';

-- 3. ANEXO III: ASSINATURAS DE PEA E PEI
ALTER TABLE sigi.pea
    ADD COLUMN IF NOT EXISTS assinatura_docente VARCHAR(255),
    ADD COLUMN IF NOT EXISTS data_assinatura DATE;

ALTER TABLE sigi.pei
    ADD COLUMN IF NOT EXISTS assinatura_clai VARCHAR(255),
    ADD COLUMN IF NOT EXISTS assinatura_setor_pedagogico VARCHAR(255),
    ADD COLUMN IF NOT EXISTS assinatura_coordenador_curso VARCHAR(255),
    ADD COLUMN IF NOT EXISTS assinatura_estudante_responsavel VARCHAR(255),
    ADD COLUMN IF NOT EXISTS assinaturas_docentes TEXT;
