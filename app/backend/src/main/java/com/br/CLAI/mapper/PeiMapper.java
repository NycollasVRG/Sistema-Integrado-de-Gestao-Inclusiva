package com.br.CLAI.mapper;

import com.br.CLAI.domain.Acompanhamento;
import com.br.CLAI.domain.Pei;
import com.br.CLAI.dto.request.PeiRequestDTO;
import com.br.CLAI.dto.request.PeiUpdateDTO;
import com.br.CLAI.dto.response.PeiResponseDTO;
import com.br.CLAI.service.RaiService;
import org.springframework.stereotype.Component;

@Component
public class PeiMapper {

    public Pei toEntity(PeiRequestDTO dto, Acompanhamento acompanhamento) {
        Pei pei = new Pei(
                acompanhamento,
                dto.semestreAno(),
                dto.historicoEstudante(),
                dto.necessidadesEspecificas(),
                dto.habilidadesInteresses(),
                dto.dificuldadesApresentadas(),
                dto.propostasAdaptacoes()
        );
        pei.setAssinaturaClai(dto.assinaturaClai());
        pei.setAssinaturaSetorPedagogico(dto.assinaturaSetorPedagogico());
        pei.setAssinaturaCoordenadorCurso(dto.assinaturaCoordenadorCurso());
        pei.setAssinaturaEstudanteResponsavel(dto.assinaturaEstudanteResponsavel());
        pei.setAssinaturasDocentes(RaiService.serializarOpcoes(dto.assinaturasDocentes()));
        return pei;
    }

    public void updateEntityFromDto(Pei pei, PeiUpdateDTO dto) {
        if (dto.semestreAno() != null) pei.setSemestreAno(dto.semestreAno());
        if (dto.historicoEstudante() != null) pei.setHistoricoEstudante(dto.historicoEstudante());
        if (dto.necessidadesEspecificas() != null) pei.setNecessidadesEspecificas(dto.necessidadesEspecificas());
        if (dto.habilidadesInteresses() != null) pei.setHabilidadesInteresses(dto.habilidadesInteresses());
        if (dto.dificuldadesApresentadas() != null) pei.setDificuldadesApresentadas(dto.dificuldadesApresentadas());
        if (dto.propostasAdaptacoes() != null) pei.setPropostasAdaptacoes(dto.propostasAdaptacoes());
        if (dto.assinaturaClai() != null) pei.setAssinaturaClai(dto.assinaturaClai());
        if (dto.assinaturaSetorPedagogico() != null) pei.setAssinaturaSetorPedagogico(dto.assinaturaSetorPedagogico());
        if (dto.assinaturaCoordenadorCurso() != null) pei.setAssinaturaCoordenadorCurso(dto.assinaturaCoordenadorCurso());
        if (dto.assinaturaEstudanteResponsavel() != null) pei.setAssinaturaEstudanteResponsavel(dto.assinaturaEstudanteResponsavel());
        if (dto.assinaturasDocentes() != null) pei.setAssinaturasDocentes(RaiService.serializarOpcoes(dto.assinaturasDocentes()));
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
                pei.getAssinaturaClai(),
                pei.getAssinaturaSetorPedagogico(),
                pei.getAssinaturaCoordenadorCurso(),
                pei.getAssinaturaEstudanteResponsavel(),
                RaiService.desserializarOpcoes(pei.getAssinaturasDocentes()),
                pei.getCriadoEm(),
                pei.getAtualizadoEm()
        );
    }
}
