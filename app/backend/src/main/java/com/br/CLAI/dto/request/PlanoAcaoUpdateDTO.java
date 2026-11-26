package com.br.CLAI.dto.request;

import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record PlanoAcaoUpdateDTO(
        @Size(max = 30, message = "O período letivo deve ter no máximo 30 caracteres")
        String periodoLetivo,

        @Size(max = 30, message = "O período de ingresso deve ter no máximo 30 caracteres")
        String periodoIngresso,

        LocalDate dataNascimento,

        @Size(max = 30, message = "O telefone do estudante deve ter no máximo 30 caracteres")
        String telefoneEstudante,

        @Size(max = 255, message = "O e-mail do estudante deve ter no máximo 255 caracteres")
        String emailEstudante,

        @Size(max = 255, message = "O nome do responsável deve ter no máximo 255 caracteres")
        String nomeResponsavel,

        @Size(max = 100, message = "O grau de parentesco deve ter no máximo 100 caracteres")
        String grauParentescoResponsavel,

        @Size(max = 30, message = "O telefone do responsável deve ter no máximo 30 caracteres")
        String telefoneResponsavel,

        @Size(max = 255, message = "O e-mail do responsável deve ter no máximo 255 caracteres")
        String emailResponsavel,

        Boolean possuiComorbidade,
        String comorbidadeDetalhes,

        Boolean usaMedicacaoContinua,
        String medicacaoDetalhes,

        Boolean frequentaServicosApoio,
        String servicosApoioDetalhes,

        Boolean apresentouDocumentosComprobatorios,
        String documentosComprobatoriosDetalhes,

        String identificacaoNecessidadesEspecificas,
        String relatoPercursoEducacional,
        String demandasIdentificadas,
        String propostasIntervencao,

        @Size(max = 255, message = "A assinatura do coordenador deve ter no máximo 255 caracteres")
        String assinaturaCoordenadorClai,

        LocalDate dataAssinatura
) {
    public PlanoAcaoUpdateDTO(
            String demandasIdentificadas,
            String propostasIntervencao) {
        this(
                null, null, null, null, null,
                null, null, null, null,
                null, null, null, null, null, null, null, null,
                null, null, demandasIdentificadas, propostasIntervencao,
                null, null
        );
    }
}
