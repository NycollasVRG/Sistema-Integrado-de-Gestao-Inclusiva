package com.br.CLAI.mapper;

import com.br.CLAI.domain.Aluno;
import com.br.CLAI.domain.Atendimento;
import com.br.CLAI.dto.request.AtendimentoRequestDTO;
import com.br.CLAI.dto.request.AtendimentoUpdateDTO;
import com.br.CLAI.dto.response.AtendimentoResponseDTO;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.LocalDateTime;

@Component
public class AtendimentoMapper {

    public Atendimento toEntity(AtendimentoRequestDTO dto, Aluno aluno) {
        if (dto == null) {
            return null;
        }
        return new Atendimento(
                aluno,
                dto.tipoAtendimento(),
                dto.dataAtendimento(),
                dto.profissionalResponsavel().trim(),
                dto.descricao().trim(),
                normalizarOpcional(dto.encaminhamentos())
        );
    }

    public void updateEntityFromDto(Atendimento atendimento, AtendimentoUpdateDTO dto) {
        if (atendimento == null || dto == null) {
            return;
        }
        atendimento.setTipoAtendimento(dto.tipoAtendimento());
        atendimento.setDataAtendimento(dto.dataAtendimento());
        atendimento.setProfissionalResponsavel(dto.profissionalResponsavel().trim());
        atendimento.setDescricao(dto.descricao().trim());
        atendimento.setEncaminhamentos(normalizarOpcional(dto.encaminhamentos()));
    }

    public AtendimentoResponseDTO toResponse(Atendimento atendimento, Duration janelaEdicao) {
        if (atendimento == null) {
            return null;
        }
        Aluno aluno = atendimento.getAluno();
        LocalDateTime criadoEm = atendimento.getCriadoEm();

        return new AtendimentoResponseDTO(
                atendimento.getId(),
                aluno != null ? aluno.getId() : null,
                aluno != null ? aluno.getNomeCompleto() : null,
                aluno != null ? aluno.getMatricula() : null,
                atendimento.getTipoAtendimento(),
                atendimento.getDataAtendimento(),
                atendimento.getProfissionalResponsavel(),
                atendimento.getDescricao(),
                atendimento.getEncaminhamentos(),
                atendimento.getCriadoPor(),
                criadoEm,
                atendimento.getAtualizadoEm(),
                criadoEm != null ? criadoEm.plus(janelaEdicao) : null
        );
    }

    private String normalizarOpcional(String valor) {
        if (valor == null || valor.isBlank()) {
            return null;
        }
        return valor.trim();
    }
}
