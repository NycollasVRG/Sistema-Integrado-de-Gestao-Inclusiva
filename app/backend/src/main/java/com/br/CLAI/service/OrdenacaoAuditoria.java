package com.br.CLAI.service;

import com.br.CLAI.domain.BaseEntity;
import com.br.CLAI.domain.EstudoDeCaso;
import com.br.CLAI.domain.enums.StatusEstudoCaso;
import com.br.CLAI.dto.response.TimelineEventDTO;

import java.util.Comparator;
import java.util.List;
import java.util.Optional;

/**
 * Comparadores determinísticos e null-safe para ordenar registros históricos
 * preservados no banco, mantendo consistência entre prontuário, timeline e formulários.
 */
final class OrdenacaoAuditoria {

    private static final Comparator<BaseEntity> POR_ATUALIZACAO_DESC =
            Comparator.comparing(
                            BaseEntity::getAtualizadoEm,
                            Comparator.nullsLast(Comparator.reverseOrder())
                    )
                    .thenComparing(
                            BaseEntity::getCriadoEm,
                            Comparator.nullsLast(Comparator.reverseOrder())
                    )
                    .thenComparing(
                            BaseEntity::getId,
                            Comparator.nullsLast(Comparator.naturalOrder())
                    );

    private static final Comparator<BaseEntity> POR_CRIACAO_DESC =
            Comparator.comparing(
                            BaseEntity::getCriadoEm,
                            Comparator.nullsLast(Comparator.reverseOrder())
                    )
                    .thenComparing(
                            BaseEntity::getAtualizadoEm,
                            Comparator.nullsLast(Comparator.reverseOrder())
                    )
                    .thenComparing(
                            BaseEntity::getId,
                            Comparator.nullsLast(Comparator.naturalOrder())
                    );

    private static final Comparator<EstudoDeCaso> POR_VIGENCIA_ESTUDO =
            Comparator.comparingInt((EstudoDeCaso e) -> prioridadeStatus(e.getStatus()))
                    .thenComparing(POR_ATUALIZACAO_DESC);

    private static final Comparator<TimelineEventDTO> POR_TIMELINE_CRONOLOGICA =
            Comparator.comparing(
                            TimelineEventDTO::dataCriacao,
                            Comparator.nullsLast(Comparator.naturalOrder())
                    )
                    .thenComparing(
                            TimelineEventDTO::id,
                            Comparator.nullsLast(Comparator.naturalOrder())
                    );

    private OrdenacaoAuditoria() {
    }

    static <T extends BaseEntity> List<T> ordenarPorAtualizacaoDesc(List<T> entidades) {
        if (entidades == null || entidades.isEmpty()) {
            return List.of();
        }
        return entidades.stream().sorted(POR_ATUALIZACAO_DESC).toList();
    }

    static <T extends BaseEntity> List<T> ordenarPorCriacaoDesc(List<T> entidades) {
        if (entidades == null || entidades.isEmpty()) {
            return List.of();
        }
        return entidades.stream().sorted(POR_CRIACAO_DESC).toList();
    }

    static List<EstudoDeCaso> ordenarEstudosPorVigencia(List<EstudoDeCaso> estudos) {
        if (estudos == null || estudos.isEmpty()) {
            return List.of();
        }
        return estudos.stream().sorted(POR_VIGENCIA_ESTUDO).toList();
    }

    static Optional<EstudoDeCaso> selecionarEstudoVigente(List<EstudoDeCaso> estudos) {
        if (estudos == null || estudos.isEmpty()) {
            return Optional.empty();
        }
        return estudos.stream().min(POR_VIGENCIA_ESTUDO);
    }

    static List<TimelineEventDTO> ordenarEventosTimeline(List<TimelineEventDTO> eventos) {
        if (eventos == null || eventos.isEmpty()) {
            return List.of();
        }
        return eventos.stream().sorted(POR_TIMELINE_CRONOLOGICA).toList();
    }

    private static int prioridadeStatus(StatusEstudoCaso status) {
        if (status == null) {
            return 3;
        }
        return switch (status) {
            case ATIVO -> 0;
            case ENCERRADO -> 1;
            case RASCUNHO -> 2;
        };
    }
}

