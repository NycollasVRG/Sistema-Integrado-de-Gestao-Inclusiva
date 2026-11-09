package com.br.CLAI.service;

import com.br.CLAI.domain.Acompanhamento;
import com.br.CLAI.domain.Pei;
import com.br.CLAI.dto.request.PeiRequestDTO;
import com.br.CLAI.dto.request.PeiUpdateDTO;
import com.br.CLAI.dto.response.PeaResponseDTO;
import com.br.CLAI.dto.response.PeiResponseDTO;
import com.br.CLAI.exception.AcessoNegadoException;
import com.br.CLAI.exception.NaoEncontradoException;
import com.br.CLAI.mapper.PeaMapper;
import com.br.CLAI.mapper.PeiMapper;
import com.br.CLAI.repository.AcompanhamentoRepository;
import com.br.CLAI.repository.PeaRepository;
import com.br.CLAI.repository.PeiRepository;
import org.springframework.security.authentication.AuthenticationCredentialsNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class PeiService {

    private static final String PERFIL_PROFESSOR = "Professor";

    private final PeiRepository repository;
    private final AcompanhamentoRepository acompanhamentoRepository;
    private final PeaRepository peaRepository;
    private final PeiMapper mapper;
    private final PeaMapper peaMapper;

    public PeiService(
            PeiRepository repository,
            AcompanhamentoRepository acompanhamentoRepository,
            PeaRepository peaRepository,
            PeiMapper mapper,
            PeaMapper peaMapper) {

        this.repository = repository;
        this.acompanhamentoRepository = acompanhamentoRepository;
        this.peaRepository = peaRepository;
        this.mapper = mapper;
        this.peaMapper = peaMapper;
    }

    @Transactional(readOnly = true)
    public List<PeiResponseDTO> listarTodos() {

        return repository.findAll()
                .stream()
                .map(mapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public PeiResponseDTO buscarPorId(UUID id) {

        return mapper.toResponse(buscarEntidade(id));
    }

    @Transactional(readOnly = true)
    public List<PeiResponseDTO> listarPorAcompanhamento(UUID acompanhamentoId) {

        return repository.findByAcompanhamentoId(acompanhamentoId)
                .stream()
                .map(mapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<PeiResponseDTO> listarPorAluno(UUID alunoId) {

        return repository.findByAcompanhamento_Aluno_Id(alunoId)
                .stream()
                .map(mapper::toResponse)
                .toList();
    }

    /**
     * TA3.2 - Anexos sensíveis do PEI (os PEAs anexados ao plano, conforme o
     * Anexo III). O perfil 'Professor' não pode acessar: retorna HTTP 403.
     */
    @Transactional(readOnly = true)
    public List<PeaResponseDTO> listarAnexosSensiveis(UUID id) {
        return listarAnexosSensiveis(id, null);
    }

    @Transactional(readOnly = true)
    public List<PeaResponseDTO> listarAnexosSensiveis(UUID id, String perfil) {

        if (perfil != null && PERFIL_PROFESSOR.equalsIgnoreCase(perfil.trim())) {
            throw new AcessoNegadoException(
                    "O perfil Professor não tem permissão para acessar os anexos sensíveis do PEI."
            );
        }

        Pei pei = buscarEntidade(id);

        return peaRepository
                .findByAcompanhamentoId(pei.getAcompanhamento().getId())
                .stream()
                .map(peaMapper::toResponse)
                .toList();
    }

    @Transactional
    public PeiResponseDTO criar(PeiRequestDTO dto, UUID usuarioId) {
        validarUsuarioResponsavel(usuarioId);

        Acompanhamento acompanhamento = acompanhamentoRepository
                .findById(dto.acompanhamentoId())
                .orElseThrow(() ->
                        new NaoEncontradoException("Acompanhamento não encontrado."));

        Pei pei = mapper.toEntity(dto, acompanhamento);

        pei.setCriadoPor(usuarioId);
        pei.setAtualizadoPor(usuarioId);

        return mapper.toResponse(repository.save(pei));
    }

    @Transactional
    public PeiResponseDTO atualizar(UUID id, PeiUpdateDTO dto, UUID usuarioId) {
        validarUsuarioResponsavel(usuarioId);

        Pei pei = buscarEntidade(id);

        mapper.updateEntityFromDto(pei, dto);

        pei.setAtualizadoPor(usuarioId);

        return mapper.toResponse(repository.save(pei));
    }

    /**
     * TA3.4 - Soft delete: BaseEntity possui @SoftDelete, então o delete do
     * repositório apenas marca a linha como excluída (deleted = true).
     * O registro permanece fisicamente no banco.
     */
    @Transactional
    public void inativar(UUID id, UUID usuarioId) {
        validarUsuarioResponsavel(usuarioId);

        Pei pei = buscarEntidade(id);

        pei.setAtualizadoPor(usuarioId);
        repository.save(pei);

        repository.delete(pei);
    }

    private void validarUsuarioResponsavel(UUID usuarioId) {
        if (usuarioId == null) {
            throw new AuthenticationCredentialsNotFoundException(
                    "Autenticação obrigatória para acessar este recurso."
            );
        }
    }

    private Pei buscarEntidade(UUID id) {

        return repository.findById(id)
                .orElseThrow(() ->
                        new NaoEncontradoException("PEI não encontrado com o ID fornecido."));
    }
}
