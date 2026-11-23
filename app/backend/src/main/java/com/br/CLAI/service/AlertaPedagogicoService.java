package com.br.CLAI.service;

import com.br.CLAI.domain.AlertaPedagogico;
import com.br.CLAI.domain.Aluno;
import com.br.CLAI.domain.IndicadorReutilizavel;
import com.br.CLAI.domain.Pea;
import com.br.CLAI.domain.enums.SeveridadeAlerta;
import com.br.CLAI.domain.enums.TipoAlertaPedagogico;
import com.br.CLAI.dto.request.SuapBoletimDTO;
import com.br.CLAI.dto.request.SuapDisciplinaBoletimDTO;
import com.br.CLAI.dto.response.AlertaPedagogicoResponseDTO;
import com.br.CLAI.exception.NaoEncontradoException;
import com.br.CLAI.exception.RegraDeNegocioException;
import com.br.CLAI.repository.AlertaPedagogicoRepository;
import com.br.CLAI.repository.AlunoRepository;
import com.br.CLAI.repository.PeaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationCredentialsNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.text.Normalizer;
import java.time.Clock;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

/**
 * Motor de Análise de Alertas Pedagógicos e API do Dashboard da CLAI (US 05 / Issue #106).
 * <p>
 * Cruza o boletim e o status acadêmico do SUAP com os PEAs ativos ({@code sigi.pea} - US 03)
 * e as tags de acessibilidade/dificuldade do estudante ({@code sigi.aluno_tag_dificuldade} - US 12):
 * <ul>
 *     <li><b>TA5.1</b>: Emite alerta {@link SeveridadeAlerta#VERMELHO} quando há retenção ou iminência de jubilamento;</li>
 *     <li><b>TA5.2</b>: Emite alerta {@link SeveridadeAlerta#PEDAGOGICO} quando aluno com tag "não alfabetizado"
 *     ou "estágio silábico" obtém nota máxima em disciplina teórica no SUAP sem PEA cadastrado;</li>
 *     <li><b>TA5.3</b>: Permite filtragem combinada por Unidade, Curso, Turma e status de tratamento;</li>
 *     <li><b>TA5.4</b>: Permite marcar alertas como Cientes/Tratados com registro de autor e timestamp.</li>
 * </ul>
 */
@Service
public class AlertaPedagogicoService {

    private static final BigDecimal NOTA_MAXIMA_ESCALA_100 = BigDecimal.valueOf(100);
    private static final BigDecimal NOTA_MAXIMA_ESCALA_10 = BigDecimal.TEN;
    private static final String MSG_ALERTA_NAO_ENCONTRADO = "Alerta pedagógico não encontrado com o ID fornecido.";

    private final AlertaPedagogicoRepository alertaRepository;
    private final AlunoRepository alunoRepository;
    private final PeaRepository peaRepository;
    private final SuapBoletimClient suapBoletimClient;
    private final Clock clock;

    @Autowired
    public AlertaPedagogicoService(
            AlertaPedagogicoRepository alertaRepository,
            AlunoRepository alunoRepository,
            PeaRepository peaRepository,
            SuapBoletimClient suapBoletimClient,
            Clock clock
    ) {
        this.alertaRepository = alertaRepository;
        this.alunoRepository = alunoRepository;
        this.peaRepository = peaRepository;
        this.suapBoletimClient = suapBoletimClient;
        this.clock = clock != null ? clock : Clock.systemDefaultZone();
    }

    /**
     * Consulta o boletim/status acadêmico do estudante no SUAP via {@link SuapBoletimClient}
     * e executa o motor de análise (TA5.1 e TA5.2).
     */
    @Transactional
    public List<AlertaPedagogicoResponseDTO> analisarAlunoViaSuap(UUID alunoId, UUID usuarioId) {
        if (alunoId == null) {
            throw new RegraDeNegocioException("O ID do estudante é obrigatório para análise no SUAP.");
        }
        Aluno aluno = alunoRepository.findById(alunoId)
                .orElseThrow(() -> new NaoEncontradoException("Estudante não encontrado com o ID fornecido."));

        if (suapBoletimClient == null) {
            throw new RegraDeNegocioException("Cliente de integração com o SUAP não configurado.");
        }

        SuapBoletimDTO boletimSuap = suapBoletimClient.consultarBoletimPorMatricula(aluno.getMatricula())
                .orElseThrow(() -> new NaoEncontradoException(
                        "Boletim/situação acadêmica não encontrado no SUAP para a matrícula " + aluno.getMatricula() + "."
                ));

        SuapBoletimDTO boletimVinculado = new SuapBoletimDTO(
                aluno.getId(),
                aluno.getMatricula(),
                boletimSuap.unidade(),
                boletimSuap.curso(),
                boletimSuap.turma(),
                boletimSuap.retido(),
                boletimSuap.riscoJubilamento(),
                boletimSuap.situacaoAcademica(),
                boletimSuap.disciplinas()
        );

        return analisarBoletim(boletimVinculado, usuarioId);
    }

