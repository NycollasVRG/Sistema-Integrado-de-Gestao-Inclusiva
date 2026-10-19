-- ====================================================================
-- SEED DE DADOS PARA TESTES DE INTEGRAÇÃO - SIGI / CLAI (US 02)
-- ====================================================================
-- Este script insere alunos e indicadores com UUIDs fixos e conhecidos
-- para permitir a execução automatizada da coleção Postman / Newman.

-- 1. Alunos de Teste
INSERT INTO sigi.aluno (id, nome, matricula, deleted, criado_em, atualizado_em)
VALUES 
    ('11111111-1111-1111-1111-111111111111', 'Aluno Teste Fluxo Completo', 'MAT-TEST-001', FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('22222222-2222-2222-2222-222222222222', 'Aluno Teste Conflito Ativo', 'MAT-TEST-002', FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (matricula) DO NOTHING;

-- 2. Indicadores Reutilizáveis de Teste
INSERT INTO sigi.indicador_reutilizavel (id, nome, descricao, deleted, criado_em, atualizado_em)
VALUES 
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Dificuldade de Leitura', 'Apresenta barreiras na decodificação e fluência leitora.', FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'TDAH', 'Déficit de Atenção e Hiperatividade.', FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Discalculia', 'Dificuldade específica no aprendizado de matemática.', FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (nome) DO NOTHING;
