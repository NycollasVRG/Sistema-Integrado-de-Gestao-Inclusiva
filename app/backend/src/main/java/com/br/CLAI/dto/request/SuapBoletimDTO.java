package com.br.CLAI.dto.request;

import com.fasterxml.jackson.annotation.JsonAlias;

import java.util.List;
import java.util.UUID;

/**
 * Representa o boletim e o status acadêmico de um estudante obtidos do SUAP (US 05 / TA5.1 e TA5.2).
 */
public record SuapBoletimDTO(
        UUID alunoId,
        String matricula,
        String unidade,
        String curso,
        String turma,

        @JsonAlias("retencao")
        Boolean retido,

        @JsonAlias({"iminenciaJubilamento", "jubilamento"})
        Boolean riscoJubilamento,

        @JsonAlias("statusAcademico")
        String situacaoAcademica,

        List<SuapDisciplinaBoletimDTO> disciplinas
) {
}