    /**
     * Analisa um boletim/status acadêmico oriundo do SUAP (real ou simulado) e persiste os alertas
     * identificados conforme as regras TA5.1 e TA5.2.
     */
    @Transactional
    public List<AlertaPedagogicoResponseDTO> analisarBoletim(SuapBoletimDTO boletim, UUID usuarioId) {
        if (boletim == null) {
            throw new RegraDeNegocioException("Os dados do boletim SUAP são obrigatórios para análise.");
        }

        Aluno aluno = resolverAluno(boletim);
        String unidade = normalizarTextoOpcional(boletim.unidade());
        String curso = normalizarTextoOpcional(boletim.curso()) != null
                ? normalizarTextoOpcional(boletim.curso())
                : normalizarTextoOpcional(aluno.getCurso());
        String turma = normalizarTextoOpcional(boletim.turma()) != null
                ? normalizarTextoOpcional(boletim.turma())
                : normalizarTextoOpcional(aluno.getTurma());

        List<AlertaPedagogico> alertasGerados = new ArrayList<>();

        // TA5.1: Alerta VERMELHO para retenção ou iminência/risco de jubilamento no SUAP
        if (isRetencao(boletim)) {
            String descricao = String.format(
                    "Risco acadêmico detectado via SUAP: estudante %s (matrícula %s) apresenta indicativo de retenção.",
                    aluno.getNomeCompleto(),
                    aluno.getMatricula()
            );
            registrarAlertaSeNaoDuplicado(
                    alertasGerados,
                    aluno,
                    TipoAlertaPedagogico.RETENCAO,
                    SeveridadeAlerta.VERMELHO,
                    unidade,
                    curso,
                    turma,
                    descricao,
                    usuarioId
            );
        }

        if (isRiscoJubilamento(boletim)) {
            String descricao = String.format(
                    "Risco crítico detectado via SUAP: estudante %s (matrícula %s) encontra-se em iminência/risco de jubilamento.",
                    aluno.getNomeCompleto(),
                    aluno.getMatricula()
            );
            registrarAlertaSeNaoDuplicado(
                    alertasGerados,
                    aluno,
                    TipoAlertaPedagogico.RISCO_JUBILAMENTO,
                    SeveridadeAlerta.VERMELHO,
                    unidade,
                    curso,
                    turma,
                    descricao,
                    usuarioId
            );
        }

        // TA5.2: Alerta PEDAGOGICO para incoerência avaliativa (tag de alfabetização + nota máxima teórica sem PEA)
        List<String> tagsAlfabetizacao = extrairTagsAlfabetizacao(aluno.getTagsDificuldade());
        if (!tagsAlfabetizacao.isEmpty() && boletim.disciplinas() != null && !boletim.disciplinas().isEmpty()) {
            List<Pea> peasAtivos = peaRepository.findByAcompanhamento_Aluno_Id(aluno.getId());
            String tagsFormatadas = String.join(", ", tagsAlfabetizacao);

            for (SuapDisciplinaBoletimDTO disciplina : boletim.disciplinas()) {
                if (disciplina == null) {
                    continue;
                }
                if (isDisciplinaTeorica(disciplina)
                        && isNotaMaxima(disciplina)
                        && !possuiPeaParaDisciplina(peasAtivos, disciplina)) {

                    String nomeDisciplina = (disciplina.componenteCurricular() != null
                            && !disciplina.componenteCurricular().isBlank())
                            ? disciplina.componenteCurricular().trim()
                            : "Disciplina teórica";

                    String descricao = String.format(
                            "Incoerência pedagógica detectada: estudante %s (matrícula %s) possui tag [%s] "
                                    + "e obteve nota máxima (%s) na disciplina teórica '%s' no SUAP sem PEA cadastrado.",
                            aluno.getNomeCompleto(),
                            aluno.getMatricula(),
                            tagsFormatadas,
                            disciplina.nota().stripTrailingZeros().toPlainString(),
                            nomeDisciplina
                    );

                    registrarAlertaSeNaoDuplicado(
                            alertasGerados,
                            aluno,
                            TipoAlertaPedagogico.INCOERENCIA_PEDAGOGICA,
                            SeveridadeAlerta.PEDAGOGICO,
                            unidade,
                            curso,
                            turma,
                            descricao,
                            usuarioId
                    );
                }
            }
        }

        return alertasGerados.stream().map(this::toResponse).toList();
    }

