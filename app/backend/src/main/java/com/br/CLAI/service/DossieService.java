package com.br.CLAI.service;

import com.br.CLAI.domain.Aluno;
import com.br.CLAI.domain.AnexoEstudante;
import com.br.CLAI.domain.AtaReuniao;
import com.br.CLAI.domain.Atendimento;
import com.br.CLAI.domain.AuditLog;
import com.br.CLAI.domain.EstudoDeCaso;
import com.br.CLAI.domain.Indicacao;
import com.br.CLAI.domain.Notificacao;
import com.br.CLAI.domain.Pea;
import com.br.CLAI.domain.Pei;
import com.br.CLAI.domain.PlanoAcao;
import com.br.CLAI.domain.Rai;
import com.br.CLAI.domain.enums.EscopoDossie;
import com.br.CLAI.domain.enums.StatusEstudoCaso;
import com.br.CLAI.domain.enums.TipoAtendimento;
import com.br.CLAI.domain.enums.TipoClassificacaoAnexo;
import com.br.CLAI.domain.enums.TipoRelatorio;
import com.br.CLAI.domain.enums.TipoReuniao;
import com.br.CLAI.dto.response.AnexoEstudanteResponseDTO;
import com.br.CLAI.dto.response.AtaReuniaoResponseDTO;
import com.br.CLAI.dto.response.AtendimentoResponseDTO;
import com.br.CLAI.dto.response.AuditLogResponseDTO;
import com.br.CLAI.dto.response.ConvocacaoDossieDTO;
import com.br.CLAI.dto.response.DossieJuridicoResponseDTO;
import com.br.CLAI.dto.response.EstudoDeCasoResponseDTO;
import com.br.CLAI.dto.response.NotificacaoResponseDTO;
import com.br.CLAI.dto.response.PeaResponseDTO;
import com.br.CLAI.dto.response.PeiResponseDTO;
import com.br.CLAI.dto.response.PlanoAcaoResponseDTO;
import com.br.CLAI.dto.response.ProntuarioResponseDTO;
import com.br.CLAI.dto.response.RaiResponseDTO;
import com.br.CLAI.exception.NaoEncontradoException;
import com.br.CLAI.mapper.AtendimentoMapper;
import com.br.CLAI.mapper.EstudoDeCasoMapper;
import com.br.CLAI.mapper.PeaMapper;
import com.br.CLAI.mapper.PeiMapper;
import com.br.CLAI.mapper.PlanoAcaoMapper;
import com.br.CLAI.repository.AlunoRepository;
import com.br.CLAI.repository.AnexoEstudanteRepository;
import com.br.CLAI.repository.AtaReuniaoRepository;
import com.br.CLAI.repository.AtendimentoRepository;
import com.br.CLAI.repository.AuditLogRepository;
import com.br.CLAI.repository.EstudoDeCasoRepository;
import com.br.CLAI.repository.IndicacaoRepository;
import com.br.CLAI.repository.NotificacaoRepository;
import com.br.CLAI.repository.PeaRepository;
import com.br.CLAI.repository.PeiRepository;
import com.br.CLAI.repository.PlanoAcaoRepository;
import com.br.CLAI.repository.RaiRepository;
import com.br.CLAI.security.RbacGuard;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;

/**
 * Serviço de compilação e exportação do Dossiê Jurídico do estudante (US 06 / TA6.2 / TA6.4).
 * Consolida prontuário, documentos pedagógicos, atas de reunião, convocações, notificações/e-mails,
 * anexos e trilha de auditoria imutável ({@code sigi.audit_log}), aplicando automaticamente a omissão
 * de dados clínicos e registros de nível {@code SUPER_RESTRICAO} quando {@code escopo == EXTERNO}.
 */
@Service
public class DossieService {

    private static final DateTimeFormatter PROTOCOLO_DATA_FORMAT = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");

