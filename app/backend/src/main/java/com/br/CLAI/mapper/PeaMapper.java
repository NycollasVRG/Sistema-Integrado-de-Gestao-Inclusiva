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
                dto.getDisciplinaId(),
                dto.getObjetivoGeral(),
                dto.getMetodologia(),
                dto.getAvaliacao()
        );
    }

    public void updateEntityFromDto(
            Pea pea,
            PeaUpdateDTO dto) {

        if (dto.getDisciplinaId() != null) {
            pea.setDisciplinaId(dto.getDisciplinaId());
        }

        if (dto.getObjetivoGeral() != null) {
            pea.setObjetivoGeral(dto.getObjetivoGeral());
        }

        if (dto.getMetodologia() != null) {
            pea.setMetodologia(dto.getMetodologia());
        }

        if (dto.getAvaliacao() != null) {
            pea.setAvaliacao(dto.getAvaliacao());
        }
    }

    public PeaResponseDTO toResponse(Pea pea) {

        PeaResponseDTO dto = new PeaResponseDTO();

        dto.setId(pea.getId());

        dto.setAcompanhamentoId(
                pea.getAcompanhamento().getId()
        );

        dto.setAlunoId(
                pea.getAcompanhamento()
                        .getAluno()
                        .getId()
        );

        dto.setDisciplinaId(pea.getDisciplinaId());
        dto.setObjetivoGeral(pea.getObjetivoGeral());
        dto.setMetodologia(pea.getMetodologia());
        dto.setAvaliacao(pea.getAvaliacao());

        dto.setCriadoEm(pea.getCriadoEm());
        dto.setAtualizadoEm(pea.getAtualizadoEm());

        return dto;
    }
}