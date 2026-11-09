package com.br.CLAI.service;

import com.br.CLAI.domain.Aluno;
import com.br.CLAI.domain.EstudoDeCaso;
import com.br.CLAI.domain.enums.StatusEstudoCaso;
import com.br.CLAI.dto.response.ProntuarioResponseDTO;
import com.br.CLAI.exception.NaoEncontradoException;
import com.br.CLAI.repository.AlunoRepository;
import com.br.CLAI.repository.AnexoEstudanteRepository;
import com.br.CLAI.repository.EstudoDeCasoRepository;
import com.br.CLAI.repository.PeaRepository;
import com.br.CLAI.repository.PeiRepository;
import com.br.CLAI.security.RbacGuard;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Serviço agregador do Prontuário Unificado do Estudante (US 09).
 * Centraliza e projeta os dados pedagógicos, clínicos e socioemocionais
 * aplicando as regras de omissão granular da LGPD e TA11.3.
 */
@Service
public class ProntuarioService {

    private final AlunoRepository alunoRepository;
    private final EstudoDeCasoRepository estudoDeCasoRepository;
    private final PeiRepository peiRepository;
    private final PeaRepository peaRepository;
    private final AnexoEstudanteRepository anexoEstudanteRepository;
    private final RbacGuard rbacGuard;

    public ProntuarioService(
            AlunoRepository alunoRepository,
            EstudoDeCasoRepository estudoDeCasoRepository,
            PeiRepository peiRepository,
            PeaRepository peaRepository,
            AnexoEstudanteRepository anexoEstudanteRepository,
            RbacGuard rbacGuard) {
        this.alunoRepository = alunoRepository;
        this.estudoDeCasoRepository = estudoDeCasoRepository;
        this.peiRepository = peiRepository;
        this.peaRepository = peaRepository;
        this.anexoEstudanteRepository = anexoEstudanteRepository;
        this.rbacGuard = rbacGuard;
    }

    @Transactional(readOnly = true)
    public ProntuarioResponseDTO buscarProntuarioPorEstudante(UUID alunoId) {
        Aluno aluno = alunoRepository.findById(alunoId)
                .orElseThrow(() -> new NaoEncontradoException("Estudante não encontrado com o ID: " + alunoId));

        List<EstudoDeCaso> estudos = estudoDeCasoRepository.findByAlunoId(alunoId);
        EstudoDeCaso estudoAtivo = estudos.stream()
                .filter(e -> StatusEstudoCaso.ATIVO.equals(e.getStatus()))
                .findFirst()
                .orElseGet(() -> estudos.isEmpty() ? null : estudos.get(estudos.size() - 1));

        int totalPeis = peiRepository.findByAcompanhamento_Aluno_Id(alunoId).size();
        int totalPeas = peaRepository.findByAcompanhamento_Aluno_Id(alunoId).size();
        int totalAnexos = anexoEstudanteRepository.findByAlunoIdOrderByCriadoEmDesc(alunoId).size();

        UUID estudoId = estudoAtivo != null ? estudoAtivo.getId() : null;
        StatusEstudoCaso statusEstudo = estudoAtivo != null ? estudoAtivo.getStatus() : null;
        String diagnostico = estudoAtivo != null ? estudoAtivo.getDiagnosticoInicial() : null;
        LocalDateTime atualizadoEm = estudoAtivo != null ? estudoAtivo.getAtualizadoEm() : aluno.getAtualizadoEm();

        String historicoFamiliar = null;
        String historicoSocioemocional = null;

        // TA11.3: Exposição de histórico familiar e socioemocional restrita a RESTRICAO_MODERADA ou superior
        if (rbacGuard != null && rbacGuard.podeAcessarDadosSensiveis() && estudoAtivo != null) {
            historicoFamiliar = estudoAtivo.getHistoricoFamiliar();
            historicoSocioemocional = estudoAtivo.getHistoricoSocioemocional();
        }

        return new ProntuarioResponseDTO(
                aluno.getId(),
                aluno.getNomeCompleto(),
                aluno.getMatricula(),
                estudoId,
                statusEstudo,
                diagnostico,
                historicoFamiliar,
                historicoSocioemocional,
                totalPeis,
                totalPeas,
                totalAnexos,
                atualizadoEm
        );
    }

    @Transactional(readOnly = true)
    public com.br.CLAI.dto.response.HistoricoSocioemocionalResponseDTO buscarHistoricoSocioemocional(UUID alunoId) {
        Aluno aluno = alunoRepository.findById(alunoId)
                .orElseThrow(() -> new NaoEncontradoException("Estudante não encontrado com o ID: " + alunoId));

        List<EstudoDeCaso> estudos = estudoDeCasoRepository.findByAlunoId(alunoId);
        EstudoDeCaso estudoAtivo = estudos.stream()
                .filter(e -> StatusEstudoCaso.ATIVO.equals(e.getStatus()))
                .findFirst()
                .orElseGet(() -> estudos.isEmpty() ? null : estudos.get(estudos.size() - 1));

        UUID estudoId = estudoAtivo != null ? estudoAtivo.getId() : null;
        String historicoFamiliar = estudoAtivo != null ? estudoAtivo.getHistoricoFamiliar() : null;
        String historicoSocioemocional = estudoAtivo != null ? estudoAtivo.getHistoricoSocioemocional() : null;
        LocalDateTime atualizadoEm = estudoAtivo != null ? estudoAtivo.getAtualizadoEm() : aluno.getAtualizadoEm();

        return new com.br.CLAI.dto.response.HistoricoSocioemocionalResponseDTO(
                aluno.getId(),
                aluno.getNomeCompleto(),
                aluno.getMatricula(),
                estudoId,
                historicoFamiliar,
                historicoSocioemocional,
                atualizadoEm
        );
    }
}
