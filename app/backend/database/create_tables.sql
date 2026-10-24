-- ==========================================
-- 0. GARANTIA DO SCHEMA SIGI (Docker Init)
-- ==========================================

CREATE SCHEMA IF NOT EXISTS sigi;

-- ==========================================
-- 1. DROP DAS TABELAS ANTIGAS
-- ==========================================

DROP TABLE IF EXISTS sigi.pea CASCADE;
DROP TABLE IF EXISTS sigi.pei CASCADE;
DROP TABLE IF EXISTS sigi.plano_acao CASCADE;
DROP TABLE IF EXISTS sigi.acompanhamento CASCADE;
DROP TABLE IF EXISTS sigi.estudo_caso_indicador CASCADE;
DROP TABLE IF EXISTS sigi.estudo_de_caso CASCADE;
DROP TABLE IF EXISTS sigi.indicador_reutilizavel CASCADE;
DROP TABLE IF EXISTS sigi.aluno CASCADE;
DROP TABLE IF EXISTS sigi.usuario CASCADE;

-- Se precisar dropar o schema todo e recriar (opcional):
-- DROP SCHEMA IF EXISTS sigi CASCADE;

-- ==========================================
-- 2. CRIAÇÃO DA NOVA ESTRUTURA (Com UUID, Soft-Delete e Auditoria)
-- ==========================================

-- 1. Entidade Aluno
CREATE TABLE sigi.aluno (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(255) NOT NULL,
    matricula VARCHAR(50) UNIQUE NOT NULL,
    -- Campos herdados de BaseEntity (@SoftDelete e Auditoria)
    deleted BOOLEAN DEFAULT FALSE NOT NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    criado_por UUID,
    atualizado_por UUID
);

-- ==========================================
-- US 02: Estudo de Caso e Indicadores
-- ==========================================

-- 2. Entidade IndicadorReutilizavel (Tags de Dificuldades)
CREATE TABLE sigi.indicador_reutilizavel (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(100) UNIQUE NOT NULL, -- Ex: "Dificuldade de Leitura", "TDAH"
    descricao TEXT,
    -- Campos herdados de BaseEntity (@SoftDelete e Auditoria)
    deleted BOOLEAN DEFAULT FALSE NOT NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    criado_por UUID,
    atualizado_por UUID
);

-- 3. Entidade EstudoDeCaso
CREATE TABLE sigi.estudo_de_caso (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    aluno_id UUID NOT NULL REFERENCES sigi.aluno(id),
    status VARCHAR(20) NOT NULL DEFAULT 'ATIVO', -- Valores: ATIVO, ENCERRADO, RASCUNHO
    diagnostico_inicial TEXT,
    -- Campos herdados de BaseEntity (@SoftDelete e Auditoria)
    deleted BOOLEAN DEFAULT FALSE NOT NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    criado_por UUID,
    atualizado_por UUID
);

-- CRITÉRIO DE ACEITE US 02: Impedir dois estudos ativos simultâneos para o mesmo aluno
CREATE UNIQUE INDEX idx_estudo_caso_ativo 
ON sigi.estudo_de_caso (aluno_id) 
WHERE status = 'ATIVO' AND deleted = FALSE;

-- 4. Tabela associativa Estudo de Caso <-> Indicadores (Relacionamento N:M)
CREATE TABLE sigi.estudo_caso_indicador (
    estudo_de_caso_id UUID NOT NULL REFERENCES sigi.estudo_de_caso(id) ON DELETE CASCADE,
    indicador_id UUID NOT NULL REFERENCES sigi.indicador_reutilizavel(id) ON DELETE CASCADE,
    PRIMARY KEY (estudo_de_caso_id, indicador_id)
);


-- ==========================================
-- US 03: Documentos Autônomos e Acompanhamento
-- ==========================================

-- 5. Entidade Acompanhamento (Ponte entre Aluno e Documentos)
CREATE TABLE sigi.acompanhamento (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    aluno_id UUID NOT NULL REFERENCES sigi.aluno(id),
    data_inicio DATE NOT NULL DEFAULT CURRENT_DATE,
    -- Campos herdados de BaseEntity (@SoftDelete e Auditoria)
    deleted BOOLEAN DEFAULT FALSE NOT NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    criado_por UUID,
    atualizado_por UUID
);

-- 6. Entidade Plano de Ação (Documento Autônomo)
CREATE TABLE sigi.plano_acao (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    acompanhamento_id UUID NOT NULL REFERENCES sigi.acompanhamento(id),
    demandas_identificadas TEXT,
    propostas_intervencao TEXT,
    -- Campos herdados de BaseEntity (@SoftDelete e Auditoria)
    deleted BOOLEAN DEFAULT FALSE NOT NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    criado_por UUID,
    atualizado_por UUID
);

-- 7. Entidade PEI (Plano de Ensino Individualizado)
CREATE TABLE sigi.pei (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    acompanhamento_id UUID NOT NULL REFERENCES sigi.acompanhamento(id),
    habilidades_interesses TEXT,
    propostas_adaptacoes TEXT,
    -- Campos herdados de BaseEntity (@SoftDelete e Auditoria)
    deleted BOOLEAN DEFAULT FALSE NOT NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    criado_por UUID,
    atualizado_por UUID
);

-- 8. Entidade PEA (Plano de Ensino Adaptado)
CREATE TABLE sigi.pea (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    acompanhamento_id UUID NOT NULL REFERENCES sigi.acompanhamento(id),
    disciplina_id UUID,
    objetivo_geral TEXT,
    metodologia TEXT,
    avaliacao TEXT,
    -- Campos herdados de BaseEntity (@SoftDelete e Auditoria)
    deleted BOOLEAN DEFAULT FALSE NOT NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    criado_por UUID,
    atualizado_por UUID
);

-- ==========================================
-- US 11: Autenticação, Perfis RBAC e Revogação (Task #50)
-- ==========================================

-- 9. Entidade Usuario
CREATE TABLE sigi.usuario (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    senha VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    nivel_restricao VARCHAR(50) NOT NULL,
    autorizacao_saude BOOLEAN NOT NULL DEFAULT FALSE,
    acesso_ativo BOOLEAN NOT NULL DEFAULT TRUE,
    token_version INTEGER NOT NULL DEFAULT 1,
    -- Campos herdados de BaseEntity (@SoftDelete e Auditoria)
    deleted BOOLEAN DEFAULT FALSE NOT NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    criado_por UUID,
    atualizado_por UUID
);

CREATE INDEX idx_usuario_email ON sigi.usuario(email);
CREATE INDEX idx_usuario_role ON sigi.usuario(role);