    private final AlunoRepository alunoRepository;
    private final EstudoDeCasoRepository estudoDeCasoRepository;
    private final PlanoAcaoRepository planoAcaoRepository;
    private final PeiRepository peiRepository;
    private final PeaRepository peaRepository;
    private final AtendimentoRepository atendimentoRepository;
    private final RaiRepository raiRepository;
    private final AtaReuniaoRepository ataReuniaoRepository;
    private final AnexoEstudanteRepository anexoEstudanteRepository;
    private final IndicacaoRepository indicacaoRepository;
    private final NotificacaoRepository notificacaoRepository;
    private final AuditLogRepository auditLogRepository;
    private final AuditoriaService auditoriaService;
    private final EstudoDeCasoMapper estudoDeCasoMapper;
    private final PlanoAcaoMapper planoAcaoMapper;
    private final PeiMapper peiMapper;
    private final PeaMapper peaMapper;
    private final AtendimentoMapper atendimentoMapper;
    private final RbacGuard rbacGuard;
    private final Clock clock;

    @Autowired
    public DossieService(
            AlunoRepository alunoRepository,
            EstudoDeCasoRepository estudoDeCasoRepository,
            PlanoAcaoRepository planoAcaoRepository,
            PeiRepository peiRepository,
            PeaRepository peaRepository,
            AtendimentoRepository atendimentoRepository,
            RaiRepository raiRepository,
            AtaReuniaoRepository ataReuniaoRepository,
            AnexoEstudanteRepository anexoEstudanteRepository,
            IndicacaoRepository indicacaoRepository,
            NotificacaoRepository notificacaoRepository,
            AuditLogRepository auditLogRepository,
            AuditoriaService auditoriaService,
            EstudoDeCasoMapper estudoDeCasoMapper,
            PlanoAcaoMapper planoAcaoMapper,
            PeiMapper peiMapper,
            PeaMapper peaMapper,
            AtendimentoMapper atendimentoMapper,
            RbacGuard rbacGuard,
            Clock clock
    ) {
        this.alunoRepository = alunoRepository;
        this.estudoDeCasoRepository = estudoDeCasoRepository;
        this.planoAcaoRepository = planoAcaoRepository;
        this.peiRepository = peiRepository;
        this.peaRepository = peaRepository;
        this.atendimentoRepository = atendimentoRepository;
        this.raiRepository = raiRepository;
        this.ataReuniaoRepository = ataReuniaoRepository;
        this.anexoEstudanteRepository = anexoEstudanteRepository;
        this.indicacaoRepository = indicacaoRepository;
        this.notificacaoRepository = notificacaoRepository;
        this.auditLogRepository = auditLogRepository;
        this.auditoriaService = auditoriaService;
        this.estudoDeCasoMapper = estudoDeCasoMapper;
        this.planoAcaoMapper = planoAcaoMapper;
        this.peiMapper = peiMapper;
        this.peaMapper = peaMapper;
        this.atendimentoMapper = atendimentoMapper;
        this.rbacGuard = rbacGuard != null ? rbacGuard : new RbacGuard();
        this.clock = clock != null ? clock : Clock.systemDefaultZone();
    }

