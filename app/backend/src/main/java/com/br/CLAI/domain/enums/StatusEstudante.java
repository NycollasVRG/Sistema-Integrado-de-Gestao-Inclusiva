package com.br.CLAI.domain.enums;

public enum StatusEstudante {
    ATIVO,
    EM_TRIAGEM,
    INATIVO,
    EVADIDO;

    /** Status que representam um estudante fora de atividade (ativo = false). */
    public boolean isEncerrado() {
        return this == INATIVO || this == EVADIDO;
    }
}
