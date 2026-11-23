-- =============================================================================
-- SIGI / CLAI - Sistema Integrado de Gestão Inclusiva
-- Flyway Migration V12: Trilha de Auditoria Imutável (US 06 - Dossiês Jurídicos)
-- Banco de Dados: PostgreSQL 14+ (Schema: sigi)
-- =============================================================================
-- Implementa a tabela imutável sigi.audit_log para rastreabilidade de ações
-- CRUD em documentos, disparos de notificações/e-mails e exportação de dossiês
-- de defesa institucional (MPF/BDL) conforme TA6.1 e TA6.3:
--   - Sem coluna deleted / sem @SoftDelete
--   - Append-only na camada de aplicação (sem operações de UPDATE ou DELETE)
-- =============================================================================

CREATE TABLE IF NOT EXISTS sigi.audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID,
    acao VARCHAR(100) NOT NULL,
    entidade VARCHAR(100) NOT NULL,
    entidade_id UUID,
    endpoint VARCHAR(500) NOT NULL,
    metodo_http VARCHAR(20) NOT NULL,
    detalhes TEXT,
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_log_timestamp
    ON sigi.audit_log (timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_audit_log_usuario_id
    ON sigi.audit_log (usuario_id, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_audit_log_entidade
    ON sigi.audit_log (entidade, entidade_id, timestamp DESC);

COMMENT ON TABLE sigi.audit_log IS
    'Trilha de auditoria estritamente imutável (append-only, sem @SoftDelete) de ações CRUD em documentos e interações do sistema (US 06 / TA6.1 / TA6.3).';
COMMENT ON COLUMN sigi.audit_log.usuario_id IS
    'Identificador do usuário autenticado responsável pela ação; nulo apenas em disparos automáticos do sistema/jobs.';
COMMENT ON COLUMN sigi.audit_log.acao IS
    'Tipo da ação executada (ex.: INSERCAO, ATUALIZACAO, DELECAO, DISPARO_NOTIFICACAO, EXPORTACAO_DOSSIE).';
COMMENT ON COLUMN sigi.audit_log.entidade IS
    'Nome canônico da entidade ou recurso auditado (ex.: ESTUDO_DE_CASO, PEI, PEA, PLANO_ACAO, ATA_REUNIAO, ATENDIMENTO, RAI, ANEXO_ESTUDANTE, NOTIFICACAO).';
COMMENT ON COLUMN sigi.audit_log.entidade_id IS
    'Identificador UUID do registro afetado, quando disponível.';
COMMENT ON COLUMN sigi.audit_log.endpoint IS
    'URI/endpoint acessado ou origem interna da operação auditada.';
COMMENT ON COLUMN sigi.audit_log.metodo_http IS
    'Método HTTP da requisição (POST, PUT, PATCH, DELETE, GET) ou SYSTEM para disparos internos.';
COMMENT ON COLUMN sigi.audit_log.detalhes IS
    'Resumo estruturado de rastreabilidade (incluindo vínculo com alunoId, status e metadados não sensíveis).';
COMMENT ON COLUMN sigi.audit_log.timestamp IS
    'Data e hora exata do registro de auditoria.';
