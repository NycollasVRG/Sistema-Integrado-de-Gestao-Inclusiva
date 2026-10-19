-- ====================================================================
-- SEED DE DADOS PARA TESTES DE INTEGRAÇÃO - SIGI / CLAI (US 03)
-- ====================================================================
-- Este script insere alunos e acompanhamentos com UUIDs fixos e
-- conhecidos para permitir a execução automatizada da coleção
-- Postman / Newman de PEA e PEI.
--
-- Observação: não existe endpoint REST para criar Acompanhamento,
-- portanto as linhas abaixo são inseridas diretamente no banco.
-- O script é idempotente (pode ser executado mais de uma vez).

-- 1. Alunos de Teste (mesmos UUIDs da coleção da US 02)
INSERT INTO sigi.aluno (id, nome, matricula, deleted, criado_em, atualizado_em)
VALUES
    ('11111111-1111-1111-1111-111111111111', 'Aluno Teste Fluxo Completo', 'MAT-TEST-001', FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('22222222-2222-2222-2222-222222222222', 'Aluno Teste Conflito Ativo', 'MAT-TEST-002', FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (matricula) DO NOTHING;

-- 2. Acompanhamentos de Teste (ponte entre Aluno e os planos PEA/PEI)
INSERT INTO sigi.acompanhamento (id, aluno_id, data_inicio, deleted, criado_em, atualizado_em)
VALUES
    ('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', '2026-02-01', FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('44444444-4444-4444-4444-444444444444', '22222222-2222-2222-2222-222222222222', '2026-02-01', FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;
