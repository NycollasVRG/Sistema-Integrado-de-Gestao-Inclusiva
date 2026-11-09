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
                dto.habilidadesInteresses(),
                dto.propostasAdaptacoes()
        );
    }

    public void updateEntityFromDto(Pei pei, PeiUpdateDTO dto) {

        if (dto.habilidadesInteresses() != null) {
            pei.setHabilidadesInteresses(dto.habilidadesInteresses());
        }

        if (dto.propostasAdaptacoes() != null) {
            pei.setPropostasAdaptacoes(dto.propostasAdaptacoes());
        }
    }

    public PeiResponseDTO toResponse(Pei pei) {
        if (pei == null) {
            return null;
        }

        return new PeiResponseDTO(
                pei.getId(),
                pei.getAcompanhamento() != null ? pei.getAcompanhamento().getId() : null,
                pei.getAcompanhamento() != null && pei.getAcompanhamento().getAluno() != null
                        ? pei.getAcompanhamento().getAluno().getId()
                        : null,
                pei.getHabilidadesInteresses(),
                pei.getPropostasAdaptacoes(),
                pei.getCriadoEm(),
                pei.getAtualizadoEm()
        );
    }
}