    @Transactional
    public DossieJuridicoResponseDTO exportarDossie(UUID alunoId, EscopoDossie escopo, UUID usuarioSolicitanteId) {
        Aluno aluno = alunoRepository.findById(alunoId)
                .orElseThrow(() -> new NaoEncontradoException("Estudante não encontrado com o ID: " + alunoId));

        EscopoDossie escopoEfetivo = escopo != null ? escopo : EscopoDossie.INTERNO;
        boolean externo = escopoEfetivo == EscopoDossie.EXTERNO;
        LocalDateTime geradoEm = LocalDateTime.now(clock);
        UUID geradoPor = usuarioSolicitanteId != null
                ? usuarioSolicitanteId
                : rbacGuard.getUsuarioAutenticado().map(u -> u.getId()).orElse(null);

        String protocolo = gerarProtocolo(aluno, escopoEfetivo, geradoEm);

        List<EstudoDeCaso> estudos = listaSegura(estudoDeCasoRepository.findByAlunoId(alunoId));
        List<PlanoAcao> planos = listaSegura(planoAcaoRepository.findByAcompanhamento_Aluno_Id(alunoId));
        List<Pei> peis = listaSegura(peiRepository.findByAcompanhamento_Aluno_Id(alunoId));
        List<Pea> peas = listaSegura(peaRepository.findByAcompanhamento_Aluno_Id(alunoId));
        List<Atendimento> atendimentos = listaSegura(atendimentoRepository.findByAlunoId(alunoId));
        List<Rai> rais = listaSegura(raiRepository.findByAlunoIdOrderByCriadoEmAsc(alunoId));
        List<AtaReuniao> atas = OrdenacaoAuditoria.ordenarPorCriacaoDesc(listaSegura(ataReuniaoRepository.findByAlunoId(alunoId)));
        List<AnexoEstudante> anexos = listaSegura(anexoEstudanteRepository.findByAlunoIdOrderByCriadoEmDesc(alunoId));
        List<Indicacao> indicacoes = listaSegura(indicacaoRepository.findByAlunoIdOrderByCriadoEmDesc(alunoId));

        Set<UUID> entidadeIdsDoAluno = new LinkedHashSet<>();
        entidadeIdsDoAluno.add(alunoId);
        estudos.stream().map(EstudoDeCaso::getId).filter(Objects::nonNull).forEach(entidadeIdsDoAluno::add);
        planos.stream().map(PlanoAcao::getId).filter(Objects::nonNull).forEach(entidadeIdsDoAluno::add);
        peis.stream().map(Pei::getId).filter(Objects::nonNull).forEach(entidadeIdsDoAluno::add);
        peas.stream().map(Pea::getId).filter(Objects::nonNull).forEach(entidadeIdsDoAluno::add);
        atendimentos.stream().map(Atendimento::getId).filter(Objects::nonNull).forEach(entidadeIdsDoAluno::add);
        rais.stream().map(Rai::getId).filter(Objects::nonNull).forEach(entidadeIdsDoAluno::add);
        atas.stream().map(AtaReuniao::getId).filter(Objects::nonNull).forEach(entidadeIdsDoAluno::add);
        anexos.stream().map(AnexoEstudante::getId).filter(Objects::nonNull).forEach(entidadeIdsDoAluno::add);
        indicacoes.stream().map(Indicacao::getId).filter(Objects::nonNull).forEach(entidadeIdsDoAluno::add);

        Set<UUID> anexosSensiveisIds = new HashSet<>();
        for (AnexoEstudante anexo : anexos) {
            if (anexo.getId() != null && isAnexoSuperRestritoOuClinico(anexo)) {
                anexosSensiveisIds.add(anexo.getId());
            }
        }

        List<Notificacao> notificacoesDoAluno = filtrarNotificacoesDoAluno(
                listaSegura(notificacaoRepository.findAll()),
                aluno,
                entidadeIdsDoAluno
        );
        notificacoesDoAluno.stream()
                .map(Notificacao::getId)
                .filter(Objects::nonNull)
                .forEach(entidadeIdsDoAluno::add);

        // Registra a própria exportação na trilha imutável de auditoria (TA6.1)
        if (auditoriaService != null) {
            auditoriaService.registrar(
                    geradoPor,
                    "EXPORTACAO_DOSSIE",
                    "DOSSIE_JURIDICO",
                    alunoId,
                    "/api/alunos/" + alunoId + "/dossie/exportar",
                    "GET",
                    "escopo=" + escopoEfetivo.name() + "; protocolo=" + protocolo + "; alunoId=" + alunoId
            );
        }

        List<AuditLog> logsBrutos = listaSegura(
                auditLogRepository.buscarRelacionadosAoEstudante(entidadeIdsDoAluno, alunoId.toString())
        );

        // TA6.4: filtragem automática de anexos e dados clínicos SUPER_RESTRICAO quando escopo == EXTERNO
        List<AnexoEstudanteResponseDTO> anexosDto = anexos.stream()
                .filter(anexo -> !externo || !isAnexoSuperRestritoOuClinico(anexo))
                .map(anexo -> AnexoEstudanteResponseDTO.fromEntity(anexo, !externo))
                .toList();

        List<AnexoEstudanteResponseDTO> laudosMedicosDto = externo
                ? null
                : anexos.stream()
                        .filter(this::isAnexoSuperRestritoOuClinico)
                        .map(anexo -> AnexoEstudanteResponseDTO.fromEntity(anexo, true))
                        .toList();

        List<EstudoDeCasoResponseDTO> estudosDto = estudos.stream()
                .map(estudo -> converterEstudoParaDossie(estudo, externo))
                .toList();

        List<PlanoAcaoResponseDTO> planosDto = planos.stream()
                .map(planoAcaoMapper::toResponse)
                .toList();

        List<PeiResponseDTO> peisDto = peis.stream()
                .map(peiMapper::toResponse)
                .toList();

        List<PeaResponseDTO> peasDto = peas.stream()
                .map(peaMapper::toResponse)
                .toList();

        List<AtendimentoResponseDTO> atendimentosDto = OrdenacaoAuditoria.ordenarPorCriacaoDesc(atendimentos)
                .stream()
                .filter(at -> !externo || at.getTipoAtendimento() != TipoAtendimento.PSICOLOGICO)
                .map(at -> atendimentoMapper.toResponse(at, AtendimentoService.JANELA_EDICAO))
                .toList();

        List<RaiResponseDTO> raisDto = rais.stream()
                .map(this::converterRai)
                .toList();

        List<AtaReuniaoResponseDTO> atasDto = atas.stream()
                .map(AtaReuniaoResponseDTO::fromEntity)
                .toList();

        List<NotificacaoResponseDTO> notificacoesDto = notificacoesDoAluno.stream()
                .map(this::converterNotificacao)
                .toList();

        List<ConvocacaoDossieDTO> convocacoesDto = compilarConvocacoes(atas, notificacoesDoAluno);

        List<AuditLogResponseDTO> logsDto = logsBrutos.stream()
                .filter(log -> !externo || !isLogSuperRestricao(log, anexosSensiveisIds))
                .map(AuditLogResponseDTO::fromEntity)
                .toList();

        ProntuarioResponseDTO prontuarioDto = construirProntuarioConsolidado(
                aluno,
                estudos,
                peis.size(),
                peas.size(),
                anexosDto.size(),
                externo
        );

        return new DossieJuridicoResponseDTO(
                protocolo,
                escopoEfetivo,
                geradoEm,
                geradoPor,
                aluno.getId(),
                aluno.getNomeCompleto(),
                aluno.getMatricula(),
                aluno.getCurso(),
                aluno.getTurma(),
                aluno.getStatus(),
                prontuarioDto,
                estudosDto,
                planosDto,
                peisDto,
                peasDto,
                atendimentosDto,
                raisDto,
                atasDto,
                convocacoesDto,
                notificacoesDto,
                anexosDto,
                laudosMedicosDto,
                logsDto
        );
    }

