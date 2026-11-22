package com.br.CLAI.service;

import com.br.CLAI.domain.Aluno;
import com.br.CLAI.domain.EstudoDeCaso;
import com.br.CLAI.domain.Indicacao;
import com.br.CLAI.domain.Usuario;
import com.br.CLAI.domain.enums.Role;
import com.br.CLAI.domain.enums.StatusAluno;
import com.br.CLAI.domain.enums.StatusIndicacao;
import com.br.CLAI.dto.request.AprovacaoIndicacaoRequestDTO;
import com.br.CLAI.dto.request.IndicacaoRequestDTO;
import com.br.CLAI.dto.request.RejeicaoIndicacaoRequestDTO;
import com.br.CLAI.dto.response.IndicacaoResponseDTO;
import com.br.CLAI.exception.NaoEncontradoException;
import com.br.CLAI.exception.RegraDeNegocioException;
import com.br.CLAI.mapper.IndicacaoMapper;
import com.br.CLAI.repository.AlunoRepository;
import com.br.CLAI.repository.IndicacaoRepository;
import com.br.CLAI.repository.UsuarioRepository;
import org.springframework.security.authentication.AuthenticationCredentialsNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDateTime;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

/**
 * Regras de negócio da US 10 — Gestão de Indicações e Demanda Espontânea.
 * Controla o registro de indicações pedagógicas (TA10.1), a transição do estudante
 * para {@link StatusAluno#EM_TRIAGEM} com notificação automática à equipe CLAI (TA10.2),
 * e o fluxo decisório de aprovação (início do Estudo de Caso) ou rejeição documentada (TA10.3).
 */
@Service
public class IndicacaoService {

    /** Perfis da equipe CLAI notificados automaticamente a cada nova indicação (TA10.2). */
    public static final List<String> PERFIS_NOTIFICADOS_CLAI = List.of(
            Role.CLAI_PSICOPEDAGOGO.name(),
            Role.COORDENADOR.name()
    );

    private static final String MSG_INDICACAO_NAO_ENCONTRADA = "Indicação não encontrada com o ID fornecido.";

    private final IndicacaoRepository indicacaoRepository;
    private final AlunoRepository alunoRepository;
    private final UsuarioRepository usuarioRepository;
    private final NotificacaoService notificacaoService;
    private final EstudoDeCasoService estudoDeCasoService;
    private final IndicacaoMapper mapper;
    private final Clock clock;

    public IndicacaoService(IndicacaoRepository indicacaoRepository,
                            AlunoRepository alunoRepository,
                            UsuarioRepository usuarioRepository,
                            NotificacaoService notificacaoService,
                            EstudoDeCasoService estudoDeCasoService,
                            IndicacaoMapper mapper,
                            Clock clock) {
        this.indicacaoRepository = indicacaoRepository;
        this.alunoRepository = alunoRepository;
        this.usuarioRepository = usuarioRepository;
        this.notificacaoService = notificacaoService;
        this.estudoDeCasoService = estudoDeCasoService;
        this.mapper = mapper;
        this.clock = clock;
    }

    /**
     * Registra uma indicação de demanda espontânea (TA10.1 / TA10.2), altera o status
     * do estudante para {@link StatusAluno#EM_TRIAGEM} e notifica {@code CLAI_PSICOPEDAGOGO}
     * e {@code COORDENADOR}.
     */
    @Transactional
    public IndicacaoResponseDTO criar(IndicacaoRequestDTO dto, UUID solicitanteId) {
        validarUsuarioResponsavel(solicitanteId);
        if (dto == null) {
            throw new RegraDeNegocioException("Os dados da indicação são obrigatórios.");
        }
        if (dto.alunoId() == null) {
            throw new RegraDeNegocioException("O ID do estudante é obrigatório.");
        }

        String justificativa = validarTextoObrigatorio(
                dto.justificativaPedagogica(),
                "A justificativa pedagógica é obrigatória."
        );
        Set<String> disciplinas = normalizarEValidarDisciplinas(dto.disciplinasObservadas());

        Usuario solicitante = usuarioRepository.findById(solicitanteId)
                .orElseThrow(() -> new NaoEncontradoException("Solicitante não encontrado com o ID fornecido."));

        Aluno aluno = alunoRepository.findById(dto.alunoId())
                .orElseThrow(() -> new NaoEncontradoException("Estudante não encontrado com o ID fornecido."));

        StatusAluno statusAtual = aluno.getStatus() != null ? aluno.getStatus() : StatusAluno.ATIVO;
        if (statusAtual.isEncerrado() || !Boolean.TRUE.equals(aluno.getAtivo())) {
            throw new RegraDeNegocioException(
                    "Não é possível registrar indicação para estudante inativo ou evadido."
            );
        }

        LocalDateTime agora = LocalDateTime.now(clock);

        // TA10.2: transição sistêmica imediata para EM_TRIAGEM
        aluno.setStatus(StatusAluno.EM_TRIAGEM);
        aluno.setAtualizadoPor(solicitanteId);
        aluno.setAtualizadoEm(agora);
        alunoRepository.save(aluno);

        Indicacao indicacao = new Indicacao(aluno, solicitante, justificativa, disciplinas, statusAtual);
        indicacao.setCriadoPor(solicitanteId);
        indicacao.setAtualizadoPor(solicitanteId);

        Indicacao salva = indicacaoRepository.save(indicacao);

        notificarEquipeClai(salva, aluno, solicitante, disciplinas);

        return mapper.toResponse(salva);
    }

