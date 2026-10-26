-- =========================================================================
-- Task #52: Matriz de Autorização Granular (Super Restrição e Restrição Moderada)
-- Requisito TA11.3: Adição dos campos sensíveis (Histórico Familiar e Socioemocional)
-- =========================================================================

ALTER TABLE sigi.estudo_de_caso
    ADD COLUMN IF NOT EXISTS historico_familiar TEXT,
    ADD COLUMN IF NOT EXISTS historico_socioemocional TEXT;

COMMENT ON COLUMN sigi.estudo_de_caso.historico_familiar IS 'Dados de histórico e dinâmica familiar (sensível - restrição moderada ou superior)';
COMMENT ON COLUMN sigi.estudo_de_caso.historico_socioemocional IS 'Registros do desenvolvimento socioemocional e relacional (sensível - restrição moderada ou superior)';