    private ProntuarioResponseDTO construirProntuarioConsolidado(
            Aluno aluno,
            List<EstudoDeCaso> estudos,
            int totalPeis,
            int totalPeas,
            int totalAnexosVisiveis,
            boolean externo
    ) {
        EstudoDeCaso estudoVigente = OrdenacaoAuditoria.selecionarEstudoVigente(estudos).orElse(null);

        UUID estudoId = estudoVigente != null ? estudoVigente.getId() : null;
        StatusEstudoCaso statusEstudo = estudoVigente != null ? estudoVigente.getStatus() : null;
        String diagnostico = estudoVigente != null ? estudoVigente.getDiagnosticoInicial() : null;
        LocalDateTime atualizadoEm = estudoVigente != null ? estudoVigente.getAtualizadoEm() : aluno.getAtualizadoEm();

        String historicoFamiliar = null;
        String historicoSocioemocional = null;
        if (!externo && estudoVigente != null && rbacGuard.podeAcessarDadosSensiveis()) {
            historicoFamiliar = estudoVigente.getHistoricoFamiliar();
            historicoSocioemocional = estudoVigente.getHistoricoSocioemocional();
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
                totalAnexosVisiveis,
                atualizadoEm
        );
    }

    private EstudoDeCasoResponseDTO converterEstudoParaDossie(EstudoDeCaso estudo, boolean externo) {
        EstudoDeCasoResponseDTO base = estudoDeCasoMapper.toResponse(estudo);
        if (!externo || base == null) {
            return base;
        }
        return new EstudoDeCasoResponseDTO(
                base.id(),
                base.alunoId(),
                base.status(),
                base.diagnosticoInicial(),
                base.historico(),
                null,
                null,
                base.indicadoresIds(),
                base.versao(),
                base.estudoOrigemId(),
                base.criadoEm(),
                base.atualizadoEm(),
                base.atualizadoPor()
        );
    }

