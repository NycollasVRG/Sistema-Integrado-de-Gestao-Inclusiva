package com.br.CLAI.mapper;

import com.br.CLAI.domain.Aluno;
import com.br.CLAI.domain.EstudoDeCaso;
import com.br.CLAI.domain.Indicacao;
import com.br.CLAI.domain.Usuario;
import com.br.CLAI.dto.response.IndicacaoResponseDTO;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class IndicacaoMapper {

    public IndicacaoResponseDTO toResponse(Indicacao entity) {
        if (entity == null) {
            return null;
        }

        Aluno aluno = entity.getAluno();
        Usuario solicitante = entity.getSolicitante();
        EstudoDeCaso estudoDeCaso = entity.getEstudoDeCaso();

        List<String> disciplinas = entity.getDisciplinasObservadas() != null
                ? List.copyOf(entity.getDisciplinasObservadas())
                : List.of();

        return new IndicacaoResponseDTO(
                entity.getId(),
                aluno != null ? aluno.getId() : null,
                aluno != null ? aluno.getNomeCompleto() : null,
                aluno != null ? aluno.getMatricula() : null,
                aluno != null ? aluno.getStatus() : null,
                solicitante != null ? solicitante.getId() : null,
                solicitante != null ? solicitante.getNome() : null,
                entity.getJustificativaPedagogica(),
                disciplinas,
                entity.getStatus(),
                entity.getJustificativaDecisao(),
                entity.getDecididoPor(),
                entity.getDecididoEm(),
                estudoDeCaso != null ? estudoDeCaso.getId() : null,
                entity.getCriadoEm(),
                entity.getAtualizadoEm()
        );
    }
}
