package com.br.CLAI.service;

import com.br.CLAI.domain.Aluno;
import com.br.CLAI.domain.IndicadorReutilizavel;
import com.br.CLAI.domain.enums.StatusAluno;
import com.br.CLAI.dto.request.AlunoRequestDTO;
import com.br.CLAI.dto.response.AlunoResponseDTO;
import com.br.CLAI.exception.ConflitoException;
import com.br.CLAI.exception.NaoEncontradoException;
import com.br.CLAI.exception.RegraDeNegocioException;
import com.br.CLAI.mapper.AlunoMapper;
import com.br.CLAI.repository.AlunoRepository;
import com.br.CLAI.repository.IndicadorReutilizavelRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
public class AlunoService {

    private static final String MSG_MATRICULA_DUPLICADA = "Já existe um aluno cadastrado com a matrícula informada.";

    private final AlunoRepository alunoRepository;
    private final IndicadorReutilizavelRepository tagRepository;
    private final AlunoMapper mapper;

    public AlunoService(AlunoRepository alunoRepository,
                            IndicadorReutilizavelRepository tagRepository,
                            AlunoMapper mapper) {
        this.alunoRepository = alunoRepository;
        this.tagRepository = tagRepository;
        this.mapper = mapper;
    }

    @Transactional
    public AlunoResponseDTO criar(AlunoRequestDTO dto, UUID usuarioId) {
        String matricula = dto.matricula().trim();
        if (alunoRepository.existsByMatricula(matricula)) {
            throw new ConflitoException(MSG_MATRICULA_DUPLICADA);
        }

        Aluno aluno = new Aluno();
        aplicarDados(aluno, dto, matricula);
        aluno.setCriadoPor(usuarioId);
        aluno.setAtualizadoPor(usuarioId);

        return mapper.toResponse(salvar(aluno));
    }

    @Transactional(readOnly = true)
    public AlunoResponseDTO buscarPorId(UUID id) {
        return mapper.toResponse(buscarEntidade(id));
    }

    @Transactional(readOnly = true)
    public Page<AlunoResponseDTO> listar(String termo, String curso, String turma, String tag,
                                         Boolean ativo, Pageable pageable) {
        return alunoRepository.buscarComFiltros(
                normalizar(termo), normalizar(curso), normalizar(turma), normalizar(tag),
                ativo != null ? ativo : Boolean.TRUE, pageable
        ).map(mapper::toResponse);
    }

    private String normalizar(String valor) {
        return valor == null ? "" : valor.trim().toLowerCase();
    }

    @Transactional
    public AlunoResponseDTO atualizar(UUID id, AlunoRequestDTO dto, UUID usuarioId) {
        Aluno aluno = buscarEntidade(id);

        String matricula = dto.matricula().trim();
        if (alunoRepository.existsByMatriculaAndIdNot(matricula, id)) {
            throw new ConflitoException(MSG_MATRICULA_DUPLICADA);
        }

        aplicarDados(aluno, dto, matricula);
        aluno.setAtualizadoPor(usuarioId);
        // Garante a auditoria mesmo quando só a coleção de tags muda (a entidade pode não ficar "suja").
        aluno.setAtualizadoEm(LocalDateTime.now());

        return mapper.toResponse(salvar(aluno));
    }

    /**
     * Soft delete de negócio: ativo = false e status INATIVO (padrão) ou EVADIDO.
     * Não chama repository.delete(): o @SoftDelete do Hibernate esconderia o aluno das consultas e
     * quebraria o acesso aos Estudos de Caso, PEIs e PEAs vinculados.
     */
    @Transactional
    public void inativar(UUID id, StatusAluno novoStatus, UUID usuarioId) {
        StatusAluno status = novoStatus != null ? novoStatus : StatusAluno.INATIVO;
        if (!status.isEncerrado()) {
            throw new RegraDeNegocioException("A inativação só aceita os status INATIVO ou EVADIDO.");
        }

        Aluno aluno = buscarEntidade(id);
        aluno.setStatus(status);
        aluno.setAtivo(Boolean.FALSE);
        aluno.setAtualizadoPor(usuarioId);
        aluno.setAtualizadoEm(LocalDateTime.now());
        salvar(aluno);
    }

    private Aluno buscarEntidade(UUID id) {
        return alunoRepository.findById(id)
                .orElseThrow(() -> new NaoEncontradoException("Aluno não encontrado com o ID fornecido."));
    }

    private void aplicarDados(Aluno aluno, AlunoRequestDTO dto, String matricula) {
        aluno.setNomeCompleto(dto.nomeCompleto().trim());
        aluno.setMatricula(matricula);
        aluno.setCurso(dto.curso().trim());
        aluno.setTurma(dto.turma().trim());
        aluno.setStatus(dto.status());
        // Invariante: ativo acompanha o status (INATIVO/EVADIDO => false).
        aluno.setAtivo(!dto.status().isEncerrado());
        aluno.setTagsDificuldade(new LinkedHashSet<>(buscarTags(dto.tagsDificuldadeIds())));
    }

    private List<IndicadorReutilizavel> buscarTags(List<UUID> ids) {
        Set<UUID> idsUnicos = new LinkedHashSet<>(ids);
        List<IndicadorReutilizavel> tags = tagRepository.findAllById(idsUnicos);
        if (tags.size() != idsUnicos.size()) {
            throw new RegraDeNegocioException("Uma ou mais tags de dificuldade informadas não foram encontradas.");
        }
        return tags;
    }

    /** saveAndFlush força a violação do UNIQUE aqui dentro, cobrindo a corrida entre duas requisições. */
    private Aluno salvar(Aluno aluno) {
        try {
            return alunoRepository.saveAndFlush(aluno);
        } catch (DataIntegrityViolationException e) {
            throw new ConflitoException(MSG_MATRICULA_DUPLICADA);
        }
    }
}
