package com.br.CLAI.dto.response;

import com.br.CLAI.domain.enums.TipoAtendimento;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * @param criadoPor           autor do registro; o cliente compara com o usuário logado para decidir se exibe "Editar"
 * @param edicaoPermitidaAte  fim da janela de 24h ({@code criadoEm + 24h}); após esse instante o PUT retorna 403
 */
public record AtendimentoResponseDTO(
        UUID id,
        UUID alunoId,
        String nomeEstudante,
        String matriculaAluno,
        TipoAtendimento tipoAtendimento,
        LocalDate dataAtendimento,
        String profissionalResponsavel,
        String descricao,
        String encaminhamentos,
        UUID criadoPor,
        LocalDateTime criadoEm,
        LocalDateTime atualizadoEm,
        LocalDateTime edicaoPermitidaAte
) {
}
