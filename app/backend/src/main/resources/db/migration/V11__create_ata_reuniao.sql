-- =============================================================================
-- SIGI / CLAI - Sistema Integrado de Gestão Inclusiva
-- Flyway Migration V11: Gestão e Acompanhamento de Atas de Reunião (US 08)
-- Banco de Dados: PostgreSQL 14+ (Schema: sigi)
-- =============================================================================
-- Implementa a formalização de reuniões pedagógicas e de alinhamento com famílias
-- (TA8.1, TA8.2, TA8.3, TA8.4), alimentando a Linha do Tempo (US 09 / TA9.2) e o
-- futuro Dossiê Jurídico (US 06):
--   1. sigi.ata_reuniao       - Ata, pauta, deliberações, status e documento assinado cifrado
--   2. sigi.ata_assinatura    - Registro auditável de assinaturas digitais dos participantes
--   3. sigi.ata_compromisso   - Compromissos/prazos com responsável designado e controle de lembrete
--   4. sigi.ata_termo_aditivo - Termos aditivos explicativos para atas FINALIZADAS (imutabilidade)
--   5. sigi.notificacao       - Evolução com usuario_destinatario_id para lembretes individuais (TA8.3)
-- =============================================================================

CREATE TABLE IF NOT EXISTS sigi.ata_reuniao (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    aluno_id UUID NOT NULL REFERENCES sigi.aluno(id),
    tipo_reuniao VARCHAR(30) NOT NULL,                 -- Enum TipoReuniao: PEDAGOGICA, ALINHAMENTO_FAMILIA
    data_reuniao TIMESTAMP NOT NULL,
    local_reuniao VARCHAR(255),
    pauta TEXT NOT NULL,
    deliberacoes TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'RASCUNHO',    -- Enum StatusAta: RASCUNHO, FINALIZADA
    -- Metadados do documento assinado armazenado cifrado via CryptoStorageService (TA8.1)
    documento_nome_original VARCHAR(255),
    documento_content_type VARCHAR(100),
    documento_tamanho_bytes BIGINT,
    documento_caminho VARCHAR(500),
    documento_iv VARCHAR(64),
    finalizada_em TIMESTAMP,
    finalizada_por UUID REFERENCES sigi.usuario(id),
    -- Campos herdados de BaseEntity (@SoftDelete e Auditoria JPA)
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    criado_por UUID NOT NULL,
    atualizado_por UUID,
    CONSTRAINT ck_ata_reuniao_tipo CHECK (
        tipo_reuniao IN ('PEDAGOGICA', 'ALINHAMENTO_FAMILIA')
    ),
    CONSTRAINT ck_ata_reuniao_status CHECK (
        status IN ('RASCUNHO', 'FINALIZADA')
    ),
    CONSTRAINT ck_ata_reuniao_finalizada CHECK (
        status <> 'FINALIZADA' OR finalizada_em IS NOT NULL
    )
);

CREATE TABLE IF NOT EXISTS sigi.ata_assinatura (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ata_id UUID NOT NULL REFERENCES sigi.ata_reuniao(id),
    nome_participante VARCHAR(255) NOT NULL,
    papel_participante VARCHAR(100) NOT NULL,
    usuario_id UUID REFERENCES sigi.usuario(id),       -- Nulo para participantes externos (ex.: familiares)
    assinado_em TIMESTAMP NOT NULL,
    ip_origem VARCHAR(64),
    hash_conteudo VARCHAR(64) NOT NULL,                -- SHA-256 canônico do conteúdo assinado
    -- Campos herdados de BaseEntity (@SoftDelete e Auditoria JPA)
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    criado_por UUID NOT NULL,
    atualizado_por UUID
);

CREATE TABLE IF NOT EXISTS sigi.ata_compromisso (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ata_id UUID NOT NULL REFERENCES sigi.ata_reuniao(id),
    descricao TEXT NOT NULL,
    responsavel_id UUID NOT NULL REFERENCES sigi.usuario(id),
    prazo DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDENTE',    -- Enum StatusCompromisso: PENDENTE, CONCLUIDO
    lembrete_enviado_em TIMESTAMP,                     -- Controle de idempotência do job @Scheduled (TA8.3)
    -- Campos herdados de BaseEntity (@SoftDelete e Auditoria JPA)
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    criado_por UUID NOT NULL,
    atualizado_por UUID,
    CONSTRAINT ck_ata_compromisso_status CHECK (
        status IN ('PENDENTE', 'CONCLUIDO')
    )
);

