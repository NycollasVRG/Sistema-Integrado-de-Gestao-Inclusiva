package com.br.CLAI.domain.enums;

public enum TipoClassificacaoAnexo {
    LAUDO_MEDICO(true),
    DIAGNOSTICO_NEUROPSICOLOGICO(true),
    DOCUMENTO_PEDAGOGICO(false);

    private final boolean sensivel;

    TipoClassificacaoAnexo(boolean sensivel) {
        this.sensivel = sensivel;
    }

    public boolean isSensivel() {
        return sensivel;
    }
}
