-- =============================================================================
-- SIGI / CLAI - Sistema Integrado de Gestão Inclusiva
-- Script DDL 01: Criação do Schema e Tabelas Principais
-- Banco de Dados: PostgreSQL 14+ (Schema: sigi)
-- =============================================================================
-- Ordem lógica de criação respeitando integridade referencial (Foreign Keys):
--   1. sigi.usuario                 (US 11 - Autenticação, RBAC e Sessão)
--   2. sigi.aluno                   (Base - Cadastro de Estudantes)
--   3. sigi.indicador_reutilizavel  (US 02 - Tags de Dificuldades/Necessidades)
--   4. sigi.estudo_de_caso          (US 02 / US 11 - Estudo de Caso e Histórico Sensível)
--   5. sigi.estudo_caso_indicador   (US 02 - Relacionamento N:M Estudo <-> Indicador)
--   6. sigi.acompanhamento          (US 03 - Ponte Aluno <-> Documentos Pedagógicos)
--   7. sigi.plano_acao              (US 03 - Plano de Ação)
--   8. sigi.pei                     (US 03 - Plano de Ensino Individualizado)
--   9. sigi.pea                     (US 03 - Plano de Ensino Adaptado)
--  10. sigi.anexo_estudante         (US 11 - Anexos e Laudos Criptografados AES-256-GCM)
-- =============================================================================

-- 0. Garantia do Schema
CREATE SCHEMA IF NOT EXISTS sigi;

-- =============================================================================
-- 1. Entidade: Usuario (com.br.CLAI.domain.Usuario)
-- US 11 / Task #50: Autenticação JWT, Perfis RBAC e Revogação Imediata (TA11.4)
-- =============================================================================
CREATE TABLE IF NOT EXISTS sigi.usuario (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    senha VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,               -- Enum Role: ADMIN, COORDENADOR, CLAI_PSICOPEDAGOGO, PROFESSOR, ALUNO_APOIADOR
    nivel_restricao VARCHAR(50) NOT NULL,    -- Enum NivelRestricao: SUPER_RESTRICAO, RESTRICAO_MODERADA, ACESSO_FUNCIONAL
    autorizacao_saude BOOLEAN NOT NULL DEFAULT FALSE,
    acesso_ativo BOOLEAN NOT NULL DEFAULT TRUE,
    token_version INTEGER NOT NULL DEFAULT 1,
    -- Campos herdados de BaseEntity (@SoftDelete e Auditoria JPA)
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    criado_por UUID,
    atualizado_por UUID
);

-- =============================================================================
-- 2. Entidade: Aluno (com.br.CLAI.domain.Aluno)
-- Cadastro base de estudantes acompanhados pelo núcleo inclusivo
-- =============================================================================
CREATE TABLE IF NOT EXISTS sigi.aluno (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(255) NOT NULL,
    matricula VARCHAR(50) UNIQUE NOT NULL,
    -- Campos herdados de BaseEntity (@SoftDelete e Auditoria JPA)
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    criado_por UUID,
    atualizado_por UUID
);

-- =============================================================================
-- 3. Entidade: IndicadorReutilizavel (com.br.CLAI.domain.IndicadorReutilizavel)
-- US 02: Tags de barreiras, dificuldades ou condições específicas
-- =============================================================================
CREATE TABLE IF NOT EXISTS sigi.indicador_reutilizavel (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(100) UNIQUE NOT NULL,
    descricao TEXT,
    -- Campos herdados de BaseEntity (@SoftDelete e Auditoria JPA)
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    criado_por UUID,
    atualizado_por UUID
);