CREATE TABLE IF NOT EXISTS sigi.ata_termo_aditivo (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ata_id UUID NOT NULL REFERENCES sigi.ata_reuniao(id),
    texto TEXT NOT NULL,
    -- Campos herdados de BaseEntity (@SoftDelete e Auditoria JPA)
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    criado_por UUID NOT NULL,
    atualizado_por UUID
);

-- Índices para Timeline (US 09), consultas por ata e varredura do job de lembretes (TA8.3)
CREATE INDEX IF NOT EXISTS idx_ata_reuniao_aluno_criado_em
    ON sigi.ata_reuniao (aluno_id, criado_em);

CREATE INDEX IF NOT EXISTS idx_ata_assinatura_ata_id
    ON sigi.ata_assinatura (ata_id);

CREATE INDEX IF NOT EXISTS idx_ata_compromisso_ata_id
    ON sigi.ata_compromisso (ata_id);

CREATE INDEX IF NOT EXISTS idx_ata_compromisso_responsavel_id
    ON sigi.ata_compromisso (responsavel_id);

CREATE INDEX IF NOT EXISTS idx_ata_compromisso_lembrete_pendente
    ON sigi.ata_compromisso (status, prazo)
    WHERE lembrete_enviado_em IS NULL AND deleted = FALSE;

CREATE INDEX IF NOT EXISTS idx_ata_termo_aditivo_ata_id
    ON sigi.ata_termo_aditivo (ata_id);

-- Evolução da tabela sigi.notificacao para suportar lembretes individuais por usuário (TA8.3)
ALTER TABLE sigi.notificacao
    ADD COLUMN IF NOT EXISTS usuario_destinatario_id UUID REFERENCES sigi.usuario(id);

CREATE INDEX IF NOT EXISTS idx_notificacao_usuario_lida_criado_em
    ON sigi.notificacao (usuario_destinatario_id, lida, criado_em DESC);

-- Comentários de documentação no catálogo PostgreSQL
COMMENT ON TABLE sigi.ata_reuniao IS
    'Atas de reuniões pedagógicas e de alinhamento com famílias vinculadas ao prontuário do estudante (US 08 / TA8.1-TA8.4).';
COMMENT ON COLUMN sigi.ata_reuniao.status IS
    'Ciclo de vida da ata: RASCUNHO (editável) ou FINALIZADA (imutável; alterações apenas por Termo Aditivo - TA8.4).';
COMMENT ON COLUMN sigi.ata_reuniao.documento_caminho IS
    'Caminho relativo no volume seguro (CryptoStorageService) do documento assinado cifrado com AES-256-GCM (TA8.1).';
COMMENT ON COLUMN sigi.ata_reuniao.documento_iv IS
    'Initialization Vector (IV) em Base64 usado na cifragem AES-256-GCM do documento assinado.';
COMMENT ON TABLE sigi.ata_assinatura IS
    'Registro auditável de assinaturas digitais coletadas dos participantes presentes na reunião (TA8.1).';
COMMENT ON COLUMN sigi.ata_assinatura.hash_conteudo IS
    'Hash SHA-256 do conteúdo canônico da ata no momento da assinatura para garantia de integridade na finalização.';
COMMENT ON TABLE sigi.ata_compromisso IS
    'Compromissos e prazos acordados na ata com responsável designado e disparo automático de lembretes (TA8.3).';
COMMENT ON COLUMN sigi.ata_compromisso.lembrete_enviado_em IS
    'Timestamp do envio do lembrete automático pelo job agendado; evita notificações duplicadas.';
COMMENT ON TABLE sigi.ata_termo_aditivo IS
    'Termos aditivos explicativos vinculados a atas FINALIZADAS, garantindo rastreabilidade sem mutação da ata original (TA8.4).';
COMMENT ON COLUMN sigi.notificacao.usuario_destinatario_id IS
    'Identificador opcional do usuário destinatário específico (US 08 / TA8.3). Quando nulo, a notificação destina-se ao perfil inteiro.';