    private List<Notificacao> filtrarNotificacoesDoAluno(
            List<Notificacao> todas,
            Aluno aluno,
            Set<UUID> entidadeIdsDoAluno
    ) {
        Set<String> idsTexto = new HashSet<>();
        for (UUID id : entidadeIdsDoAluno) {
            idsTexto.add(id.toString().toLowerCase(Locale.ROOT));
        }

        String matriculaLower = aluno.getMatricula() != null && !aluno.getMatricula().isBlank()
                ? aluno.getMatricula().trim().toLowerCase(Locale.ROOT)
                : null;
        String nomeLower = aluno.getNomeCompleto() != null && !aluno.getNomeCompleto().isBlank()
                ? aluno.getNomeCompleto().trim().toLowerCase(Locale.ROOT)
                : null;

        return todas.stream()
                .filter(n -> pertenceAoEstudante(n, idsTexto, matriculaLower, nomeLower))
                .sorted(Comparator.comparing(
                        Notificacao::getCriadoEm,
                        Comparator.nullsLast(Comparator.reverseOrder())))
                .toList();
    }

    private boolean pertenceAoEstudante(
            Notificacao notificacao,
            Set<String> idsTexto,
            String matriculaLower,
            String nomeLower
    ) {
        String link = notificacao.getLinkReferencia() != null
                ? notificacao.getLinkReferencia().toLowerCase(Locale.ROOT)
                : "";
        String titulo = notificacao.getTitulo() != null
                ? notificacao.getTitulo().toLowerCase(Locale.ROOT)
                : "";
        String mensagem = notificacao.getMensagem() != null
                ? notificacao.getMensagem().toLowerCase(Locale.ROOT)
                : "";

        for (String idStr : idsTexto) {
            if (link.contains(idStr) || mensagem.contains(idStr) || titulo.contains(idStr)) {
                return true;
            }
        }
        if (matriculaLower != null && (mensagem.contains(matriculaLower) || titulo.contains(matriculaLower))) {
            return true;
        }
        return nomeLower != null && (mensagem.contains(nomeLower) || titulo.contains(nomeLower));
    }

    private List<ConvocacaoDossieDTO> compilarConvocacoes(
            List<AtaReuniao> atas,
            List<Notificacao> notificacoesDoAluno
    ) {
        List<ConvocacaoDossieDTO> convocacoes = new ArrayList<>();

        for (AtaReuniao ata : atas) {
            if (ata.getTipoReuniao() == TipoReuniao.ALINHAMENTO_FAMILIA) {
                convocacoes.add(new ConvocacaoDossieDTO(
                        ata.getId(),
                        "ATA_REUNIAO",
                        ata.getTipoReuniao().name(),
                        ata.getDataReuniao(),
                        "Reunião de Alinhamento com Família",
                        ata.getPauta(),
                        ata.getLocalReuniao(),
                        ata.getStatus() != null ? ata.getStatus().name() : null,
                        ata.getId() != null ? "/api/atas/" + ata.getId() : null
                ));
            }
        }

        for (Notificacao notif : notificacoesDoAluno) {
            if (isNotificacaoConvocacaoOuEmail(notif)) {
                convocacoes.add(new ConvocacaoDossieDTO(
                        notif.getId(),
                        "NOTIFICACAO",
                        "CONVOCACAO_OU_COMUNICADO",
                        notif.getCriadoEm(),
                        notif.getTitulo(),
                        notif.getMensagem(),
                        null,
                        Boolean.TRUE.equals(notif.getLida()) ? "LIDA" : "ENVIADA",
                        notif.getLinkReferencia()
                ));
            }
        }

        convocacoes.sort(Comparator.comparing(
                ConvocacaoDossieDTO::dataReferencia,
                Comparator.nullsLast(Comparator.reverseOrder())
        ));
        return convocacoes;
    }

