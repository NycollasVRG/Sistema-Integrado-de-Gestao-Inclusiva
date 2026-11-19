-- =============================================================================
-- SIGI / CLAI - Sistema Integrado de Gestão Inclusiva
-- Flyway Migration V6: Registro de Atendimentos Diários (US 04 / TA9.2)
-- Banco de Dados: PostgreSQL 14+ (Schema: sigi)
-- =============================================================================
-- Substitui o mock em localStorage da US 04 por persistência real e habilita a
-- agregação de atendimentos na Linha do Tempo do aluno (US 09 / TA9.2).
--
-- Regra de negócio associada (aplicada na camada de serviço, não no banco):
--   somente o autor (criado_por) pode editar o relato, e apenas dentro de 24h
--   contadas a partir de criado_em. Por isso criado_em e criado_por são NOT NULL
--   nesta tabela: sem eles a trava de 24h não teria como ser avaliada.
-- =============================================================================

CREATE TABLE IF NOT EXISTS sigi.atendimento (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    aluno_id UUID NOT NULL REFERENCES sigi.aluno(id),
    tipo_atendimento VARCHAR(30) NOT NULL,          -- Enum TipoAtendimento: PEDAGOGICO, PSICOLOGICO, ASSISTENCIA_SOCIAL, ACESSIBILIDADE, MULTIDISCIPLINAR
    data_atendimento DATE NOT NULL,
    profissional_responsavel VARCHAR(255) NOT NULL,
    descricao TEXT NOT NULL,                        -- Relato / síntese do atendimento (editável pelo autor por 24h)
    encaminhamentos TEXT,
    -- Campos herdados de BaseEntity (@SoftDelete e Auditoria JPA)
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    criado_por UUID NOT NULL,
    atualizado_por UUID,
    CONSTRAINT ck_atendimento_tipo CHECK (
        tipo_atendimento IN ('PEDAGOGICO', 'PSICOLOGICO', 'ASSISTENCIA_SOCIAL', 'ACESSIBILIDADE', 'MULTIDISCIPLINAR')
    )
);

-- Timeline (US 09) e listagem por aluno: filtro por aluno + ordenação por criação
CREATE INDEX IF NOT EXISTS idx_atendimento_aluno_criado_em
    ON sigi.atendimento (aluno_id, criado_em);

COMMENT ON TABLE sigi.atendimento IS 'Registros de atendimentos diários realizados ao estudante (US 04), exibidos na Linha do Tempo (US 09)';
COMMENT ON COLUMN sigi.atendimento.tipo_atendimento IS 'Natureza do atendimento (enum TipoAtendimento)';
COMMENT ON COLUMN sigi.atendimento.data_atendimento IS 'Data em que o atendimento ocorreu (informada pelo profissional; difere de criado_em)';
COMMENT ON COLUMN sigi.atendimento.descricao IS 'Relato/síntese do atendimento. Dado sensível: editável somente pelo autor em até 24h após criado_em';
COMMENT ON COLUMN sigi.atendimento.criado_em IS 'Marco inicial da janela de 24h de edição do relato';
COMMENT ON COLUMN sigi.atendimento.criado_por IS 'Autor do registro (sigi.usuario.id); imutável e único autorizado a editar o relato';
