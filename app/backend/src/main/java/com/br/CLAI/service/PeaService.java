package com.br.CLAI.service;

import com.br.CLAI.domain.Acompanhamento;
import com.br.CLAI.domain.Pea;
import com.br.CLAI.dto.request.PeaRequestDTO;
import com.br.CLAI.dto.request.PeaUpdateDTO;
import com.br.CLAI.dto.response.PeaResponseDTO;
import com.br.CLAI.exception.NaoEncontradoException;
import com.br.CLAI.mapper.PeaMapper;
import com.br.CLAI.repository.AcompanhamentoRepository;
import com.br.CLAI.repository.PeaRepository;
import org.springframework.security.authentication.AuthenticationCredentialsNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class PeaService {

    private final PeaRepository repository;
    private final AcompanhamentoRepository acompanhamentoRepository;
    private final PeaMapper mapper;

    public PeaService(
            PeaRepository repository,
            AcompanhamentoRepository acompanhamentoRepository,
            PeaMapper mapper) {

        this.repository = repository;
        this.acompanhamentoRepository = acompanhamentoRepository;
        this.mapper = mapper;
    }

    @Transactional(readOnly = true)
    public List<PeaResponseDTO> listarTodos() {

        return repository.findAll()
                .stream()
                .map(mapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public PeaResponseDTO buscarPorId(UUID id) {

        Pea pea = repository.findById(id)
                .orElseThrow(() ->
                        new NaoEncontradoException(
                                "PEA não encontrado com o ID fornecido."
                        ));

        return mapper.toResponse(pea);
    }

    @Transactional(readOnly = true)
    public List<PeaResponseDTO> listarPorAcompanhamento(
            UUID acompanhamentoId) {

        return repository
                .findByAcompanhamentoId(acompanhamentoId)
                .stream()
                .map(mapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<PeaResponseDTO> listarPorAluno(UUID alunoId) {

        return repository
                .findByAcompanhamento_Aluno_Id(alunoId)
                .stream()
                .map(mapper::toResponse)
                .toList();
    }

    @Transactional
    public PeaResponseDTO criar(
            PeaRequestDTO dto,
            UUID usuarioId) {

        validarUsuarioResponsavel(usuarioId);

        Acompanhamento acompanhamento =
                acompanhamentoRepository
                        .findById(dto.acompanhamentoId())
                        .orElseThrow(() ->
                                new NaoEncontradoException(
                                        "Acompanhamento não encontrado."
                                ));

        Pea pea = mapper.toEntity(
                dto,
                acompanhamento
        );

        pea.setCriadoPor(usuarioId);
        pea.setAtualizadoPor(usuarioId);

        Pea salvo = repository.save(pea);

        return mapper.toResponse(salvo);
    }

    @Transactional
    public PeaResponseDTO atualizar(
            UUID id,
            PeaUpdateDTO dto,
            UUID usuarioId) {

        validarUsuarioResponsavel(usuarioId);

        Pea pea = repository.findById(id)
                .orElseThrow(() ->
                        new NaoEncontradoException(
                                "PEA não encontrado com o ID fornecido."
                        ));

        mapper.updateEntityFromDto(pea, dto);

        pea.setAtualizadoPor(usuarioId);

        Pea salvo = repository.save(pea);

        return mapper.toResponse(salvo);
    }

    @Transactional
    public void excluir(
            UUID id,
            UUID usuarioId) {

        validarUsuarioResponsavel(usuarioId);

        Pea pea = repository.findById(id)
                .orElseThrow(() ->
                        new NaoEncontradoException(
                                "PEA não encontrado com o ID fornecido."
                        ));

        pea.setAtualizadoPor(usuarioId);

        repository.save(pea);

        // TA3.4 - Soft Delete:
        // BaseEntity possui @SoftDelete.
        // O registro permanece fisicamente no banco.
        repository.delete(pea);
    }

    private void validarUsuarioResponsavel(UUID usuarioId) {
        if (usuarioId == null) {
            throw new AuthenticationCredentialsNotFoundException(
                    "Autenticação obrigatória para acessar este recurso."
            );
        }
    }
}
