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
                dto.semestreAno(),
                dto.historicoEstudante(),
                dto.necessidadesEspecificas(),
                dto.habilidadesInteresses(),
                dto.dificuldadesApresentadas(),
                dto.propostasAdaptacoes()
        );
    }

    public void updateEntityFromDto(Pei pei, PeiUpdateDTO dto) {

        if (dto.semestreAno() != null) {
            pei.setSemestreAno(dto.semestreAno());
        }

        if (dto.historicoEstudante() != null) {
            pei.setHistoricoEstudante(dto.historicoEstudante());
        }

        if (dto.necessidadesEspecificas() != null) {
            pei.setNecessidadesEspecificas(dto.necessidadesEspecificas());
        }

        if (dto.habilidadesInteresses() != null) {
            pei.setHabilidadesInteresses(dto.habilidadesInteresses());
        }

        if (dto.dificuldadesApresentadas() != null) {
            pei.setDificuldadesApresentadas(dto.dificuldadesApresentadas());
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
                pei.getSemestreAno(),
                pei.getHistoricoEstudante(),
                pei.getNecessidadesEspecificas(),
                pei.getHabilidadesInteresses(),
                pei.getDificuldadesApresentadas(),
                pei.getPropostasAdaptacoes(),
                pei.getCriadoEm(),
                pei.getAtualizadoEm()
        );
    }
}

