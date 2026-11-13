package com.br.CLAI.service;

import com.br.CLAI.domain.Acompanhamento;
import com.br.CLAI.domain.Aluno;
import com.br.CLAI.domain.EstudoDeCaso;
import com.br.CLAI.domain.PlanoAcao;
import com.br.CLAI.domain.enums.StatusEstudoCaso;
import com.br.CLAI.dto.request.PlanoAcaoRequestDTO;
import com.br.CLAI.dto.request.PlanoAcaoUpdateDTO;
import com.br.CLAI.dto.response.PlanoAcaoResponseDTO;
import com.br.CLAI.exception.NaoEncontradoException;
import com.br.CLAI.exception.RegraDeNegocioException;
import com.br.CLAI.mapper.PlanoAcaoMapper;
import com.br.CLAI.repository.AcompanhamentoRepository;
import com.br.CLAI.repository.EstudoDeCasoRepository;
import com.br.CLAI.repository.PlanoAcaoRepository;
import org.springframework.security.authentication.AuthenticationCredentialsNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class PlanoAcaoService {

    private final PlanoAcaoRepository repository;
    private final AcompanhamentoRepository acompanhamentoRepository;
    private final EstudoDeCasoRepository estudoDeCasoRepository;
    private final PlanoAcaoMapper mapper;

    public PlanoAcaoService(
            PlanoAcaoRepository repository,
            AcompanhamentoRepository acompanhamentoRepository,
            EstudoDeCasoRepository estudoDeCasoRepository,
            PlanoAcaoMapper mapper) {
        this.repository = repository;
        this.acompanhamentoRepository = acompanhamentoRepository;
        this.estudoDeCasoRepository = estudoDeCasoRepository;
        this.mapper = mapper;
    }

    @Transactional(readOnly = true)
    public List<PlanoAcaoResponseDTO> listarTodos() {
        return OrdenacaoAuditoria.ordenarPorCriacaoDesc(repository.findAll())
                .stream()
                .map(mapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public PlanoAcaoResponseDTO buscarPorId(UUID id) {
        PlanoAcao plano = repository.findById(id)
                .orElseThrow(() -> new NaoEncontradoException("Plano de Ação não encontrado com o ID fornecido."));
        return mapper.toResponse(plano);
    }

    @Transactional(readOnly = true)
    public List<PlanoAcaoResponseDTO> listarPorAcompanhamento(UUID acompanhamentoId) {
        return OrdenacaoAuditoria.ordenarPorCriacaoDesc(repository.findByAcompanhamentoId(acompanhamentoId))
                .stream()
                .map(mapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<PlanoAcaoResponseDTO> listarPorAluno(UUID alunoId) {
        return OrdenacaoAuditoria.ordenarPorCriacaoDesc(repository.findByAcompanhamento_Aluno_Id(alunoId))
                .stream()
                .map(mapper::toResponse)
                .toList();
    }

    @Transactional
    public PlanoAcaoResponseDTO criar(PlanoAcaoRequestDTO dto, UUID usuarioId) {
        validarUsuarioResponsavel(usuarioId);

        Acompanhamento acompanhamento = acompanhamentoRepository.findById(dto.acompanhamentoId())
                .orElseThrow(() -> new NaoEncontradoException("Acompanhamento não encontrado."));

        validarEstudoDeCasoConcluido(acompanhamento);

        PlanoAcao plano = mapper.toEntity(dto, acompanhamento);
        plano.setCriadoPor(usuarioId);
        plano.setAtualizadoPor(usuarioId);

        PlanoAcao salvo = repository.save(plano);
        return mapper.toResponse(salvo);
    }

    @Transactional
    public PlanoAcaoResponseDTO atualizar(UUID id, PlanoAcaoUpdateDTO dto, UUID usuarioId) {
        validarUsuarioResponsavel(usuarioId);

        PlanoAcao plano = repository.findById(id)
                .orElseThrow(() -> new NaoEncontradoException("Plano de Ação não encontrado com o ID fornecido."));

        mapper.updateEntityFromDto(plano, dto);
        plano.setAtualizadoPor(usuarioId);

        PlanoAcao salvo = repository.save(plano);
        return mapper.toResponse(salvo);
    }

    @Transactional
    public void excluir(UUID id, UUID usuarioId) {
        validarUsuarioResponsavel(usuarioId);

        PlanoAcao plano = repository.findById(id)
                .orElseThrow(() -> new NaoEncontradoException("Plano de Ação não encontrado com o ID fornecido."));

        plano.setAtualizadoPor(usuarioId);
        repository.save(plano);
        repository.delete(plano);
    }

    private void validarEstudoDeCasoConcluido(Acompanhamento acompanhamento) {
        Aluno aluno = acompanhamento.getAluno();
        if (aluno == null || aluno.getId() == null) {
            throw new RegraDeNegocioException("Acompanhamento não possui estudante vinculado para validação do Estudo de Caso.");
        }

        List<EstudoDeCaso> estudos = estudoDeCasoRepository.findByAlunoId(aluno.getId());
        if (estudos == null || estudos.isEmpty()) {
            throw new RegraDeNegocioException(
                    "Não é possível criar um Plano de Ação: o estudante não possui Estudo de Caso concluído (status atual: PENDENTE)."
            );
        }

        boolean possuiEstudoConcluido = estudos.stream()
                .anyMatch(estudo -> StatusEstudoCaso.ATIVO.equals(estudo.getStatus())
                        || StatusEstudoCaso.ENCERRADO.equals(estudo.getStatus()));

        if (!possuiEstudoConcluido) {
            throw new RegraDeNegocioException(
                    "Não é possível criar um Plano de Ação: o Estudo de Caso do estudante encontra-se em RASCUNHO e deve ser concluído antes."
            );
        }
    }

    private void validarUsuarioResponsavel(UUID usuarioId) {
        if (usuarioId == null) {
            throw new AuthenticationCredentialsNotFoundException(
                    "Autenticação obrigatória para acessar este recurso."
            );
        }
    }
}
