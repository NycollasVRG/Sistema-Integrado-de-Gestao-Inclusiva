-- =============================================================================
-- SIGI / CLAI - Sistema Integrado de Gestão Inclusiva
-- Flyway Migration V10: Gestão de Indicações e Demanda Espontânea (US 10)
-- Banco de Dados: PostgreSQL 14+ (Schema: sigi)
-- =============================================================================
-- Implementa o fluxo preventivo de demanda espontânea (TA10.1, TA10.2, TA10.3):
--   1. sigi.indicacao            - Registro da indicação, status de triagem e decisão da CLAI
--   2. sigi.indicacao_disciplina - Lista de disciplinas onde a dificuldade foi observada
-- =============================================================================

CREATE TABLE IF NOT EXISTS sigi.indicacao (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    aluno_id UUID NOT NULL REFERENCES sigi.aluno(id),
    solicitante_id UUID NOT NULL REFERENCES sigi.usuario(id),
    justificativa_pedagogica TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDENTE', -- Enum StatusIndicacao: PENDENTE, APROVADA, REJEITADA
    justificativa_decisao TEXT,
    decidido_por UUID REFERENCES sigi.usuario(id),
    decidido_em TIMESTAMP,
    status_aluno_anterior VARCHAR(20),              -- Enum StatusAluno: preserva o status antes de EM_TRIAGEM
    estudo_de_caso_id UUID REFERENCES sigi.estudo_de_caso(id),
    -- Campos herdados de BaseEntity (@SoftDelete e Auditoria JPA)
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    criado_por UUID,
    atualizado_por UUID,
    CONSTRAINT ck_indicacao_status CHECK (
        status IN ('PENDENTE', 'APROVADA', 'REJEITADA')
    ),
    CONSTRAINT ck_indicacao_status_aluno_anterior CHECK (
        status_aluno_anterior IS NULL
        OR status_aluno_anterior IN ('ATIVO', 'EM_TRIAGEM', 'INATIVO', 'EVADIDO')
    )
);

CREATE TABLE IF NOT EXISTS sigi.indicacao_disciplina (
    indicacao_id UUID NOT NULL REFERENCES sigi.indicacao(id) ON DELETE CASCADE,
    disciplina VARCHAR(150) NOT NULL,
    PRIMARY KEY (indicacao_id, disciplina)
);

CREATE INDEX IF NOT EXISTS idx_indicacao_aluno_criado_em
    ON sigi.indicacao (aluno_id, criado_em DESC);

CREATE INDEX IF NOT EXISTS idx_indicacao_status_criado_em
    ON sigi.indicacao (status, criado_em DESC);

CREATE INDEX IF NOT EXISTS idx_indicacao_solicitante_id
    ON sigi.indicacao (solicitante_id);

CREATE INDEX IF NOT EXISTS idx_indicacao_disciplina_indicacao_id
    ON sigi.indicacao_disciplina (indicacao_id);

COMMENT ON TABLE sigi.indicacao IS
    'Indicações pedagógicas de demanda espontânea para triagem preventiva pela equipe CLAI (US 10).';
COMMENT ON COLUMN sigi.indicacao.justificativa_pedagogica IS
    'Relato pedagógico obrigatório enviado pelo solicitante (TA10.1).';
COMMENT ON COLUMN sigi.indicacao.status IS
    'Estado da triagem da indicação: PENDENTE, APROVADA ou REJEITADA (TA10.3).';
COMMENT ON COLUMN sigi.indicacao.justificativa_decisao IS
    'Justificativa documentada pela CLAI na decisão (obrigatória em caso de REJEITADA - TA10.3).';
COMMENT ON COLUMN sigi.indicacao.estudo_de_caso_id IS
    'Referência ao rascunho de Estudo de Caso iniciado automaticamente quando a indicação é aprovada (TA10.3).';
COMMENT ON TABLE sigi.indicacao_disciplina IS
    'Disciplinas onde foram observadas barreiras de aprendizagem na indicação (TA10.1).';
