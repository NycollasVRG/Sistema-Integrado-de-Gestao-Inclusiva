-- =============================================================================
-- SIGI / CLAI - Sistema Integrado de Gestão Inclusiva
-- Flyway Migration V13: Motor de Alertas Pedagógicos e Dashboard (US 05 / Issue #106)
-- Banco de Dados: PostgreSQL 14+ (Schema: sigi)
-- =============================================================================
-- Implementa a tabela sigi.alerta_pedagogico para armazenar alertas inteligentes
-- emitidos pelo cruzamento do boletim/status acadêmico do SUAP com os PEAs
-- (sigi.pea - US 03) e tags de acessibilidade/dificuldade do estudante
-- (sigi.aluno_tag_dificuldade - US 12):
--   - TA5.1: Alerta VERMELHO para retenção ou iminência/risco de jubilamento
--   - TA5.2: Alerta PEDAGOGICO para incoerência avaliativa (tag "não alfabetizado"
--            ou "estágio silábico" + nota máxima em disciplina teórica sem PEA)
--   - TA5.3: Filtros combinados por unidade, curso e turma
--   - TA5.4: Tratamento ("Cientes/Tratados") com registro de autor e timestamp
-- =============================================================================

CREATE TABLE IF NOT EXISTS sigi.alerta_pedagogico (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    aluno_id UUID NOT NULL REFERENCES sigi.aluno(id),
    tipo_alerta VARCHAR(50) NOT NULL,                 -- Enum TipoAlertaPedagogico: RETENCAO, RISCO_JUBILAMENTO, INCOERENCIA_PEDAGOGICA
    severidade VARCHAR(20) NOT NULL,                  -- Enum SeveridadeAlerta: VERMELHO, PEDAGOGICO
    unidade VARCHAR(100),
    curso VARCHAR(100),
    turma VARCHAR(50),
    descricao TEXT NOT NULL,
    tratado BOOLEAN NOT NULL DEFAULT FALSE,
    tratado_por UUID REFERENCES sigi.usuario(id),
    tratado_em TIMESTAMP,
    -- Campos herdados de BaseEntity (@SoftDelete e Auditoria JPA)
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    criado_por UUID,
    atualizado_por UUID,
    CONSTRAINT ck_alerta_pedagogico_severidade CHECK (
        severidade IN ('VERMELHO', 'PEDAGOGICO')
    ),
    CONSTRAINT ck_alerta_pedagogico_tipo CHECK (
        tipo_alerta IN ('RETENCAO', 'RISCO_JUBILAMENTO', 'INCOERENCIA_PEDAGOGICA')
    ),
    CONSTRAINT ck_alerta_pedagogico_tratado CHECK (
        tratado = FALSE OR tratado_em IS NOT NULL
    )
);

CREATE INDEX IF NOT EXISTS idx_alerta_pedagogico_tratado_criado_em
    ON sigi.alerta_pedagogico (tratado, criado_em DESC);

CREATE INDEX IF NOT EXISTS idx_alerta_pedagogico_filtros
    ON sigi.alerta_pedagogico (tratado, unidade, curso, turma);

CREATE INDEX IF NOT EXISTS idx_alerta_pedagogico_aluno_id
    ON sigi.alerta_pedagogico (aluno_id, criado_em DESC);

CREATE INDEX IF NOT EXISTS idx_alerta_pedagogico_severidade
    ON sigi.alerta_pedagogico (severidade, tratado);

COMMENT ON TABLE sigi.alerta_pedagogico IS
    'Alertas inteligentes de risco acadêmico (retenção/jubilamento) e incoerências pedagógicas (SUAP x PEA/Tags) exibidos no Dashboard da CLAI (US 05).';
COMMENT ON COLUMN sigi.alerta_pedagogico.tipo_alerta IS
    'Classificação do alerta: RETENCAO, RISCO_JUBILAMENTO ou INCOERENCIA_PEDAGOGICA.';
COMMENT ON COLUMN sigi.alerta_pedagogico.severidade IS
    'Nível de severidade do alerta no Dashboard: VERMELHO (TA5.1) ou PEDAGOGICO (TA5.2).';
COMMENT ON COLUMN sigi.alerta_pedagogico.unidade IS
    'Unidade/Campus institucional do estudante no momento do alerta para filtragem pelos coordenadores (TA5.3).';
COMMENT ON COLUMN sigi.alerta_pedagogico.tratado IS
    'Indica se o alerta foi marcado como Ciente/Tratado (TRUE), movendo-o do painel principal para o histórico (TA5.4).';
COMMENT ON COLUMN sigi.alerta_pedagogico.tratado_por IS
    'UUID do usuário autenticado que marcou o alerta como ciente/tratado (TA5.4).';
COMMENT ON COLUMN sigi.alerta_pedagogico.tratado_em IS
    'Data e hora exata em que o alerta foi marcado como ciente/tratado (TA5.4).';
