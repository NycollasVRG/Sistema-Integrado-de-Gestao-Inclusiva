package com.br.CLAI.domain.enums;

public enum StatusAluno {
    ATIVO,
    EM_TRIAGEM,
    INATIVO,
    EVADIDO;

    /** Status que representam um aluno fora de atividade (ativo = false). */
    public boolean isEncerrado() {
        return this == INATIVO || this == EVADIDO;
    }
}
