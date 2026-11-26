package com.br.CLAI.mapper;

import com.br.CLAI.domain.Acompanhamento;
import com.br.CLAI.domain.Aluno;
import com.br.CLAI.domain.PlanoAcao;
import com.br.CLAI.dto.request.PlanoAcaoRequestDTO;
import com.br.CLAI.dto.request.PlanoAcaoUpdateDTO;
import com.br.CLAI.dto.response.PlanoAcaoResponseDTO;
import com.br.CLAI.security.RbacGuard;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
public class PlanoAcaoMapper {

    private final RbacGuard rbacGuard;

    public PlanoAcaoMapper() {
        this(new RbacGuard());
    }

    @Autowired
    public PlanoAcaoMapper(RbacGuard rbacGuard) {
        this.rbacGuard = rbacGuard != null ? rbacGuard : new RbacGuard();
    }

    public PlanoAcao toEntity(PlanoAcaoRequestDTO dto, Acompanhamento acompanhamento) {
        if (dto == null) {
            return null;
        }
        PlanoAcao plano = new PlanoAcao();
        plano.setAcompanhamento(acompanhamento);
        plano.setPeriodoLetivo(dto.periodoLetivo());
        plano.setPeriodoIngresso(dto.periodoIngresso());
        plano.setDataNascimento(dto.dataNascimento());
        plano.setTelefoneEstudante(dto.telefoneEstudante());
        plano.setEmailEstudante(dto.emailEstudante());
        plano.setNomeResponsavel(dto.nomeResponsavel());
        plano.setGrauParentescoResponsavel(dto.grauParentescoResponsavel());
        plano.setTelefoneResponsavel(dto.telefoneResponsavel());
        plano.setEmailResponsavel(dto.emailResponsavel());
        plano.setPossuiComorbidade(dto.possuiComorbidade());
        plano.setComorbidadeDetalhes(dto.comorbidadeDetalhes());
        plano.setUsaMedicacaoContinua(dto.usaMedicacaoContinua());
        plano.setMedicacaoDetalhes(dto.medicacaoDetalhes());
        plano.setFrequentaServicosApoio(dto.frequentaServicosApoio());
        plano.setServicosApoioDetalhes(dto.servicosApoioDetalhes());
        plano.setApresentouDocumentosComprobatorios(dto.apresentouDocumentosComprobatorios());
        plano.setDocumentosComprobatoriosDetalhes(dto.documentosComprobatoriosDetalhes());
        plano.setIdentificacaoNecessidadesEspecificas(dto.identificacaoNecessidadesEspecificas());
        plano.setRelatoPercursoEducacional(dto.relatoPercursoEducacional());
        plano.setDemandasIdentificadas(dto.demandasIdentificadas());
        plano.setPropostasIntervencao(dto.propostasIntervencao());
        plano.setAssinaturaCoordenadorClai(dto.assinaturaCoordenadorClai());
        plano.setDataAssinatura(dto.dataAssinatura());
        return plano;
    }