-- =============================================================================
-- 4. Entidade: EstudoDeCaso (com.br.CLAI.domain.EstudoDeCaso)
-- US 02 / US 09 / US 11 (Task #52 - Matriz de Autorização Granular TA11.3)
-- =============================================================================
CREATE TABLE IF NOT EXISTS sigi.estudo_de_caso (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    aluno_id UUID NOT NULL REFERENCES sigi.aluno(id),
    status VARCHAR(20) NOT NULL DEFAULT 'ATIVO', -- Enum StatusEstudoCaso: ATIVO, ENCERRADO, RASCUNHO
    diagnostico_inicial TEXT,
    historico_familiar TEXT,
    historico_socioemocional TEXT,
    -- Campos herdados de BaseEntity (@SoftDelete e Auditoria JPA)
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    criado_por UUID,
    atualizado_por UUID
);

-- =============================================================================
-- 5. Tabela Associativa N:M: estudo_caso_indicador
-- US 02: @ManyToMany entre EstudoDeCaso e IndicadorReutilizavel
-- =============================================================================
CREATE TABLE IF NOT EXISTS sigi.estudo_caso_indicador (
    estudo_de_caso_id UUID NOT NULL REFERENCES sigi.estudo_de_caso(id) ON DELETE CASCADE,
    indicador_id UUID NOT NULL REFERENCES sigi.indicador_reutilizavel(id) ON DELETE CASCADE,
    PRIMARY KEY (estudo_de_caso_id, indicador_id)
);

-- =============================================================================
-- 6. Entidade: Acompanhamento (com.br.CLAI.domain.Acompanhamento)
-- US 03: Entidade ponte entre Aluno e os documentos pedagógicos (PlanoAcao, PEI, PEA)
-- =============================================================================
CREATE TABLE IF NOT EXISTS sigi.acompanhamento (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    aluno_id UUID NOT NULL REFERENCES sigi.aluno(id),
    data_inicio DATE NOT NULL DEFAULT CURRENT_DATE,
    -- Campos herdados de BaseEntity (@SoftDelete e Auditoria JPA)
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    criado_por UUID,
    atualizado_por UUID
);

-- =============================================================================
-- 7. Entidade: PlanoAcao (com.br.CLAI.domain.PlanoAcao)
-- US 03: Documento autônomo de Plano de Ação vinculado ao Acompanhamento
-- =============================================================================
CREATE TABLE IF NOT EXISTS sigi.plano_acao (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    acompanhamento_id UUID NOT NULL REFERENCES sigi.acompanhamento(id),
    demandas_identificadas TEXT,
    propostas_intervencao TEXT,
    -- Campos herdados de BaseEntity (@SoftDelete e Auditoria JPA)
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    criado_por UUID,
    atualizado_por UUID
);

-- =============================================================================
-- 8. Entidade: Pei (com.br.CLAI.domain.Pei)
-- US 03 / US 09: Plano de Ensino Individualizado
-- =============================================================================
CREATE TABLE IF NOT EXISTS sigi.pei (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    acompanhamento_id UUID NOT NULL REFERENCES sigi.acompanhamento(id),
    habilidades_interesses TEXT,
    propostas_adaptacoes TEXT,
    -- Campos herdados de BaseEntity (@SoftDelete e Auditoria JPA)
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    criado_por UUID,
    atualizado_por UUID
);

-- =============================================================================
-- 9. Entidade: Pea (com.br.CLAI.domain.Pea)
-- US 03 / US 09: Plano de Ensino Adaptado (também compõe os anexos do PEI em TA3.2)
-- =============================================================================
CREATE TABLE IF NOT EXISTS sigi.pea (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    acompanhamento_id UUID NOT NULL REFERENCES sigi.acompanhamento(id),
    disciplina_id UUID,
    objetivo_geral TEXT,
    metodologia TEXT,
    avaliacao TEXT,
    -- Campos herdados de BaseEntity (@SoftDelete e Auditoria JPA)
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    criado_por UUID,
    atualizado_por UUID
);

-- =============================================================================
-- 10. Entidade: AnexoEstudante (com.br.CLAI.domain.AnexoEstudante)
-- US 11 / Task #51: Criptografia em Repouso (AES-256-GCM) para Anexos Sensíveis
-- =============================================================================
CREATE TABLE IF NOT EXISTS sigi.anexo_estudante (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    aluno_id UUID NOT NULL REFERENCES sigi.aluno(id) ON DELETE CASCADE,
    nome_original VARCHAR(255) NOT NULL,
    content_type VARCHAR(100) NOT NULL,
    tamanho_bytes BIGINT NOT NULL,
    classificacao VARCHAR(50) NOT NULL, -- Enum TipoClassificacaoAnexo: LAUDO_MEDICO, DIAGNOSTICO_NEUROPSICOLOGICO, DOCUMENTO_PEDAGOGICO
    criptografado BOOLEAN NOT NULL DEFAULT FALSE,
    caminho_armazenamento VARCHAR(500) NOT NULL,
    iv VARCHAR(64),                     -- Initialization Vector (12 bytes em Base64) para AES-256-GCM
    -- Campos herdados de BaseEntity (@SoftDelete e Auditoria JPA)
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    criado_por UUID,
    atualizado_por UUID
);
