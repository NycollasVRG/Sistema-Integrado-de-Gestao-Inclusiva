package com.br.CLAI.domain.enums;

/**
 * Nível de severidade dos alertas pedagógicos exibidos no Dashboard da CLAI (US 05).
 */
public enum SeveridadeAlerta {
    /** Risco crítico de evasão, retenção ou iminência de jubilamento (TA5.1). */
    VERMELHO,
    /** Incoerência pedagógica detectada no cruzamento boletim SUAP x Tags x PEA (TA5.2). */
    PEDAGOGICO
}
