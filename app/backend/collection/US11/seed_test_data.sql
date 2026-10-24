-- ====================================================================
-- SEED DE DADOS PARA TESTES DE AUTENTICAÇÃO E RBAC - SIGI / CLAI (US 11)
-- ====================================================================
-- Este script insere usuários de teste com credenciais e UUIDs fixos
-- para validação da Task #50 (Autenticação JWT, Perfis RBAC e Revogação).
--
-- Senha padrão para todos os usuários abaixo: "senha123"
-- Hash BCrypt: $2a$10$P.HQ81At.XE1IE7ekR9tDOqLhit.7kAiWoqOgFRI2J2t0K6QksLeC
-- Script idempotente (ON CONFLICT DO NOTHING).

INSERT INTO sigi.usuario (
    id, nome, email, senha, role, nivel_restricao, autorizacao_saude, acesso_ativo, token_version, deleted, criado_em, atualizado_em
) VALUES
    (
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        'Administrador do Sistema',
        'admin@sigi.ifpb.edu.br',
        '$2a$10$P.HQ81At.XE1IE7ekR9tDOqLhit.7kAiWoqOgFRI2J2t0K6QksLeC',
        'ADMIN',
        'SUPER_RESTRICAO',
        TRUE,
        TRUE,
        1,
        FALSE,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    ),
    (
        'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        'Aluno Apoiador Teste',
        'aluno.apoiador@sigi.ifpb.edu.br',
        '$2a$10$P.HQ81At.XE1IE7ekR9tDOqLhit.7kAiWoqOgFRI2J2t0K6QksLeC',
        'ALUNO_APOIADOR',
        'ACESSO_FUNCIONAL',
        FALSE,
        TRUE,
        1,
        FALSE,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    ),
    (
        'cccccccc-cccc-cccc-cccc-cccccccccccc',
        'Coordenador Geral CLAI',
        'coordenador@sigi.ifpb.edu.br',
        '$2a$10$P.HQ81At.XE1IE7ekR9tDOqLhit.7kAiWoqOgFRI2J2t0K6QksLeC',
        'COORDENADOR',
        'SUPER_RESTRICAO',
        FALSE,
        TRUE,
        1,
        FALSE,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    ),
    (
        'dddddddd-dddd-dddd-dddd-dddddddddddd',
        'Psicopedagoga Médica Especialista',
        'psicopedagogo@sigi.ifpb.edu.br',
        '$2a$10$P.HQ81At.XE1IE7ekR9tDOqLhit.7kAiWoqOgFRI2J2t0K6QksLeC',
        'CLAI_PSICOPEDAGOGO',
        'RESTRICAO_MODERADA',
        TRUE,
        TRUE,
        1,
        FALSE,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    ),
    (
        'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
        'Professor Titular',
        'professor@sigi.ifpb.edu.br',
        '$2a$10$P.HQ81At.XE1IE7ekR9tDOqLhit.7kAiWoqOgFRI2J2t0K6QksLeC',
        'PROFESSOR',
        'ACESSO_FUNCIONAL',
        FALSE,
        TRUE,
        1,
        FALSE,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    )
ON CONFLICT (email) DO NOTHING;
