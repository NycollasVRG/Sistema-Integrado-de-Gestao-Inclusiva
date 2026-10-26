-- =============================================================================
-- SIGI / CLAI - Sistema Integrado de Gestão Inclusiva
-- Script DDL 02: Alterações Idempotentes, Constraints, Índices e Comentários
-- Banco de Dados: PostgreSQL 14+ (Schema: sigi)
-- =============================================================================
-- Consolida as regras de negócio de banco (TA2.4, TA11.1, TA11.3, TA11.4),
-- índices de performance (Timeline US 09, Prontuário e RBAC) e documentação
-- de colunas sensíveis (LGPD).
-- =============================================================================

-- 1. Garantia idempotente de colunas sensíveis em bancos pré-existentes (Task #52 / TA11.3)
ALTER TABLE sigi.estudo_de_caso
    ADD COLUMN IF NOT EXISTS historico_familiar TEXT,
    ADD COLUMN IF NOT EXISTS historico_socioemocional TEXT;

-- 2. Critério de Aceite US 02 (TA2.4):
-- Impedir dois Estudos de Caso com status ATIVO simultâneos (não excluídos) para o mesmo aluno
CREATE UNIQUE INDEX IF NOT EXISTS idx_estudo_caso_ativo
    ON sigi.estudo_de_caso (aluno_id)
    WHERE status = 'ATIVO' AND deleted = FALSE;

-- 3. Índices de Autenticação e RBAC (US 11 / Task #50)
CREATE INDEX IF NOT EXISTS idx_usuario_email
    ON sigi.usuario (email);

CREATE INDEX IF NOT EXISTS idx_usuario_role
    ON sigi.usuario (role);

-- 4. Índices de Anexos e Laudos Criptografados (US 11 / Task #51)
CREATE INDEX IF NOT EXISTS idx_anexo_estudante_aluno_id
    ON sigi.anexo_estudante (aluno_id);

CREATE INDEX IF NOT EXISTS idx_anexo_estudante_classificacao
    ON sigi.anexo_estudante (classificacao);

-- 5. Índices de Performance para Relacionamentos e Timeline / Prontuário Unificado (US 03 / US 09)
CREATE INDEX IF NOT EXISTS idx_estudo_de_caso_aluno_id
    ON sigi.estudo_de_caso (aluno_id);

CREATE INDEX IF NOT EXISTS idx_acompanhamento_aluno_id
    ON sigi.acompanhamento (aluno_id);

CREATE INDEX IF NOT EXISTS idx_plano_acao_acompanhamento_id
    ON sigi.plano_acao (acompanhamento_id);

CREATE INDEX IF NOT EXISTS idx_pei_acompanhamento_id
    ON sigi.pei (acompanhamento_id);

CREATE INDEX IF NOT EXISTS idx_pea_acompanhamento_id
    ON sigi.pea (acompanhamento_id);

-- 6. Comentários de Metadados e Governança LGPD (Task #50, #51 e #52)
COMMENT ON SCHEMA sigi IS 'Schema principal do Sistema Integrado de Gestão Inclusiva (SIGI/CLAI)';

COMMENT ON TABLE sigi.usuario IS 'Usuários do sistema com controle de acesso RBAC granular e versão de sessão JWT (US 11 / Task #50)';
COMMENT ON COLUMN sigi.usuario.nivel_restricao IS 'Nível de acesso ao prontuário: SUPER_RESTRICAO, RESTRICAO_MODERADA ou ACESSO_FUNCIONAL';
COMMENT ON COLUMN sigi.usuario.autorizacao_saude IS 'Flag de sigilo médico (AUTH_SAUDE) exigida para descriptografia de laudos em memória (TA11.2)';
COMMENT ON COLUMN sigi.usuario.acesso_ativo IS 'Indica se o vínculo do usuário está ativo; quando FALSE bloqueia imediatamente o uso de JWTs (TA11.4)';
COMMENT ON COLUMN sigi.usuario.token_version IS 'Versão incremental do token JWT para invalidação instantânea de sessões anteriores (TA11.4)';

COMMENT ON TABLE sigi.estudo_de_caso IS 'Estudos de caso dos estudantes, contendo diagnóstico inicial e históricos sensíveis (US 02 / US 11)';
COMMENT ON COLUMN sigi.estudo_de_caso.historico_familiar IS 'Dados de histórico e dinâmica familiar (sensível - exibido apenas para RESTRICAO_MODERADA ou superior - TA11.3)';
COMMENT ON COLUMN sigi.estudo_de_caso.historico_socioemocional IS 'Registros do desenvolvimento socioemocional e relacional (sensível - exibido apenas para RESTRICAO_MODERADA ou superior - TA11.3)';

COMMENT ON TABLE sigi.anexo_estudante IS 'Metadados de anexos do estudante e parâmetros de criptografia autenticada AES-256-GCM (US 11 / Task #51)';
COMMENT ON COLUMN sigi.anexo_estudante.iv IS 'Initialization Vector de 12 bytes (Base64) utilizado pelo motor AES/GCM/NoPadding (TA11.1)';
