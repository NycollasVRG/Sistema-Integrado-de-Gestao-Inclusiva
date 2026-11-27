-- =============================================================================
-- SIGI / CLAI - Sistema Integrado de Gestão Inclusiva
-- Flyway Migration V15: Catálogo de Cargos (CRUD de Cargos para ADMIN e COORDENADOR)
-- Banco de Dados: PostgreSQL 14+ (Schema: sigi)
-- =============================================================================

CREATE TABLE IF NOT EXISTS sigi.cargo (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo VARCHAR(50) NOT NULL,
    nome VARCHAR(100) NOT NULL,
    descricao TEXT,
    nivel_restricao_padrao VARCHAR(50) NOT NULL,
    autorizacao_saude_padrao BOOLEAN NOT NULL DEFAULT FALSE,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    sistema BOOLEAN NOT NULL DEFAULT FALSE,
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    criado_em TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    criado_por UUID,
    atualizado_por UUID,
    CONSTRAINT ck_cargo_nivel_restricao CHECK (
        nivel_restricao_padrao IN ('SUPER_RESTRICAO', 'RESTRICAO_MODERADA', 'ACESSO_FUNCIONAL')
    )
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_cargo_codigo_nao_deletado
    ON sigi.cargo (UPPER(codigo))
    WHERE deleted = FALSE;

CREATE INDEX IF NOT EXISTS idx_cargo_ativo
    ON sigi.cargo (ativo);

COMMENT ON TABLE sigi.cargo IS 'Catálogo institucional de cargos do SIGI/CLAI com nível de restrição padrão e controle de origem do sistema';
COMMENT ON COLUMN sigi.cargo.codigo IS 'Código identificador em UPPER_SNAKE_CASE (único entre cargos ativos/não excluídos)';
COMMENT ON COLUMN sigi.cargo.sistema IS 'Indica se o cargo faz parte dos papéis estruturais de RBAC (protegido contra exclusão e alteração de código)';

INSERT INTO sigi.cargo (
    id, codigo, nome, descricao, nivel_restricao_padrao, autorizacao_saude_padrao, ativo, sistema, deleted, criado_em, atualizado_em
) VALUES
    (
        '11111111-1111-1111-1111-111111111101',
        'ADMIN',
        'Administrador',
        'Administração geral do sistema, gestão de acessos, auditoria e configurações institucionais.',
        'SUPER_RESTRICAO',
        TRUE,
        TRUE,
        TRUE,
        FALSE,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    ),
    (
        '11111111-1111-1111-1111-111111111102',
        'COORDENADOR',
        'Coordenador',
        'Coordenação da CLAI, triagem de indicações, gestão de laudos médicos, planos e cargos.',
        'SUPER_RESTRICAO',
        FALSE,
        TRUE,
        TRUE,
        FALSE,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    ),
    (
        '11111111-1111-1111-1111-111111111103',
        'CLAI_PSICOPEDAGOGO',
        'Psicopedagogo CLAI',
        'Equipe técnica multidisciplinar da CLAI responsável por estudos de caso, atendimentos e acompanhamento.',
        'RESTRICAO_MODERADA',
        TRUE,
        TRUE,
        TRUE,
        FALSE,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    ),
    (
        '11111111-1111-1111-1111-111111111104',
        'PROFESSOR',
        'Professor',
        'Docente responsável por indicações, adaptações DUA, PEI/PEA e relatórios de acompanhamento.',
        'ACESSO_FUNCIONAL',
        FALSE,
        TRUE,
        TRUE,
        FALSE,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    ),
    (
        '11111111-1111-1111-1111-111111111105',
        'ALUNO_APOIADOR',
        'Aluno Apoiador',
        'Estudante apoiador com acesso funcional restrito aos estudantes acompanhados.',
        'ACESSO_FUNCIONAL',
        FALSE,
        TRUE,
        TRUE,
        FALSE,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    )
ON CONFLICT DO NOTHING;
