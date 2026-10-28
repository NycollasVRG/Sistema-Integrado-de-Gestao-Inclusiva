package com.br.CLAI.mapper;

import com.br.CLAI.domain.Aluno;
import com.br.CLAI.domain.BaseEntity;
import com.br.CLAI.domain.IndicadorReutilizavel;
import com.br.CLAI.dto.response.EstudanteResponseDTO;
import org.springframework.stereotype.Component;

import java.util.Comparator;
import java.util.List;

@Component
public class EstudanteMapper {

    public EstudanteResponseDTO toResponse(Aluno aluno) {
        if (aluno == null) {
            return null;
        }

        List<IndicadorReutilizavel> tags = aluno.getTagsDificuldade().stream()
                .sorted(Comparator.comparing(IndicadorReutilizavel::getNome, String.CASE_INSENSITIVE_ORDER))
                .toList();

        return new EstudanteResponseDTO(
                aluno.getId(),
                aluno.getNomeCompleto(),
                aluno.getMatricula(),
                aluno.getCurso(),
                aluno.getTurma(),
                aluno.getStatus(),
                aluno.getAtivo(),
                tags.stream().map(IndicadorReutilizavel::getNome).toList(),
                tags.stream().map(BaseEntity::getId).toList(),
                aluno.getCriadoEm(),
                aluno.getAtualizadoEm()
        );
    }
}
