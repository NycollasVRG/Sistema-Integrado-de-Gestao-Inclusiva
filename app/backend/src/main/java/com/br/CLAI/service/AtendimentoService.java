package com.br.CLAI.service;

import com.br.CLAI.domain.Aluno;
import com.br.CLAI.domain.Atendimento;
import com.br.CLAI.dto.request.AtendimentoRequestDTO;
import com.br.CLAI.dto.request.AtendimentoUpdateDTO;
import com.br.CLAI.dto.response.AtendimentoResponseDTO;
import com.br.CLAI.exception.AcessoNegadoException;
import com.br.CLAI.exception.NaoEncontradoException;
import com.br.CLAI.mapper.AtendimentoMapper;
import com.br.CLAI.repository.AlunoRepository;
import com.br.CLAI.repository.AtendimentoRepository;
import org.springframework.security.authentication.AuthenticationCredentialsNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class AtendimentoService {

    /** Janela, contada a partir de {@code criadoEm}, em que o autor ainda pode editar o relato. */
    public static final Duration JANELA_EDICAO = Duration.ofHours(24);

    private static final String MSG_NAO_ENCONTRADO = "Atendimento não encontrado com o ID fornecido.";
    private static final String MSG_NAO_AUTOR =
            "Somente o autor do atendimento pode editar o relatório.";
    private static final String MSG_PRAZO_EXPIRADO =
            "O prazo de 24 horas para edição do relatório deste atendimento foi encerrado.";

    private final AtendimentoRepository repository;
    private final AlunoRepository alunoRepository;
    private final AtendimentoMapper mapper;
    private final Clock clock;

    public AtendimentoService(
            AtendimentoRepository repository,
            AlunoRepository alunoRepository,
            AtendimentoMapper mapper,
            Clock clock) {
        this.repository = repository;
        this.alunoRepository = alunoRepository;
        this.mapper = mapper;
        this.clock = clock;
    }

    @Transactional
    public AtendimentoResponseDTO criar(AtendimentoRequestDTO dto, UUID usuarioId) {
        validarUsuarioResponsavel(usuarioId);

        Aluno aluno = alunoRepository.findById(dto.alunoId())
                .orElseThrow(() -> new NaoEncontradoException("Estudante não encontrado."));

        Atendimento atendimento = mapper.toEntity(dto, aluno);
        atendimento.setCriadoPor(usuarioId);
        atendimento.setAtualizadoPor(usuarioId);

        return mapper.toResponse(repository.save(atendimento), JANELA_EDICAO);
    }

    @Transactional(readOnly = true)
    public AtendimentoResponseDTO buscarPorId(UUID id) {
        Atendimento atendimento = repository.findById(id)
                .orElseThrow(() -> new NaoEncontradoException(MSG_NAO_ENCONTRADO));
        return mapper.toResponse(atendimento, JANELA_EDICAO);
    }

    @Transactional(readOnly = true)
    public List<AtendimentoResponseDTO> listarPorAluno(UUID alunoId) {
        return OrdenacaoAuditoria.ordenarPorCriacaoDesc(repository.findByAlunoId(alunoId))
                .stream()
                .map(a -> mapper.toResponse(a, JANELA_EDICAO))
                .toList();
    }

    /**
     * Edita o relatório. Regra de negócio (trava de 24h): apenas o autor
     * ({@code criadoPor == usuário autenticado}) e somente até {@code criadoEm + 24h}.
     * Qualquer violação resulta em {@link AcessoNegadoException} (HTTP 403).
     */
    @Transactional
    public AtendimentoResponseDTO atualizar(UUID id, AtendimentoUpdateDTO dto, UUID usuarioId) {
        validarUsuarioResponsavel(usuarioId);

        Atendimento atendimento = repository.findById(id)
                .orElseThrow(() -> new NaoEncontradoException(MSG_NAO_ENCONTRADO));

        validarEdicaoPermitida(atendimento, usuarioId);

        mapper.updateEntityFromDto(atendimento, dto);
        atendimento.setAtualizadoPor(usuarioId);

        return mapper.toResponse(repository.save(atendimento), JANELA_EDICAO);
    }

    private void validarEdicaoPermitida(Atendimento atendimento, UUID usuarioId) {
        // Autoria primeiro: quem não é o autor não deve obter nenhuma pista sobre o estado do prazo.
        if (atendimento.getCriadoPor() == null || !atendimento.getCriadoPor().equals(usuarioId)) {
            throw new AcessoNegadoException(MSG_NAO_AUTOR);
        }

        LocalDateTime criadoEm = atendimento.getCriadoEm();
        // Sem marco temporal não há como provar que a janela está aberta: nega (fail closed).
        if (criadoEm == null) {
            throw new AcessoNegadoException(MSG_PRAZO_EXPIRADO);
        }

        LocalDateTime limite = criadoEm.plus(JANELA_EDICAO);
        if (LocalDateTime.now(clock).isAfter(limite)) {
            throw new AcessoNegadoException(MSG_PRAZO_EXPIRADO);
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