    /**
     * Aprova uma indicação pendente (TA10.3), restaura o estudante para {@link StatusAluno#ATIVO}
     * e inicia automaticamente um Estudo de Caso em {@code RASCUNHO} vinculado à indicação.
     */
    @Transactional
    public IndicacaoResponseDTO aprovar(UUID id, AprovacaoIndicacaoRequestDTO dto, UUID decisorId) {
        validarUsuarioResponsavel(decisorId);

        Indicacao indicacao = buscarEntidadeDetalhada(id);
        validarIndicacaoPendente(indicacao, "aprovar");

        LocalDateTime agora = LocalDateTime.now(clock);
        String justificativaOpcional = dto != null ? normalizarOpcional(dto.justificativaDecisao()) : null;

        Aluno aluno = indicacao.getAluno();
        aluno.setStatus(StatusAluno.ATIVO);
        aluno.setAtivo(Boolean.TRUE);
        aluno.setAtualizadoPor(decisorId);
        aluno.setAtualizadoEm(agora);
        alunoRepository.save(aluno);

        EstudoDeCaso estudoIniciado = estudoDeCasoService.iniciarRascunhoPorIndicacao(
                aluno,
                construirDiagnosticoInicialEstudo(indicacao),
                decisorId
        );

        indicacao.setStatus(StatusIndicacao.APROVADA);
        indicacao.setJustificativaDecisao(justificativaOpcional);
        indicacao.setDecididoPor(decisorId);
        indicacao.setDecididoEm(agora);
        indicacao.setEstudoDeCaso(estudoIniciado);
        indicacao.setAtualizadoPor(decisorId);
        indicacao.setAtualizadoEm(agora);

        Indicacao salva = indicacaoRepository.save(indicacao);
        return mapper.toResponse(salva);
    }

    /**
     * Rejeita uma indicação pendente exigindo justificativa documentada (TA10.3).
     * Restaura o status anterior do estudante caso não existam outras indicações pendentes.
     */
    @Transactional
    public IndicacaoResponseDTO rejeitar(UUID id, RejeicaoIndicacaoRequestDTO dto, UUID decisorId) {
        validarUsuarioResponsavel(decisorId);

        String justificativaDecisao = validarTextoObrigatorio(
                dto != null ? dto.justificativaDecisao() : null,
                "A justificativa documentada é obrigatória para rejeitar uma indicação."
        );

        Indicacao indicacao = buscarEntidadeDetalhada(id);
        validarIndicacaoPendente(indicacao, "rejeitar");

        LocalDateTime agora = LocalDateTime.now(clock);

        indicacao.setStatus(StatusIndicacao.REJEITADA);
        indicacao.setJustificativaDecisao(justificativaDecisao);
        indicacao.setDecididoPor(decisorId);
        indicacao.setDecididoEm(agora);
        indicacao.setAtualizadoPor(decisorId);
        indicacao.setAtualizadoEm(agora);

        Aluno aluno = indicacao.getAluno();
        boolean possuiOutraPendente = indicacaoRepository.existsByAlunoIdAndStatusAndIdNot(
                aluno.getId(), StatusIndicacao.PENDENTE, indicacao.getId());

        if (!possuiOutraPendente && StatusAluno.EM_TRIAGEM.equals(aluno.getStatus())) {
            aluno.setStatus(resolverStatusRestaurado(indicacao.getStatusAlunoAnterior()));
            aluno.setAtualizadoPor(decisorId);
            aluno.setAtualizadoEm(agora);
            alunoRepository.save(aluno);
        }

        Indicacao salva = indicacaoRepository.save(indicacao);
        return mapper.toResponse(salva);
    }

    @Transactional(readOnly = true)
    public IndicacaoResponseDTO buscarPorId(UUID id) {
        return mapper.toResponse(buscarEntidadeDetalhada(id));
    }

