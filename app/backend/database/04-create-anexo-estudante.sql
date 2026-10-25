-- ====================================================================
-- MIGRATION SQL - US 11 / TASK #51
-- Motor de Criptografia em Repouso (AES-256-GCM) para Anexos Médicos Sensíveis
-- ====================================================================

CREATE SCHEMA IF NOT EXISTS sigi;

CREATE TABLE IF NOT EXISTS sigi.anexo_estudante (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    aluno_id UUID NOT NULL REFERENCES sigi.aluno(id) ON DELETE CASCADE,
    nome_original VARCHAR(255) NOT NULL,
    content_type VARCHAR(100) NOT NULL,
    tamanho_bytes BIGINT NOT NULL,
    classificacao VARCHAR(50) NOT NULL, -- Valores: LAUDO_MEDICO, DIAGNOSTICO_NEUROPSICOLOGICO, DOCUMENTO_PEDAGOGICO
    criptografado BOOLEAN NOT NULL DEFAULT FALSE,
    caminho_armazenamento VARCHAR(500) NOT NULL,
    iv VARCHAR(64), -- Initialization Vector (12 bytes em Base64) para AES-256-GCM
    -- Campos herdados de BaseEntity (@SoftDelete e Auditoria)
    deleted BOOLEAN DEFAULT FALSE NOT NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    criado_por UUID,
    atualizado_por UUID
);

CREATE INDEX IF NOT EXISTS idx_anexo_estudante_aluno_id ON sigi.anexo_estudante(aluno_id);
CREATE INDEX IF NOT EXISTS idx_anexo_estudante_classificacao ON sigi.anexo_estudante(classificacao);
