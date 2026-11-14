package com.br.CLAI.service;

import com.br.CLAI.domain.Aluno;
import com.br.CLAI.domain.EstudoDeCaso;
import com.br.CLAI.domain.IndicadorReutilizavel;
import com.br.CLAI.domain.enums.StatusEstudoCaso;
import com.br.CLAI.dto.request.EstudoDeCasoRequestDTO;
import com.br.CLAI.dto.request.EstudoDeCasoUpdateDTO;
import com.br.CLAI.dto.response.EstudoDeCasoResponseDTO;
import com.br.CLAI.exception.NaoEncontradoException;
import com.br.CLAI.exception.RegraDeNegocioException;
import com.br.CLAI.mapper.EstudoDeCasoMapper;
import com.br.CLAI.repository.AlunoRepository;
import com.br.CLAI.repository.EstudoDeCasoRepository;
import com.br.CLAI.repository.IndicadorReutilizavelRepository;
import com.br.CLAI.service.validator.EstudoDeCasoValidator;
import org.springframework.security.authentication.AuthenticationCredentialsNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;
import java.util.UUID;

@Service
public class EstudoDeCasoService {

    private final EstudoDeCasoRepository repository;
    private final AlunoRepository alunoRepository;
    private final IndicadorReutilizavelRepository indicadorRepository;
    private final EstudoDeCasoValidator validator;
    private final EstudoDeCasoMapper mapper;

    public EstudoDeCasoService(EstudoDeCasoRepository repository, 
                               AlunoRepository alunoRepository,
                               IndicadorReutilizavelRepository indicadorRepository,
                               EstudoDeCasoValidator validator, 
                               EstudoDeCasoMapper mapper) {
        this.repository = repository;
        this.alunoRepository = alunoRepository;
        this.indicadorRepository = indicadorRepository;
        this.validator = validator;
        this.mapper = mapper;
    }

    @Transactional
    public EstudoDeCasoResponseDTO criar(EstudoDeCasoRequestDTO dto, UUID usuarioId) {
        validarUsuarioResponsavel(usuarioId);

        // Validação TA2.3
        validator.validarConclusao(dto);

        Aluno aluno = alunoRepository.findById(dto.alunoId())
                .orElseThrow(() -> new RegraDeNegocioException("Aluno não encontrado."));

        List<IndicadorReutilizavel> indicadores = buscarEValidarIndicadores(dto.indicadoresIds());
        List<EstudoDeCaso> estudosExistentes = repository.findByAlunoId(dto.alunoId());

        // Utilizando o toEntity do Mapper
        EstudoDeCaso entidade = mapper.toEntity(dto, aluno, indicadores);
        aplicarVersionamentoEEncerrarAtivoAnterior(entidade, estudosExistentes, usuarioId);
        entidade.setCriadoPor(usuarioId);
        entidade.setAtualizadoPor(usuarioId);

        EstudoDeCaso salvo = repository.save(entidade);
        return mapper.toResponse(salvo);
    }

    private void aplicarVersionamentoEEncerrarAtivoAnterior(
            EstudoDeCaso novoEstudo,
            List<EstudoDeCaso> estudosExistentes,
            UUID usuarioId) {

        if (estudosExistentes == null || estudosExistentes.isEmpty()) {
            novoEstudo.setVersao(1);
            novoEstudo.setEstudoOrigem(null);
            return;
        }

        // TA2.4: Garante apenas 1 Estudo ATIVO simultâneo por aluno encerrando o ativo anterior
        for (EstudoDeCaso existente : estudosExistentes) {
            if (StatusEstudoCaso.ATIVO.equals(existente.getStatus())) {
                existente.setStatus(StatusEstudoCaso.ENCERRADO);
                existente.setAtualizadoEm(LocalDateTime.now());
                existente.setAtualizadoPor(usuarioId);
                repository.saveAndFlush(existente);
            }
        }

        int maiorVersao = estudosExistentes.stream()
                .map(EstudoDeCaso::getVersao)
                .filter(Objects::nonNull)
                .mapToInt(Integer::intValue)
                .max()
                .orElse(1);

        novoEstudo.setVersao(Math.max(maiorVersao, 1) + 1);
        novoEstudo.setEstudoOrigem(resolverEstudoOrigem(estudosExistentes));
    }

    private EstudoDeCaso resolverEstudoOrigem(List<EstudoDeCaso> estudosExistentes) {
        EstudoDeCaso candidato = estudosExistentes.stream()
                .min(Comparator
                        .comparing((EstudoDeCaso e) -> e.getEstudoOrigem() == null ? 0 : 1)
                        .thenComparingInt(e -> e.getVersao() != null ? e.getVersao() : Integer.MAX_VALUE)
                        .thenComparing(EstudoDeCaso::getCriadoEm, Comparator.nullsLast(Comparator.naturalOrder()))
                        .thenComparing(EstudoDeCaso::getId, Comparator.nullsLast(Comparator.naturalOrder())))
                .orElse(null);

        if (candidato == null) {
            return null;
        }
        return candidato.getEstudoOrigem() != null ? candidato.getEstudoOrigem() : candidato;
    }

    @Transactional(readOnly = true)
    public EstudoDeCasoResponseDTO buscarPorId(UUID id) {
        EstudoDeCaso estudo = repository.findById(id)
                .orElseThrow(() -> new NaoEncontradoException("Estudo de Caso não encontrado com o ID fornecido."));
        return mapper.toResponse(estudo);
    }

