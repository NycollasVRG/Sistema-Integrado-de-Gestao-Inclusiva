package com.br.CLAI.mapper;

import com.br.CLAI.domain.Acompanhamento;
import com.br.CLAI.domain.Aluno;
import com.br.CLAI.domain.PlanoAcao;
import com.br.CLAI.dto.request.PlanoAcaoRequestDTO;
import com.br.CLAI.dto.request.PlanoAcaoUpdateDTO;
import com.br.CLAI.dto.response.PlanoAcaoResponseDTO;
import org.springframework.stereotype.Component;

@Component
public class PlanoAcaoMapper {

    public PlanoAcao toEntity(PlanoAcaoRequestDTO dto, Acompanhamento acompanhamento) {
        if (dto == null) {
            return null;
        }
        return new PlanoAcao(
                acompanhamento,
                dto.demandasIdentificadas(),
                dto.propostasIntervencao(),
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

    public void updateEntityFromDto(PlanoAcao plano, PlanoAcaoUpdateDTO dto) {
        if (plano == null || dto == null) {
            return;
        }
        if (dto.demandasIdentificadas() != null) {
            plano.setDemandasIdentificadas(dto.demandasIdentificadas());
        }
        if (dto.propostasIntervencao() != null) {
            plano.setPropostasIntervencao(dto.propostasIntervencao());
        }
        if (dto.componenteCurricular() != null) {
            plano.setComponenteCurricular(dto.componenteCurricular());
        }
        if (dto.semestreAno() != null) {
            plano.setSemestreAno(dto.semestreAno());
        }
        if (dto.docente() != null) {
            plano.setDocente(dto.docente());
        }
        if (dto.objetivoGeral() != null) {
            plano.setObjetivoGeral(dto.objetivoGeral());
        }
        if (dto.objetivosEspecificos() != null) {
            plano.setObjetivosEspecificos(dto.objetivosEspecificos());
        }
        if (dto.conteudosProgramaticos() != null) {
            plano.setConteudosProgramaticos(dto.conteudosProgramaticos());
        }
        if (dto.metodologia() != null) {
            plano.setMetodologia(dto.metodologia());
        }
        if (dto.avaliacao() != null) {
            plano.setAvaliacao(dto.avaliacao());
        }
        if (dto.bibliografiaBasica() != null) {
            plano.setBibliografiaBasica(dto.bibliografiaBasica());
        }
        if (dto.bibliografiaComplementar() != null) {
            plano.setBibliografiaComplementar(dto.bibliografiaComplementar());
        }
    }

    public PlanoAcaoResponseDTO toResponse(PlanoAcao plano) {
        if (plano == null) {
            return null;
        }
        Acompanhamento acompanhamento = plano.getAcompanhamento();
        Aluno aluno = acompanhamento != null ? acompanhamento.getAluno() : null;

        return new PlanoAcaoResponseDTO(
                plano.getId(),
                acompanhamento != null ? acompanhamento.getId() : null,
                aluno != null ? aluno.getId() : null,
                aluno != null ? aluno.getNomeCompleto() : null,
                aluno != null ? aluno.getMatricula() : null,
                aluno != null ? aluno.getCurso() : null,
                plano.getDemandasIdentificadas(),
                plano.getPropostasIntervencao(),
                plano.getComponenteCurricular(),
                plano.getSemestreAno(),
                plano.getDocente(),
                plano.getObjetivoGeral(),
                plano.getObjetivosEspecificos(),
                plano.getConteudosProgramaticos(),
                plano.getMetodologia(),
                plano.getAvaliacao(),
                plano.getBibliografiaBasica(),
                plano.getBibliografiaComplementar(),
                plano.getCriadoEm(),
                plano.getAtualizadoEm()
        );
    }
}
