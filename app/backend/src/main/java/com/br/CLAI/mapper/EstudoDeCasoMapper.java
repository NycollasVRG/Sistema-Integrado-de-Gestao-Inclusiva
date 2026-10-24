package com.br.CLAI.mapper;

import com.br.CLAI.domain.EstudoDeCaso;
import com.br.CLAI.domain.IndicadorReutilizavel;
import com.br.CLAI.domain.BaseEntity;
import com.br.CLAI.dto.request.EstudoDeCasoRequestDTO;
import com.br.CLAI.dto.request.EstudoDeCasoUpdateDTO;
import com.br.CLAI.dto.response.EstudoDeCasoResponseDTO;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
public class EstudoDeCasoMapper {

    public EstudoDeCasoResponseDTO toResponse(EstudoDeCaso entity) {
        if (entity == null) {
            return null;
        }

        List<java.util.UUID> indicadoresIds = null;
        if (entity.getIndicadores() != null) {
            indicadoresIds = entity.getIndicadores().stream()
                    .map(BaseEntity::getId)
                    .collect(Collectors.toList());
        }

        return new EstudoDeCasoResponseDTO(
                entity.getId(),
                entity.getAluno() != null ? entity.getAluno().getId() : null,
                entity.getStatus(),
                entity.getDiagnosticoInicial(),
                indicadoresIds,
                entity.getCriadoEm(),
                entity.getAtualizadoEm()
        );
    }

    public EstudoDeCaso toEntity(EstudoDeCasoRequestDTO dto, 
                                com.br.CLAI.domain.Aluno aluno, 
                                List<IndicadorReutilizavel> indicadores) {
        if (dto == null) {
            return null;
        }

        EstudoDeCaso entidade = new EstudoDeCaso();
        entidade.setAluno(aluno);
        entidade.setStatus(dto.status());
        entidade.setDiagnosticoInicial(dto.diagnosticoInicial());
        if (indicadores != null) {
            entidade.setIndicadores(new java.util.ArrayList<>(indicadores));
        }

        return entidade;
    }

    public void updateEntityFromDto(EstudoDeCaso entidade, 
                                    EstudoDeCasoUpdateDTO dto, 
                                    List<IndicadorReutilizavel> indicadores) {
        if (entidade == null || dto == null) {
            return;
        }

        entidade.setStatus(dto.status());
        entidade.setDiagnosticoInicial(dto.diagnosticoInicial());
        if (indicadores != null) {
            entidade.setIndicadores(new java.util.ArrayList<>(indicadores));
        }
    }
}
