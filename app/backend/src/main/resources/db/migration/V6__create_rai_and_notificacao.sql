-- =============================================================================
-- SIGI / CLAI - Sistema Integrado de Gestão Inclusiva
-- Flyway Migration V6: Relatórios (RAI/RAE) e Notificações (US 03 / US 09 / US 01 / US 08 / US 10)
-- Banco de Dados: PostgreSQL 14+ (Schema: sigi)
-- =============================================================================

CREATE TABLE IF NOT EXISTS sigi.rai (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    aluno_id UUID NOT NULL,
    pei_id UUID,
    acompanhamento_id UUID,
    tipo_relatorio VARCHAR(20) NOT NULL DEFAULT 'RAI',
    bimestre INTEGER NOT NULL,
    indicativo_regressao BOOLEAN NOT NULL DEFAULT FALSE,
    descricao TEXT,
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    criado_em TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    criado_por UUID,
    atualizado_por UUID,
    CONSTRAINT fk_rai_aluno FOREIGN KEY (aluno_id) REFERENCES sigi.aluno (id),
    CONSTRAINT fk_rai_pei FOREIGN KEY (pei_id) REFERENCES sigi.pei (id),
    CONSTRAINT fk_rai_acompanhamento FOREIGN KEY (acompanhamento_id) REFERENCES sigi.acompanhamento (id),
    CONSTRAINT ck_rai_bimestre CHECK (bimestre BETWEEN 1 AND 4),
    CONSTRAINT ck_rai_tipo_relatorio CHECK (tipo_relatorio IN ('RAI', 'RAE'))
);

CREATE TABLE IF NOT EXISTS sigi.notificacao (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    perfil_destinatario VARCHAR(50) NOT NULL,
    titulo VARCHAR(255) NOT NULL,
    mensagem TEXT NOT NULL,
    link_referencia VARCHAR(255),
    lida BOOLEAN NOT NULL DEFAULT FALSE,
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    criado_em TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    criado_por UUID,
    atualizado_por UUID
);

CREATE INDEX IF NOT EXISTS idx_rai_aluno_criado_em
    ON sigi.rai (aluno_id, criado_em);

CREATE INDEX IF NOT EXISTS idx_notificacao_perfil_lida_criado_em
    ON sigi.notificacao (perfil_destinatario, lida, criado_em DESC);

COMMENT ON TABLE sigi.rai IS
    'Relatório de Acompanhamento Individualizado (RAI) ou Relatório de Atendimento Educacional (RAE), com vínculo ao acompanhamento/PEI do estudante.';
COMMENT ON COLUMN sigi.rai.indicativo_regressao IS
    'TA3.3: sinaliza regressão e dispara notificação pendente ao perfil COORDENADOR para revisão do PEI.';
COMMENT ON TABLE sigi.notificacao IS
    'Infraestrutura compartilhada de notificações por perfil (US 01, US 03, US 08 e US 10).';
