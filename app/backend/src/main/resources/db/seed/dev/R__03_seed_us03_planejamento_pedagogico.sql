-- =============================================================================
-- SEED 03 (DEV): PLANEJAMENTO PEDAGÓGICO (ACOMPANHAMENTO, PEA E PEI) - SIGI / CLAI (US 03)
-- =============================================================================
-- Este script é executado automaticamente pelo Flyway apenas no perfil "dev".
-- Garante os alunos base e insere os acompanhamentos com UUIDs fixos para
-- desenvolvimento local e execução das coleções Postman / Newman de PEA e PEI.
-- Script idempotente (ON CONFLICT DO NOTHING).
-- =============================================================================

-- 1. Garantia idempotente dos Alunos de Teste
INSERT INTO sigi.aluno (id, nome, matricula, deleted, criado_em, atualizado_em)
VALUES
    ('11111111-1111-1111-1111-111111111111', 'Aluno Teste Fluxo Completo', 'MAT-TEST-001', FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('22222222-2222-2222-2222-222222222222', 'Aluno Teste Conflito Ativo', 'MAT-TEST-002', FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT DO NOTHING;

-- 2. Acompanhamentos de Teste (ponte entre Aluno e os planos PEA/PEI/Plano de Ação)
INSERT INTO sigi.acompanhamento (id, aluno_id, data_inicio, deleted, criado_em, atualizado_em)
VALUES
    ('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', '2026-02-01', FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-444444444444', '22222222-2222-2222-2222-222222222222', '2026-02-01', FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT DO NOTHING;
