package com.br.CLAI.mapper;

import com.br.CLAI.domain.Acompanhamento;
import com.br.CLAI.domain.Pea;
import com.br.CLAI.domain.Pei;
import com.br.CLAI.dto.request.PeaRequestDTO;
import com.br.CLAI.dto.request.PeaUpdateDTO;
import com.br.CLAI.dto.response.PeaResponseDTO;
import org.springframework.stereotype.Component;

@Component
public class PeaMapper {

    public Pea toEntity(
            PeaRequestDTO dto,
            Acompanhamento acompanhamento) {
        return toEntity(dto, acompanhamento, null);
    }

    public Pea toEntity(
            PeaRequestDTO dto,
            Acompanhamento acompanhamento,
            Pei pei) {

        return new Pea(
                acompanhamento,
                pei,
                dto.disciplinaId(),
                dto.componenteCurricular(),
                dto.semestreAno(),
                dto.docente(),
                dto.objetivoGeral(),
                dto.objetivosEspecificos(),
                dto.conteudosProgramaticos(),
                dto.metodologia(),
                dto.avaliacao(),
                dto.bibliografiaBasica(),
                dto.bibliografiaComplementar()
        );
    }

    public void updateEntityFromDto(
            Pea pea,
            PeaUpdateDTO dto) {

        if (dto.disciplinaId() != null) {
            pea.setDisciplinaId(dto.disciplinaId());
        }

        if (dto.componenteCurricular() != null) {
            pea.setComponenteCurricular(dto.componenteCurricular());
        }

        if (dto.semestreAno() != null) {
            pea.setSemestreAno(dto.semestreAno());
        }

        if (dto.docente() != null) {
            pea.setDocente(dto.docente());
        }

        if (dto.objetivoGeral() != null) {
            pea.setObjetivoGeral(dto.objetivoGeral());
        }

        if (dto.objetivosEspecificos() != null) {
            pea.setObjetivosEspecificos(dto.objetivosEspecificos());
        }

        if (dto.conteudosProgramaticos() != null) {
            pea.setConteudosProgramaticos(dto.conteudosProgramaticos());
        }

        if (dto.metodologia() != null) {
            pea.setMetodologia(dto.metodologia());
        }

        if (dto.avaliacao() != null) {
            pea.setAvaliacao(dto.avaliacao());
        }

        if (dto.bibliografiaBasica() != null) {
            pea.setBibliografiaBasica(dto.bibliografiaBasica());
        }

        if (dto.bibliografiaComplementar() != null) {
            pea.setBibliografiaComplementar(dto.bibliografiaComplementar());
        }
    }

    public PeaResponseDTO toResponse(Pea pea) {
        if (pea == null) {
            return null;
        }

        return new PeaResponseDTO(
                pea.getId(),
                pea.getAcompanhamento() != null ? pea.getAcompanhamento().getId() : null,
                pea.getPei() != null ? pea.getPei().getId() : null,
                pea.getAcompanhamento() != null && pea.getAcompanhamento().getAluno() != null
                        ? pea.getAcompanhamento().getAluno().getId()
                        : null,
                pea.getDisciplinaId(),
                pea.getComponenteCurricular(),
                pea.getSemestreAno(),
                pea.getDocente(),
                pea.getObjetivoGeral(),
                pea.getObjetivosEspecificos(),
                pea.getConteudosProgramaticos(),
                pea.getMetodologia(),
                pea.getAvaliacao(),
                pea.getBibliografiaBasica(),
                pea.getBibliografiaComplementar(),
                pea.getCriadoEm(),
                pea.getAtualizadoEm()
        );
    }
}

