package com.br.CLAI.dto.response;

import com.br.CLAI.domain.AtaReuniao;
import com.br.CLAI.domain.enums.StatusAta;
import com.br.CLAI.domain.enums.TipoReuniao;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

/**
 * Representação de resposta da Ata de Reunião (US 08).
 * Não expõe caminho físico de armazenamento nem IV criptográfico.
 */
public record AtaReuniaoResponseDTO(
        UUID id,
        UUID alunoId,
        String alunoNome,
        TipoReuniao tipoReuniao,
        LocalDateTime dataReuniao,
        String localReuniao,
        String pauta,
        String deliberacoes,
        StatusAta status,
        boolean documentoAssinadoAnexado,
        String documentoNomeOriginal,
        String documentoContentType,
        Long documentoTamanhoBytes,
        LocalDateTime finalizadaEm,
        UUID finalizadaPor,
        List<AtaAssinaturaResponseDTO> assinaturas,
        List<AtaCompromissoResponseDTO> compromissos,
        List<TermoAditivoResponseDTO> termosAditivos,
        UUID criadoPor,
        LocalDateTime criadoEm,
        LocalDateTime atualizadoEm
) {
    public static AtaReuniaoResponseDTO fromEntity(AtaReuniao entity) {
        List<AtaAssinaturaResponseDTO> assinaturasDto = entity.getAssinaturas() == null
                ? List.of()
                : entity.getAssinaturas().stream()
                        .sorted(Comparator.comparing(
                                a -> a.getAssinadoEm(),
                                Comparator.nullsLast(Comparator.naturalOrder())))
                        .map(AtaAssinaturaResponseDTO::fromEntity)
                        .toList();

        List<AtaCompromissoResponseDTO> compromissosDto = entity.getCompromissos() == null
                ? List.of()
                : entity.getCompromissos().stream()
                        .sorted(Comparator.comparing(
                                c -> c.getPrazo(),
                                Comparator.nullsLast(Comparator.naturalOrder())))
                        .map(AtaCompromissoResponseDTO::fromEntity)
                        .toList();

        List<TermoAditivoResponseDTO> termosDto = entity.getTermosAditivos() == null
                ? List.of()
                : entity.getTermosAditivos().stream()
                        .sorted(Comparator.comparing(
                                t -> t.getCriadoEm(),
                                Comparator.nullsLast(Comparator.naturalOrder())))
                        .map(TermoAditivoResponseDTO::fromEntity)
                        .toList();

        return new AtaReuniaoResponseDTO(
                entity.getId(),
                entity.getAluno() != null ? entity.getAluno().getId() : null,
                entity.getAluno() != null ? entity.getAluno().getNomeCompleto() : null,
                entity.getTipoReuniao(),
                entity.getDataReuniao(),
                entity.getLocalReuniao(),
                entity.getPauta(),
                entity.getDeliberacoes(),
                entity.getStatus(),
                entity.possuiDocumentoAssinado(),
                entity.getDocumentoNomeOriginal(),
                entity.getDocumentoContentType(),
                entity.getDocumentoTamanhoBytes(),
                entity.getFinalizadaEm(),
                entity.getFinalizadaPor(),
                assinaturasDto,
                compromissosDto,
                termosDto,
                entity.getCriadoPor(),
                entity.getCriadoEm(),
                entity.getAtualizadoEm()
        );
    }
}
