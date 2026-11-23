package com.br.CLAI.domain.enums;

/**
 * Classificação funcional dos alertas gerados pelo motor de análise pedagógica (US 05).
 */
public enum TipoAlertaPedagogico {
    /** Retenção detectada no boletim/status acadêmico do SUAP (TA5.1). */
    RETENCAO,
    /** Risco ou iminência de jubilamento detectado no SUAP (TA5.1). */
    RISCO_JUBILAMENTO,
    /** Incoerência avaliativa: tag de alfabetização + nota máxima em disciplina teórica sem PEA (TA5.2). */
    INCOERENCIA_PEDAGOGICA
}
