package com.br.CLAI.mapper;

import com.br.CLAI.domain.Acompanhamento;
import com.br.CLAI.domain.Pea;
import com.br.CLAI.dto.request.PeaRequestDTO;
import com.br.CLAI.dto.request.PeaUpdateDTO;
import com.br.CLAI.dto.response.PeaResponseDTO;
import org.springframework.stereotype.Component;

@Component
public class PeaMapper {

    public Pea toEntity(
            PeaRequestDTO dto,
            Acompanhamento acompanhamento) {

        return new Pea(
                acompanhamento,
                dto.disciplinaId(),
                dto.objetivoGeral(),
                dto.metodologia(),
                dto.avaliacao()
        );
    }

    public void updateEntityFromDto(
            Pea pea,
            PeaUpdateDTO dto) {

        if (dto.disciplinaId() != null) {
            pea.setDisciplinaId(dto.disciplinaId());
        }

        if (dto.objetivoGeral() != null) {
            pea.setObjetivoGeral(dto.objetivoGeral());
        }

        if (dto.metodologia() != null) {
            pea.setMetodologia(dto.metodologia());
        }

        if (dto.avaliacao() != null) {
            pea.setAvaliacao(dto.avaliacao());
        }
    }

    public PeaResponseDTO toResponse(Pea pea) {
        if (pea == null) {
            return null;
        }

        return new PeaResponseDTO(
                pea.getId(),
                pea.getAcompanhamento() != null ? pea.getAcompanhamento().getId() : null,
                pea.getAcompanhamento() != null && pea.getAcompanhamento().getAluno() != null
                        ? pea.getAcompanhamento().getAluno().getId()
                        : null,
                pea.getDisciplinaId(),
                pea.getObjetivoGeral(),
                pea.getMetodologia(),
                pea.getAvaliacao(),
                pea.getCriadoEm(),
                pea.getAtualizadoEm()
        );
    }
}
