package com.br.CLAI.mapper;

import com.br.CLAI.domain.EstudoDeCaso;
import com.br.CLAI.domain.IndicadorReutilizavel;
import com.br.CLAI.domain.BaseEntity;
import com.br.CLAI.dto.response.EstudoDeCasoResponseDTO;
import org.springframework.stereotype.Component;

import java.util.stream.Collectors;

@Component
public class EstudoDeCasoMapper {

    public EstudoDeCasoResponseDTO toResponse(EstudoDeCaso entity) {
        if (entity == null) {
            return null;
        }

        EstudoDeCasoResponseDTO dto = new EstudoDeCasoResponseDTO();
        dto.setId(entity.getId());
        
        if (entity.getAluno() != null) {
            dto.setAlunoId(entity.getAluno().getId());
        }
        
        dto.setStatus(entity.getStatus());
        dto.setDiagnosticoInicial(entity.getDiagnosticoInicial());
        
        if (entity.getIndicadores() != null) {
            dto.setIndicadoresIds(entity.getIndicadores().stream()
                    .map(BaseEntity::getId)
                    .collect(Collectors.toList()));
        }

        dto.setCriadoEm(entity.getCriadoEm());
        dto.setAtualizadoEm(entity.getAtualizadoEm());

        return dto;
    }
}