    @Transactional(readOnly = true)
    public List<EstudoDeCasoResponseDTO> listarPorAluno(UUID alunoId) {
        if (!alunoRepository.existsById(alunoId)) {
            throw new NaoEncontradoException("Aluno não encontrado com o ID fornecido.");
        }
        List<EstudoDeCaso> estudos = OrdenacaoAuditoria.ordenarEstudosPorVigencia(repository.findByAlunoId(alunoId));
        return estudos.stream()
                .map(mapper::toResponse)
                .toList();
    }

    @Transactional
    public EstudoDeCasoResponseDTO atualizar(UUID id, EstudoDeCasoUpdateDTO dto, UUID usuarioId) {
        validarUsuarioResponsavel(usuarioId);

        EstudoDeCaso estudo = repository.findById(id)
                .orElseThrow(() -> new NaoEncontradoException("Estudo de Caso não encontrado com o ID fornecido."));

        // Regra de Proteção: estudo concluído (ENCERRADO/ATIVO) não pode voltar para RASCUNHO (ref. TA2.1)
        if ((StatusEstudoCaso.ENCERRADO.equals(estudo.getStatus())
                || StatusEstudoCaso.ATIVO.equals(estudo.getStatus()))
                && StatusEstudoCaso.RASCUNHO.equals(dto.status())) {
            throw new RegraDeNegocioException("Não é permitido reverter um Estudo de Caso concluído para Rascunho.");
        }

        // Validação TA2.3
        validator.validarConclusao(dto);

        // Validação TA2.4: Se estiver alterando para ATIVO, bloqueia se já existir outro ativo para o mesmo aluno
        if (StatusEstudoCaso.ATIVO.equals(dto.status()) 
                && repository.existsByAlunoIdAndStatusAndIdNot(estudo.getAluno().getId(), StatusEstudoCaso.ATIVO, id)) {
            throw new RegraDeNegocioException("Já existe outro Estudo de Caso ATIVO para este aluno.");
        }

        List<IndicadorReutilizavel> novosIndicadores = null;
        if (dto.indicadoresIds() != null) {
            novosIndicadores = buscarEValidarIndicadores(dto.indicadoresIds());
        }

        // Utilizando o Mapper para atualizar o estado da entidade
        mapper.updateEntityFromDto(estudo, dto, novosIndicadores);

        // TA2.2: Rastrear usuário que realizou a atualização
        estudo.setAtualizadoPor(usuarioId);

        EstudoDeCaso salvo = repository.save(estudo);
        return mapper.toResponse(salvo);
    }

    @Transactional
    public EstudoDeCasoResponseDTO reabrir(UUID id, UUID usuarioId) {
        validarUsuarioResponsavel(usuarioId);

        EstudoDeCaso estudo = repository.findById(id)
                .orElseThrow(() -> new NaoEncontradoException("Estudo de Caso não encontrado com o ID fornecido."));

        if (StatusEstudoCaso.RASCUNHO.equals(estudo.getStatus())) {
            throw new RegraDeNegocioException("O Estudo de Caso já se encontra em status de Rascunho.");
        }

        estudo.setStatus(StatusEstudoCaso.RASCUNHO);
        estudo.setAtualizadoEm(java.time.LocalDateTime.now());
        estudo.setAtualizadoPor(usuarioId);

        EstudoDeCaso salvo = repository.save(estudo);
        return mapper.toResponse(salvo);
    }

    @Transactional
    public void excluir(UUID id, UUID usuarioId) {
        validarUsuarioResponsavel(usuarioId);

        EstudoDeCaso estudo = repository.findById(id)
                .orElseThrow(() -> new NaoEncontradoException("Estudo de Caso não encontrado com o ID fornecido."));

        // Regra de Proteção: Não permite exclusão de estudos concluídos (ENCERRADO ou ATIVO, ref. TA2.1)
        if (StatusEstudoCaso.ENCERRADO.equals(estudo.getStatus())
                || StatusEstudoCaso.ATIVO.equals(estudo.getStatus())) {
            throw new RegraDeNegocioException("Não é permitido excluir um Estudo de Caso já concluído.");
        }

        // Rastreia quem executou a exclusão antes do soft delete
        estudo.setAtualizadoPor(usuarioId);
        repository.save(estudo);

        // Hibernate SoftDelete intercepta e faz UPDATE set deleted = true
        repository.delete(estudo);
    }

    private void validarUsuarioResponsavel(UUID usuarioId) {
        if (usuarioId == null) {
            throw new AuthenticationCredentialsNotFoundException(
                    "Autenticação obrigatória para acessar este recurso."
            );
        }
    }

    private List<IndicadorReutilizavel> buscarEValidarIndicadores(List<UUID> indicadoresIds) {
        if (indicadoresIds == null || indicadoresIds.isEmpty()) {
            return java.util.Collections.emptyList();
        }

        List<IndicadorReutilizavel> indicadores = indicadorRepository.findAllById(indicadoresIds);
        if (indicadores.size() != indicadoresIds.size()) {
            throw new RegraDeNegocioException("Um ou mais Indicadores informados não foram encontrados.");
        }
        return indicadores;
    }
}
