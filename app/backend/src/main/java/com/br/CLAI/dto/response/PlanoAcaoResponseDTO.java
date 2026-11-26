package com.br.CLAI.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

public record PlanoAcaoResponseDTO(
        UUID id,
        UUID acompanhamentoId,
        UUID alunoId,
        String nomeEstudante,
        String matriculaEstudante,
        String cursoEstudante,
        String periodoLetivo,
        String periodoIngresso,
        LocalDate dataNascimento,
        String telefoneEstudante,
        String emailEstudante,
        String nomeResponsavel,
        String grauParentescoResponsavel,
        String telefoneResponsavel,
        String emailResponsavel,
        @JsonInclude(JsonInclude.Include.NON_NULL)
        Boolean possuiComorbidade,
        @JsonInclude(JsonInclude.Include.NON_NULL)
        String comorbidadeDetalhes,
        @JsonInclude(JsonInclude.Include.NON_NULL)
        Boolean usaMedicacaoContinua,
        @JsonInclude(JsonInclude.Include.NON_NULL)
        String medicacaoDetalhes,
        @JsonInclude(JsonInclude.Include.NON_NULL)
        Boolean frequentaServicosApoio,
        @JsonInclude(JsonInclude.Include.NON_NULL)
        String servicosApoioDetalhes,
        @JsonInclude(JsonInclude.Include.NON_NULL)
        Boolean apresentouDocumentosComprobatorios,
        @JsonInclude(JsonInclude.Include.NON_NULL)
        String documentosComprobatoriosDetalhes,
        String identificacaoNecessidadesEspecificas,
        String relatoPercursoEducacional,
        String demandasIdentificadas,
        String propostasIntervencao,
        String assinaturaCoordenadorClai,
        LocalDate dataAssinatura,
        LocalDateTime criadoEm,
        LocalDateTime atualizadoEm
) {
}