    private boolean isNotificacaoConvocacaoOuEmail(Notificacao notif) {
        String combinado = ((notif.getTitulo() != null ? notif.getTitulo() : "") + " "
                + (notif.getMensagem() != null ? notif.getMensagem() : "") + " "
                + (notif.getLinkReferencia() != null ? notif.getLinkReferencia() : ""))
                .toLowerCase(Locale.ROOT);
        return combinado.contains("convoca")
                || combinado.contains("reuni")
                || combinado.contains("famíl")
                || combinado.contains("famil")
                || combinado.contains("e-mail")
                || combinado.contains("email")
                || combinado.contains("/api/atas/");
    }

    private boolean isAnexoSuperRestritoOuClinico(AnexoEstudante anexo) {
        TipoClassificacaoAnexo classificacao = anexo.getClassificacao();
        return classificacao != null
                && (classificacao.isSensivel()
                || classificacao == TipoClassificacaoAnexo.LAUDO_MEDICO
                || classificacao == TipoClassificacaoAnexo.DIAGNOSTICO_NEUROPSICOLOGICO);
    }

    private boolean isLogSuperRestricao(AuditLog log, Set<UUID> anexosSensiveisIds) {
        if (log == null) {
            return false;
        }
        if (log.getEntidadeId() != null && anexosSensiveisIds.contains(log.getEntidadeId())) {
            return true;
        }
        String textoAuditado = String.join(" ",
                log.getEntidade() != null ? log.getEntidade() : "",
                log.getAcao() != null ? log.getAcao() : "",
                log.getEndpoint() != null ? log.getEndpoint() : "",
                log.getDetalhes() != null ? log.getDetalhes() : ""
        ).toUpperCase(Locale.ROOT);

        return textoAuditado.contains("SUPER_RESTRICAO")
                || textoAuditado.contains("LAUDO_MEDICO")
                || textoAuditado.contains("DIAGNOSTICO_NEUROPSICOLOGICO")
                || textoAuditado.contains("LAUDOS-MEDICOS")
                || textoAuditado.contains("HISTORICO-SOCIOEMOCIONAL");
    }

    private RaiResponseDTO converterRai(Rai rai) {
        return new RaiResponseDTO(
                rai.getId(),
                rai.getAlunoId(),
                rai.getPeiId(),
                rai.getAcompanhamentoId(),
                rai.getTipoRelatorio() != null ? rai.getTipoRelatorio() : TipoRelatorio.RAI,
                rai.getBimestre(),
                rai.getIndicativoRegressao(),
                rai.getDescricao(),
                rai.getCriadoEm()
        );
    }

    private NotificacaoResponseDTO converterNotificacao(Notificacao n) {
        return new NotificacaoResponseDTO(
                n.getId(),
                n.getPerfilDestinatario(),
                n.getUsuarioDestinatarioId(),
                n.getTitulo(),
                n.getMensagem(),
                n.getLinkReferencia(),
                n.getLida(),
                n.getCriadoEm()
        );
    }

    private String gerarProtocolo(Aluno aluno, EscopoDossie escopo, LocalDateTime geradoEm) {
        String sufixoMatricula = aluno.getMatricula() != null
                ? aluno.getMatricula().replaceAll("[^a-zA-Z0-9]", "")
                : aluno.getId().toString().substring(0, 8);
        return "DOSSIE-" + escopo.name() + "-" + geradoEm.format(PROTOCOLO_DATA_FORMAT) + "-" + sufixoMatricula;
    }

    private <T> List<T> listaSegura(List<T> lista) {
        return lista != null ? lista : List.of();
    }
}
