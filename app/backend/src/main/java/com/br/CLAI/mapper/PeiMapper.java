package com.br.CLAI.mapper;

import com.br.CLAI.domain.Acompanhamento;
import com.br.CLAI.domain.Pei;
import com.br.CLAI.dto.request.PeiRequestDTO;
import com.br.CLAI.dto.request.PeiUpdateDTO;
import com.br.CLAI.dto.response.PeiResponseDTO;
import org.springframework.stereotype.Component;

@Component
public class PeiMapper {

    public Pei toEntity(PeiRequestDTO dto, Acompanhamento acompanhamento) {

        return new Pei(
                acompanhamento,
                dto.getHabilidadesInteresses(),
                dto.getPropostasAdaptacoes()
        );
    }

    public void updateEntityFromDto(Pei pei, PeiUpdateDTO dto) {

        if (dto.getHabilidadesInteresses() != null) {
            pei.setHabilidadesInteresses(dto.getHabilidadesInteresses());
        }

        if (dto.getPropostasAdaptacoes() != null) {
            pei.setPropostasAdaptacoes(dto.getPropostasAdaptacoes());
        }
    }

    public PeiResponseDTO toResponse(Pei pei) {

        PeiResponseDTO dto = new PeiResponseDTO();

        dto.setId(pei.getId());
        dto.setAcompanhamentoId(pei.getAcompanhamento().getId());
        dto.setAlunoId(pei.getAcompanhamento().getAluno().getId());
        dto.setHabilidadesInteresses(pei.getHabilidadesInteresses());
        dto.setPropostasAdaptacoes(pei.getPropostasAdaptacoes());
        dto.setCriadoEm(pei.getCriadoEm());
        dto.setAtualizadoEm(pei.getAtualizadoEm());

        return dto;
    }
}