    /**
     * Lista alertas do Dashboard aplicando filtros combinados por Unidade, Curso, Turma e Tratado (TA5.3 e TA5.4).
     * Por padrão ({@code tratado == null}), retorna apenas os alertas ativos ({@code tratado = false}).
     */
    @Transactional(readOnly = true)
    public List<AlertaPedagogicoResponseDTO> listarAlertas(
            String unidade,
            String curso,
            String turma,
            Boolean tratado,
            SeveridadeAlerta severidade,
            UUID alunoId
    ) {
        Boolean filtroTratado = tratado != null ? tratado : Boolean.FALSE;
        return alertaRepository.buscarComFiltros(
                        normalizarParaLike(unidade),
                        normalizarParaLike(curso),
                        normalizarParaLike(turma),
                        filtroTratado,
                        severidade,
                        alunoId
                )
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public AlertaPedagogicoResponseDTO buscarPorId(UUID id) {
        AlertaPedagogico alerta = alertaRepository.findById(id)
                .orElseThrow(() -> new NaoEncontradoException(MSG_ALERTA_NAO_ENCONTRADO));
        return toResponse(alerta);
    }

    /**
     * Marca o alerta como "Ciente/Tratado" (TA5.4), registrando autor e timestamp
     * e removendo-o da listagem ativa ({@code tratado = false}).
     */
    @Transactional
    public AlertaPedagogicoResponseDTO marcarComoTratado(UUID alertaId, UUID usuarioId) {
        if (usuarioId == null) {
            throw new AuthenticationCredentialsNotFoundException(
                    "Autenticação obrigatória para tratar um alerta pedagógico."
            );
        }

        AlertaPedagogico alerta = alertaRepository.findById(alertaId)
                .orElseThrow(() -> new NaoEncontradoException(MSG_ALERTA_NAO_ENCONTRADO));

        if (!Boolean.TRUE.equals(alerta.getTratado())) {
            LocalDateTime agora = LocalDateTime.now(clock);
            alerta.setTratado(Boolean.TRUE);
            alerta.setTratadoPor(usuarioId);
            alerta.setTratadoEm(agora);
            alerta.setAtualizadoPor(usuarioId);
            alerta.setAtualizadoEm(agora);
            alerta = alertaRepository.save(alerta);
        }

        return toResponse(alerta);
    }

    private Aluno resolverAluno(SuapBoletimDTO boletim) {
        if (boletim.alunoId() != null) {
            return alunoRepository.findById(boletim.alunoId())
                    .orElseThrow(() -> new NaoEncontradoException("Estudante não encontrado com o ID fornecido."));
        }
        if (boletim.matricula() != null && !boletim.matricula().isBlank()) {
            return alunoRepository.findByMatricula(boletim.matricula().trim())
                    .orElseThrow(() -> new NaoEncontradoException(
                            "Estudante não encontrado com a matrícula informada: " + boletim.matricula().trim()
                    ));
        }
        throw new RegraDeNegocioException("Informe o alunoId ou a matrícula do estudante para análise do boletim SUAP.");
    }

    private void registrarAlertaSeNaoDuplicado(
            List<AlertaPedagogico> alertasGerados,
            Aluno aluno,
            TipoAlertaPedagogico tipoAlerta,
            SeveridadeAlerta severidade,
            String unidade,
            String curso,
            String turma,
            String descricao,
            UUID usuarioId
    ) {
        if (alertaRepository.existsByAluno_IdAndTipoAlertaAndDescricaoAndTratadoFalse(
                aluno.getId(), tipoAlerta, descricao)) {
            return;
        }

        LocalDateTime agora = LocalDateTime.now(clock);
        AlertaPedagogico alerta = new AlertaPedagogico(
                aluno,
                tipoAlerta,
                severidade,
                unidade,
                curso,
                turma,
                descricao
        );
        alerta.setCriadoPor(usuarioId);
        alerta.setAtualizadoPor(usuarioId);
        alerta.setCriadoEm(agora);
        alerta.setAtualizadoEm(agora);

        alertasGerados.add(alertaRepository.save(alerta));
    }

    private boolean isRetencao(SuapBoletimDTO boletim) {
        if (Boolean.TRUE.equals(boletim.retido())) {
            return true;
        }
        String situacao = normalizarChaveComparacao(boletim.situacaoAcademica());
        return situacao.contains("retido")
                || situacao.contains("retencao")
                || situacao.contains("reprovado");
    }

    private boolean isRiscoJubilamento(SuapBoletimDTO boletim) {
        if (Boolean.TRUE.equals(boletim.riscoJubilamento())) {
            return true;
        }
        String situacao = normalizarChaveComparacao(boletim.situacaoAcademica());
        return situacao.contains("jubilamento") || situacao.contains("jubilado");
    }

    private List<String> extrairTagsAlfabetizacao(Set<IndicadorReutilizavel> tags) {
        if (tags == null || tags.isEmpty()) {
            return List.of();
        }
        List<String> encontradas = new ArrayList<>();
        for (IndicadorReutilizavel tag : tags) {
            if (tag == null || tag.getNome() == null) {
                continue;
            }
            String normalizada = normalizarChaveComparacao(tag.getNome());
            if (normalizada.contains("nao alfabetizado") || normalizada.contains("estagio silabico")) {
                encontradas.add(tag.getNome().trim());
            }
        }
        return encontradas;
    }

    private boolean isDisciplinaTeorica(SuapDisciplinaBoletimDTO disciplina) {
        return disciplina.teorica() == null || Boolean.TRUE.equals(disciplina.teorica());
    }

    private boolean isNotaMaxima(SuapDisciplinaBoletimDTO disciplina) {
        BigDecimal nota = disciplina.nota();
        if (nota == null) {
            return false;
        }
        BigDecimal maximaInformada = disciplina.notaMaxima();
        if (maximaInformada != null && maximaInformada.compareTo(BigDecimal.ZERO) > 0) {
            return nota.compareTo(maximaInformada) >= 0;
        }
        return nota.compareTo(NOTA_MAXIMA_ESCALA_100) >= 0
                || nota.compareTo(NOTA_MAXIMA_ESCALA_10) == 0;
    }

    private boolean possuiPeaParaDisciplina(List<Pea> peasAtivos, SuapDisciplinaBoletimDTO disciplina) {
        if (peasAtivos == null || peasAtivos.isEmpty()) {
            return false;
        }
        String disciplinaNormalizada = normalizarChaveComparacao(disciplina.componenteCurricular());

        for (Pea pea : peasAtivos) {
            if (pea == null) {
                continue;
            }
            if (disciplina.disciplinaId() != null
                    && pea.getDisciplinaId() != null
                    && disciplina.disciplinaId().equals(pea.getDisciplinaId())) {
                return true;
            }
            if (!disciplinaNormalizada.isEmpty()
                    && pea.getComponenteCurricular() != null
                    && !pea.getComponenteCurricular().isBlank()
                    && normalizarChaveComparacao(pea.getComponenteCurricular()).equals(disciplinaNormalizada)) {
                return true;
            }
            // PEA genérico cadastrado sem vínculo específico de disciplina cobre o acompanhamento do estudante.
            if (pea.getDisciplinaId() == null
                    && (pea.getComponenteCurricular() == null || pea.getComponenteCurricular().isBlank())) {
                return true;
            }
        }
        return false;
    }

    private String normalizarTextoOpcional(String valor) {
        if (valor == null) {
            return null;
        }
        String trimmed = valor.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private String normalizarChaveComparacao(String valor) {
        if (valor == null || valor.isBlank()) {
            return "";
        }
        return Normalizer.normalize(valor.trim(), Normalizer.Form.NFD)
                .replaceAll("\\p{M}+", "")
                .toLowerCase(Locale.ROOT)
                .replaceAll("[-_]+", " ")
                .replaceAll("\\s+", " ")
                .trim();
    }

    private String normalizarParaLike(String valor) {
        if (valor == null) {
            return "";
        }
        String trimmed = valor.trim();
        if (trimmed.isEmpty()) {
            return "";
        }
        String semAcentos = Normalizer.normalize(trimmed, Normalizer.Form.NFD)
                .replaceAll("\\p{M}+", "")
                .toLowerCase(Locale.ROOT);
        return semAcentos
                .replace("!", "!!")
                .replace("%", "!%")
                .replace("_", "!_");
    }

    private AlertaPedagogicoResponseDTO toResponse(AlertaPedagogico entity) {
        Aluno aluno = entity.getAluno();
        return new AlertaPedagogicoResponseDTO(
                entity.getId(),
                aluno != null ? aluno.getId() : null,
                aluno != null ? aluno.getNomeCompleto() : null,
                aluno != null ? aluno.getMatricula() : null,
                entity.getTipoAlerta(),
                entity.getSeveridade(),
                entity.getUnidade(),
                entity.getCurso(),
                entity.getTurma(),
                entity.getDescricao(),
                entity.getTratado(),
                entity.getTratadoPor(),
                entity.getTratadoEm(),
                entity.getCriadoEm()
        );
    }
}
