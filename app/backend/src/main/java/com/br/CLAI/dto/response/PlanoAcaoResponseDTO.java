package com.br.CLAI.dto.response;

import java.time.LocalDateTime;
import java.util.UUID;

public record PlanoAcaoResponseDTO(
        UUID id,
        UUID acompanhamentoId,
        UUID alunoId,
        String nomeEstudante,
        String matriculaEstudante,
        String cursoEstudante,
        String demandasIdentificadas,
        String propostasIntervencao,
        String componenteCurricular,
        String semestreAno,
        String docente,
        String objetivoGeral,
        String objetivosEspecificos,
        String conteudosProgramaticos,
        String metodologia,
        String avaliacao,
        String bibliografiaBasica,
        String bibliografiaComplementar,
        LocalDateTime criadoEm,
        LocalDateTime atualizadoEm
) {
}