    @Transactional(readOnly = true)
    public List<IndicacaoResponseDTO> listar(StatusIndicacao status) {
        List<Indicacao> indicacoes = status != null
                ? indicacaoRepository.findByStatusOrderByCriadoEmDesc(status)
                : indicacaoRepository.findAllByOrderByCriadoEmDesc();
        return indicacoes.stream().map(mapper::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<IndicacaoResponseDTO> listarPorAluno(UUID alunoId) {
        if (!alunoRepository.existsById(alunoId)) {
            throw new NaoEncontradoException("Estudante não encontrado com o ID fornecido.");
        }
        return indicacaoRepository.findByAlunoIdOrderByCriadoEmDesc(alunoId)
                .stream()
                .map(mapper::toResponse)
                .toList();
    }

    private Indicacao buscarEntidadeDetalhada(UUID id) {
        return indicacaoRepository.findDetalhadaById(id)
                .orElseThrow(() -> new NaoEncontradoException(MSG_INDICACAO_NAO_ENCONTRADA));
    }

    private void validarIndicacaoPendente(Indicacao indicacao, String acao) {
        if (!StatusIndicacao.PENDENTE.equals(indicacao.getStatus())) {
            throw new RegraDeNegocioException(
                    "Não é possível " + acao + " uma indicação cujo status atual é " + indicacao.getStatus() + "."
            );
        }
    }

    private StatusAluno resolverStatusRestaurado(StatusAluno statusAnterior) {
        if (statusAnterior == null || StatusAluno.EM_TRIAGEM.equals(statusAnterior) || statusAnterior.isEncerrado()) {
            return StatusAluno.ATIVO;
        }
        return statusAnterior;
    }

    private void notificarEquipeClai(Indicacao indicacao,
                                     Aluno aluno,
                                     Usuario solicitante,
                                     Set<String> disciplinas) {
        String titulo = limitarTamanho("Nova indicação para triagem — " + aluno.getNomeCompleto(), 255);
        String disciplinasTexto = String.join(", ", disciplinas);
        String nomeSolicitante = solicitante.getNome() != null ? solicitante.getNome() : solicitante.getEmail();

        String mensagem = String.format(
                "O estudante %s (matrícula %s) foi indicado por %s para triagem pedagógica. "
                        + "Disciplinas observadas: %s. Justificativa: %s",
                aluno.getNomeCompleto(),
                aluno.getMatricula(),
                nomeSolicitante,
                disciplinasTexto,
                indicacao.getJustificativaPedagogica()
        );

        String linkReferencia = "/api/indicacoes/" + indicacao.getId();

        for (String perfil : PERFIS_NOTIFICADOS_CLAI) {
            notificacaoService.criarNotificacao(perfil, titulo, mensagem, linkReferencia);
        }
    }

    private String construirDiagnosticoInicialEstudo(Indicacao indicacao) {
        String disciplinasTexto = indicacao.getDisciplinasObservadas() != null
                ? String.join(", ", indicacao.getDisciplinasObservadas())
                : "";
        return String.format(
                "Estudo de Caso iniciado a partir da indicação de demanda espontânea. "
                        + "Disciplinas observadas: %s. Justificativa pedagógica: %s",
                disciplinasTexto,
                indicacao.getJustificativaPedagogica()
        );
    }

    private Set<String> normalizarEValidarDisciplinas(List<String> disciplinas) {
        if (disciplinas == null || disciplinas.isEmpty()) {
            throw new RegraDeNegocioException(
                    "Informe ao menos uma disciplina onde a dificuldade foi observada."
            );
        }

        Set<String> normalizadas = new LinkedHashSet<>();
        for (String disciplina : disciplinas) {
            if (disciplina == null || disciplina.isBlank()) {
                throw new RegraDeNegocioException("O nome da disciplina não pode estar em branco.");
            }
            String trimmed = disciplina.trim();
            if (trimmed.length() > 150) {
                throw new RegraDeNegocioException("O nome da disciplina não pode exceder 150 caracteres.");
            }
            normalizadas.add(trimmed);
        }

        if (normalizadas.isEmpty()) {
            throw new RegraDeNegocioException(
                    "Informe ao menos uma disciplina onde a dificuldade foi observada."
            );
        }
        return normalizadas;
    }

    private String validarTextoObrigatorio(String valor, String mensagemErro) {
        if (valor == null || valor.isBlank()) {
            throw new RegraDeNegocioException(mensagemErro);
        }
        return valor.trim();
    }

    private String normalizarOpcional(String valor) {
        if (valor == null || valor.isBlank()) {
            return null;
        }
        return valor.trim();
    }

    private String limitarTamanho(String valor, int maxLength) {
        if (valor == null || valor.length() <= maxLength) {
            return valor;
        }
        return valor.substring(0, maxLength);
    }

    private void validarUsuarioResponsavel(UUID usuarioId) {
        if (usuarioId == null) {
            throw new AuthenticationCredentialsNotFoundException(
                    "Autenticação obrigatória para acessar este recurso."
            );
        }
    }
}
