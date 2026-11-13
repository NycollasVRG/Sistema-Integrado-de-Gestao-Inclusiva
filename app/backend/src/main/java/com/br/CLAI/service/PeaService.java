package com.br.CLAI.service;

import com.br.CLAI.domain.Acompanhamento;
import com.br.CLAI.domain.Pea;
import com.br.CLAI.domain.Pei;
import com.br.CLAI.dto.request.PeaRequestDTO;
import com.br.CLAI.dto.request.PeaUpdateDTO;
import com.br.CLAI.dto.response.PeaResponseDTO;
import com.br.CLAI.exception.NaoEncontradoException;
import com.br.CLAI.mapper.PeaMapper;
import com.br.CLAI.repository.AcompanhamentoRepository;
import com.br.CLAI.repository.PeaRepository;
import com.br.CLAI.repository.PeiRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationCredentialsNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class PeaService {

    private final PeaRepository repository;
    private final AcompanhamentoRepository acompanhamentoRepository;
    private final PeiRepository peiRepository;
    private final PeaMapper mapper;

    public PeaService(
            PeaRepository repository,
            AcompanhamentoRepository acompanhamentoRepository,
            PeaMapper mapper) {
        this(repository, acompanhamentoRepository, null, mapper);
    }

    @Autowired
    public PeaService(
            PeaRepository repository,
            AcompanhamentoRepository acompanhamentoRepository,
            PeiRepository peiRepository,
            PeaMapper mapper) {

        this.repository = repository;
        this.acompanhamentoRepository = acompanhamentoRepository;
        this.peiRepository = peiRepository;
        this.mapper = mapper;
    }

    @Transactional(readOnly = true)
    public List<PeaResponseDTO> listarTodos() {

        return OrdenacaoAuditoria.ordenarPorCriacaoDesc(repository.findAll())
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

        return OrdenacaoAuditoria.ordenarPorCriacaoDesc(
                        repository.findByAcompanhamentoId(acompanhamentoId)
                )
                .stream()
                .map(mapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<PeaResponseDTO> listarPorAluno(UUID alunoId) {

        return OrdenacaoAuditoria.ordenarPorCriacaoDesc(
                        repository.findByAcompanhamento_Aluno_Id(alunoId)
                )
                .stream()
                .map(mapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<PeaResponseDTO> listarPorPei(UUID peiId) {
        Map<UUID, Pea> consolidados = new LinkedHashMap<>();

        for (Pea p : repository.findByPeiId(peiId)) {
            if (p.getId() != null) {
                consolidados.put(p.getId(), p);
            }
        }

        if (peiRepository != null) {
            peiRepository.findById(peiId).ifPresent(pei -> {
                if (pei.getAcompanhamento() != null && pei.getAcompanhamento().getId() != null) {
                    List<Pea> doAcompanhamento = repository.findByAcompanhamentoId(pei.getAcompanhamento().getId());
                    for (Pea p : doAcompanhamento) {
                        if (p.getId() != null && (p.getPei() == null || peiId.equals(p.getPei().getId()))) {
                            consolidados.putIfAbsent(p.getId(), p);
                        }
                    }
                }
            });
        }

        return OrdenacaoAuditoria.ordenarPorCriacaoDesc(List.copyOf(consolidados.values()))
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

        Pei peiVinculado = resolverPeiVinculado(dto.peiId(), acompanhamento.getId());

        Pea pea = mapper.toEntity(
                dto,
                acompanhamento,
                peiVinculado
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

        if (dto.peiId() != null && peiRepository != null) {
            Pei pei = peiRepository.findById(dto.peiId())
                    .orElseThrow(() -> new NaoEncontradoException("PEI não encontrado com o ID fornecido."));
            pea.setPei(pei);
        }

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

    private Pei resolverPeiVinculado(UUID peiIdExplicito, UUID acompanhamentoId) {
        if (peiRepository == null) {
            return null;
        }
        if (peiIdExplicito != null) {
            return peiRepository.findById(peiIdExplicito)
                    .orElseThrow(() -> new NaoEncontradoException("PEI não encontrado com o ID fornecido."));
        }
        if (acompanhamentoId != null) {
            List<Pei> peis = OrdenacaoAuditoria.ordenarPorAtualizacaoDesc(
                    peiRepository.findByAcompanhamentoId(acompanhamentoId)
            );
            if (!peis.isEmpty()) {
                return peis.getFirst();
            }
        }
        return null;
    }

    private void validarUsuarioResponsavel(UUID usuarioId) {
        if (usuarioId == null) {
            throw new AuthenticationCredentialsNotFoundException(
                    "Autenticação obrigatória para acessar este recurso."
            );
        }
    }
}

