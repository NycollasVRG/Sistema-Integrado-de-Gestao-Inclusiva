package com.br.CLAI.dto.request;

import com.fasterxml.jackson.annotation.JsonAlias;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Representa o rendimento de um estudante em uma disciplina do boletim SUAP (US 05 / TA5.2).
 */
public record SuapDisciplinaBoletimDTO(
        UUID disciplinaId,

        @JsonAlias({"disciplina", "nomeDisciplina", "nome"})
        String componenteCurricular,

        @JsonAlias("disciplinaTeorica")
        Boolean teorica,

        BigDecimal nota,

        BigDecimal notaMaxima
) {
    public SuapDisciplinaBoletimDTO(String componenteCurricular, Boolean teorica, BigDecimal nota) {
        this(null, componenteCurricular, teorica, nota, null);
    }
}
