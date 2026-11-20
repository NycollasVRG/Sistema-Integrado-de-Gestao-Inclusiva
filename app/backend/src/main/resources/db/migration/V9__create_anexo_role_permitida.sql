-- =============================================================================
-- SIGI / CLAI - Sistema Integrado de Gestão Inclusiva
-- Flyway Migration V9: Controle granular de visualização por cargo para Laudos Médicos
-- Banco de Dados: PostgreSQL 14+ (Schema: sigi)
-- =============================================================================

CREATE TABLE IF NOT EXISTS sigi.anexo_role_permitida (
    anexo_estudante_id UUID NOT NULL REFERENCES sigi.anexo_estudante(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL,
    PRIMARY KEY (anexo_estudante_id, role)
);

CREATE INDEX IF NOT EXISTS idx_anexo_role_permitida_anexo_id
    ON sigi.anexo_role_permitida (anexo_estudante_id);

COMMENT ON TABLE sigi.anexo_role_permitida IS 'Cargos (Role) expressamente liberados pela Coordenação da CLAI para visualizar e baixar anexos classificados como LAUDO_MEDICO (LGPD / RBAC dinâmico)';
COMMENT ON COLUMN sigi.anexo_role_permitida.role IS 'Enum Role autorizado adicionalmente ao COORDENADOR (ADMIN, CLAI_PSICOPEDAGOGO, PROFESSOR, ALUNO_APOIADOR)';
