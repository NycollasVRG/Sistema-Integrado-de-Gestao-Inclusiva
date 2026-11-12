-- =============================================================================
-- SEED 02 (DEV): ESTUDO DE CASO E INDICADORES REUTILIZÁVEIS - SIGI / CLAI (US 02)
-- =============================================================================
-- Este script é executado automaticamente pelo Flyway apenas no perfil "dev".
-- Insere alunos base e indicadores reutilizáveis com UUIDs fixos e conhecidos
-- para desenvolvimento local e execução das coleções Postman/Newman.
-- Script idempotente (ON CONFLICT DO NOTHING).
-- =============================================================================

-- 1. Alunos de Teste Base (compartilhados entre US 02, US 03, US 09, US 11 e US 12)
INSERT INTO sigi.aluno (id, nome, matricula, curso, turma, status, ativo, deleted, criado_em, atualizado_em)
VALUES
    ('11111111-1111-1111-1111-111111111111', 'Aluno Teste Fluxo Completo', 'MAT-TEST-001', 'Tecnologia em Sistemas para Internet', 'P4', 'ATIVO', TRUE, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('22222222-2222-2222-2222-222222222222', 'Aluno Teste Conflito Ativo', 'MAT-TEST-002', 'Engenharia Elétrica', 'P2', 'ATIVO', TRUE, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT DO NOTHING;

-- 2. Indicadores Reutilizáveis de Teste (Tags de Deficiências / Necessidades Específicas)
INSERT INTO sigi.indicador_reutilizavel (id, nome, descricao, deleted, criado_em, atualizado_em)
VALUES
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Deficiência Visual', 'Cegueira ou baixa visão que demanda recursos de acessibilidade visual e tecnologia assistiva.', FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Deficiência Auditiva', 'Perda bilateral, parcial ou total da audição, podendo demandar Libras ou recursos visuais.', FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Deficiência Física', 'Alteração completa ou parcial de um ou mais segmentos do corpo humano, acarretando comprometimento motor.', FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Deficiência Intelectual', 'Funcionamento intelectual significativamente inferior à média, com limitações adaptativas.', FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Transtorno do Espectro Autista (TEA)', 'Condição do neurodesenvolvimento caracterizada por desafios na comunicação social e comportamentos repetitivos.', FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET
    nome = EXCLUDED.nome,
    descricao = EXCLUDED.descricao,
    atualizado_em = CURRENT_TIMESTAMP;

-- 3. Associação de Tags aos Alunos de Teste (US 12)
INSERT INTO sigi.aluno_tag_dificuldade (aluno_id, indicador_id)
VALUES
    ('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
    ('11111111-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb')
ON CONFLICT DO NOTHING;