    public void updateEntityFromDto(PlanoAcao plano, PlanoAcaoUpdateDTO dto) {
        if (plano == null || dto == null) {
            return;
        }
        if (dto.periodoLetivo() != null) plano.setPeriodoLetivo(dto.periodoLetivo());
        if (dto.periodoIngresso() != null) plano.setPeriodoIngresso(dto.periodoIngresso());
        if (dto.dataNascimento() != null) plano.setDataNascimento(dto.dataNascimento());
        if (dto.telefoneEstudante() != null) plano.setTelefoneEstudante(dto.telefoneEstudante());
        if (dto.emailEstudante() != null) plano.setEmailEstudante(dto.emailEstudante());
        if (dto.nomeResponsavel() != null) plano.setNomeResponsavel(dto.nomeResponsavel());
        if (dto.grauParentescoResponsavel() != null) plano.setGrauParentescoResponsavel(dto.grauParentescoResponsavel());
        if (dto.telefoneResponsavel() != null) plano.setTelefoneResponsavel(dto.telefoneResponsavel());
        if (dto.emailResponsavel() != null) plano.setEmailResponsavel(dto.emailResponsavel());
        if (dto.possuiComorbidade() != null) {
            plano.setPossuiComorbidade(dto.possuiComorbidade());
            if (!dto.possuiComorbidade()) {
                plano.setComorbidadeDetalhes(null);
            }
        }
        if (dto.comorbidadeDetalhes() != null) plano.setComorbidadeDetalhes(dto.comorbidadeDetalhes());
        if (dto.usaMedicacaoContinua() != null) {
            plano.setUsaMedicacaoContinua(dto.usaMedicacaoContinua());
            if (!dto.usaMedicacaoContinua()) {
                plano.setMedicacaoDetalhes(null);
            }
        }
        if (dto.medicacaoDetalhes() != null) plano.setMedicacaoDetalhes(dto.medicacaoDetalhes());
        if (dto.frequentaServicosApoio() != null) {
            plano.setFrequentaServicosApoio(dto.frequentaServicosApoio());
            if (!dto.frequentaServicosApoio()) {
                plano.setServicosApoioDetalhes(null);
            }
        }
        if (dto.servicosApoioDetalhes() != null) plano.setServicosApoioDetalhes(dto.servicosApoioDetalhes());
        if (dto.apresentouDocumentosComprobatorios() != null) {
            plano.setApresentouDocumentosComprobatorios(dto.apresentouDocumentosComprobatorios());
            if (!dto.apresentouDocumentosComprobatorios()) {
                plano.setDocumentosComprobatoriosDetalhes(null);
            }
        }
        if (dto.documentosComprobatoriosDetalhes() != null) {
            plano.setDocumentosComprobatoriosDetalhes(dto.documentosComprobatoriosDetalhes());
        }
        if (dto.identificacaoNecessidadesEspecificas() != null) {
            plano.setIdentificacaoNecessidadesEspecificas(dto.identificacaoNecessidadesEspecificas());
        }
        if (dto.relatoPercursoEducacional() != null) {
            plano.setRelatoPercursoEducacional(dto.relatoPercursoEducacional());
        }
        if (dto.demandasIdentificadas() != null) plano.setDemandasIdentificadas(dto.demandasIdentificadas());
        if (dto.propostasIntervencao() != null) plano.setPropostasIntervencao(dto.propostasIntervencao());
        if (dto.assinaturaCoordenadorClai() != null) plano.setAssinaturaCoordenadorClai(dto.assinaturaCoordenadorClai());
        if (dto.dataAssinatura() != null) plano.setDataAssinatura(dto.dataAssinatura());
    }

    public PlanoAcaoResponseDTO toResponse(PlanoAcao plano) {
        boolean incluirDadosClinicos = !rbacGuard.temApenasAcessoFuncional();
        return toResponse(plano, incluirDadosClinicos);
    }

    public PlanoAcaoResponseDTO toResponse(PlanoAcao plano, boolean incluirDadosClinicos) {
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
                plano.getPeriodoLetivo(),
                plano.getPeriodoIngresso(),
                plano.getDataNascimento(),
                plano.getTelefoneEstudante(),
                plano.getEmailEstudante(),
                plano.getNomeResponsavel(),
                plano.getGrauParentescoResponsavel(),
                plano.getTelefoneResponsavel(),
                plano.getEmailResponsavel(),
                incluirDadosClinicos ? plano.getPossuiComorbidade() : null,
                incluirDadosClinicos ? plano.getComorbidadeDetalhes() : null,
                incluirDadosClinicos ? plano.getUsaMedicacaoContinua() : null,
                incluirDadosClinicos ? plano.getMedicacaoDetalhes() : null,
                incluirDadosClinicos ? plano.getFrequentaServicosApoio() : null,
                incluirDadosClinicos ? plano.getServicosApoioDetalhes() : null,
                incluirDadosClinicos ? plano.getApresentouDocumentosComprobatorios() : null,
                incluirDadosClinicos ? plano.getDocumentosComprobatoriosDetalhes() : null,
                plano.getIdentificacaoNecessidadesEspecificas(),
                plano.getRelatoPercursoEducacional(),
                plano.getDemandasIdentificadas(),
                plano.getPropostasIntervencao(),
                plano.getAssinaturaCoordenadorClai(),
                plano.getDataAssinatura(),
                plano.getCriadoEm(),
                plano.getAtualizadoEm()
        );
    }
}
