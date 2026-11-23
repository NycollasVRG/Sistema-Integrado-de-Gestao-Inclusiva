package com.br.CLAI.service;

import com.br.CLAI.domain.Acompanhamento;
import com.br.CLAI.domain.Aluno;
import com.br.CLAI.domain.AnexoEstudante;
import com.br.CLAI.domain.AtaReuniao;
import com.br.CLAI.domain.Atendimento;
import com.br.CLAI.domain.AuditLog;
import com.br.CLAI.domain.BaseEntity;
import com.br.CLAI.domain.EstudoDeCaso;
import com.br.CLAI.domain.Notificacao;
import com.br.CLAI.domain.Pei;
import com.br.CLAI.domain.Rai;
import com.br.CLAI.domain.Usuario;
import com.br.CLAI.domain.enums.EscopoDossie;
import com.br.CLAI.domain.enums.NivelRestricao;
import com.br.CLAI.domain.enums.Role;
import com.br.CLAI.domain.enums.StatusAluno;
import com.br.CLAI.domain.enums.StatusEstudoCaso;
import com.br.CLAI.domain.enums.TipoAtendimento;
import com.br.CLAI.domain.enums.TipoClassificacaoAnexo;
import com.br.CLAI.domain.enums.TipoRelatorio;
import com.br.CLAI.domain.enums.TipoReuniao;
import com.br.CLAI.dto.response.DossieJuridicoResponseDTO;
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
import org.hibernate.annotations.Immutable;
import org.hibernate.annotations.SoftDelete;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.lang.reflect.Method;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("US 06 - Testes Unitários de DossieService e Imutabilidade de AuditLog (TA6.2 / TA6.3 / TA6.4)")
class DossieServiceTest {

    @Mock
    private AlunoRepository alunoRepository;
    @Mock
    private EstudoDeCasoRepository estudoDeCasoRepository;
    @Mock
    private PlanoAcaoRepository planoAcaoRepository;
    @Mock
    private PeiRepository peiRepository;
    @Mock
    private PeaRepository peaRepository;
    @Mock
    private AtendimentoRepository atendimentoRepository;
    @Mock
    private RaiRepository raiRepository;
    @Mock
    private AtaReuniaoRepository ataReuniaoRepository;
    @Mock
    private AnexoEstudanteRepository anexoEstudanteRepository;
    @Mock
    private IndicacaoRepository indicacaoRepository;
    @Mock
    private NotificacaoRepository notificacaoRepository;
    @Mock
    private AuditLogRepository auditLogRepository;

    private DossieService dossieService;
    private RbacGuard rbacGuard;
    private Clock fixedClock;

    private UUID alunoId;
    private UUID adminId;
    private Aluno aluno;
    private EstudoDeCaso estudo;
    private AtaReuniao ataFamilia;
    private AnexoEstudante laudoMedico;
    private AnexoEstudante diagnosticoNeuro;
    private AnexoEstudante documentoPedagogico;
    private Atendimento atendimentoPedagogico;
    private Atendimento atendimentoPsicologico;
    private Notificacao notificacaoConvocacao;
    private AuditLog logPei;
    private AuditLog logLaudoSuperRestrito;

    @BeforeEach
    void setUp() {
        SecurityContextHolder.clearContext();
        fixedClock = Clock.fixed(Instant.parse("2026-11-23T13:00:00Z"), ZoneOffset.UTC);
        rbacGuard = new RbacGuard();

        AuditoriaService auditoriaService = new AuditoriaService(auditLogRepository, rbacGuard, fixedClock);
        dossieService = new DossieService(
                alunoRepository,
                estudoDeCasoRepository,
                planoAcaoRepository,
                peiRepository,
                peaRepository,
                atendimentoRepository,
                raiRepository,
                ataReuniaoRepository,
                anexoEstudanteRepository,
                indicacaoRepository,
                notificacaoRepository,
                auditLogRepository,
                auditoriaService,
                new EstudoDeCasoMapper(rbacGuard),
                new PlanoAcaoMapper(),
                new PeiMapper(),
                new PeaMapper(),
                new AtendimentoMapper(),
                rbacGuard,
                fixedClock
        );

        adminId = UUID.randomUUID();
        Usuario admin = new Usuario("Admin CLAI", "admin@sigi.ifpb.edu.br", "hash",
                Role.ADMIN, NivelRestricao.SUPER_RESTRICAO, true);
        admin.setId(adminId);
        admin.setAcessoAtivo(true);
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(admin, null, admin.getAuthorities())
        );

        alunoId = UUID.randomUUID();
        aluno = new Aluno("Mariana Costa", "20261001");
        aluno.setId(alunoId);
        aluno.setCurso("ADS");
        aluno.setTurma("2026.1");
        aluno.setStatus(StatusAluno.ATIVO);
        aluno.setAtualizadoEm(LocalDateTime.of(2026, 11, 20, 10, 0));

        estudo = new EstudoDeCaso(aluno, StatusEstudoCaso.ATIVO, "Dificuldade em interpretação de texto");
        estudo.setId(UUID.randomUUID());
        estudo.setHistoricoFamiliar("Histórico familiar sensível sigiloso");
        estudo.setHistoricoSocioemocional("Histórico socioemocional restrito");
        estudo.setCriadoEm(LocalDateTime.of(2026, 10, 1, 9, 0));
        estudo.setAtualizadoEm(LocalDateTime.of(2026, 10, 2, 11, 0));

        Acompanhamento acompanhamento = new Acompanhamento(aluno, LocalDate.of(2026, 10, 1));
        acompanhamento.setId(UUID.randomUUID());

        Pei pei = new Pei(acompanhamento, "2026.1", "Histórico escolar", "Tempo estendido",
                "Visual", "Leitura longa", "Provas adaptadas");
        pei.setId(UUID.randomUUID());
        pei.setCriadoEm(LocalDateTime.of(2026, 10, 5, 14, 0));

        atendimentoPedagogico = new Atendimento(aluno, TipoAtendimento.PEDAGOGICO,
                LocalDate.of(2026, 10, 10), "Prof. Ana", "Apoio em matemática", "Revisão semanal");
        atendimentoPedagogico.setId(UUID.randomUUID());
        atendimentoPedagogico.setCriadoEm(LocalDateTime.of(2026, 10, 10, 10, 0));

        atendimentoPsicologico = new Atendimento(aluno, TipoAtendimento.PSICOLOGICO,
                LocalDate.of(2026, 10, 12), "Dra. Helena", "Atendimento clínico confidencial", null);
        atendimentoPsicologico.setId(UUID.randomUUID());
        atendimentoPsicologico.setCriadoEm(LocalDateTime.of(2026, 10, 12, 15, 0));

        Rai rai = new Rai(alunoId, pei.getId(), acompanhamento.getId(), TipoRelatorio.RAI, 1, false, "Boa evolução");
        rai.setId(UUID.randomUUID());
        rai.setCriadoEm(LocalDateTime.of(2026, 10, 20, 16, 0));

        ataFamilia = new AtaReuniao(aluno, TipoReuniao.ALINHAMENTO_FAMILIA,
                LocalDateTime.of(2026, 11, 1, 14, 0), "Sala CLAI",
                "Alinhamento com responsáveis sobre adaptações", "Definido plano bimestral");
        ataFamilia.setId(UUID.randomUUID());
        ataFamilia.setCriadoEm(LocalDateTime.of(2026, 11, 1, 16, 0));

        laudoMedico = new AnexoEstudante(aluno, "laudo_neurologico.pdf", "application/pdf", 2048L,
                TipoClassificacaoAnexo.LAUDO_MEDICO, true, "path/laudo.enc", "iv-base64");
        laudoMedico.setId(UUID.randomUUID());

        diagnosticoNeuro = new AnexoEstudante(aluno, "diagnostico_neuropsicologico.pdf", "application/pdf", 4096L,
                TipoClassificacaoAnexo.DIAGNOSTICO_NEUROPSICOLOGICO, true, "path/diag.enc", "iv-base64-2");
        diagnosticoNeuro.setId(UUID.randomUUID());

        documentoPedagogico = new AnexoEstudante(aluno, "parecer_pedagogico.pdf", "application/pdf", 1024L,
                TipoClassificacaoAnexo.DOCUMENTO_PEDAGOGICO, false, "path/pedag.pdf", null);
        documentoPedagogico.setId(UUID.randomUUID());

        notificacaoConvocacao = new Notificacao(
                "COORDENADOR",
                "Convocação para reunião de alinhamento com família",
                "Convocação da família da estudante Mariana Costa (matrícula 20261001).",
                "/api/atas/" + ataFamilia.getId()
        );
        notificacaoConvocacao.setId(UUID.randomUUID());
        notificacaoConvocacao.setCriadoEm(LocalDateTime.of(2026, 10, 28, 9, 0));

        logPei = new AuditLog(adminId, "INSERCAO", "PEI", pei.getId(), "/api/peis", "POST",
                "httpStatus=201; alunoId=" + alunoId, LocalDateTime.of(2026, 10, 5, 14, 0));
        logPei.setId(UUID.randomUUID());

        logLaudoSuperRestrito = new AuditLog(adminId, "INSERCAO", "ANEXO_ESTUDANTE", laudoMedico.getId(),
                "/api/alunos/" + alunoId + "/anexos", "POST",
                "httpStatus=201; alunoId=" + alunoId + "; classificacao=LAUDO_MEDICO; nivelRestricao=SUPER_RESTRICAO",
                LocalDateTime.of(2026, 10, 15, 11, 0));
        logLaudoSuperRestrito.setId(UUID.randomUUID());

        lenient().when(alunoRepository.findById(alunoId)).thenReturn(Optional.of(aluno));
        lenient().when(estudoDeCasoRepository.findByAlunoId(alunoId)).thenReturn(List.of(estudo));
        lenient().when(planoAcaoRepository.findByAcompanhamento_Aluno_Id(alunoId)).thenReturn(List.of());
        lenient().when(peiRepository.findByAcompanhamento_Aluno_Id(alunoId)).thenReturn(List.of(pei));
        lenient().when(peaRepository.findByAcompanhamento_Aluno_Id(alunoId)).thenReturn(List.of());
        lenient().when(atendimentoRepository.findByAlunoId(alunoId))
                .thenReturn(List.of(atendimentoPedagogico, atendimentoPsicologico));
        lenient().when(raiRepository.findByAlunoIdOrderByCriadoEmAsc(alunoId)).thenReturn(List.of(rai));
        lenient().when(ataReuniaoRepository.findByAlunoId(alunoId)).thenReturn(List.of(ataFamilia));
        lenient().when(anexoEstudanteRepository.findByAlunoIdOrderByCriadoEmDesc(alunoId))
                .thenReturn(List.of(laudoMedico, diagnosticoNeuro, documentoPedagogico));
        lenient().when(indicacaoRepository.findByAlunoIdOrderByCriadoEmDesc(alunoId)).thenReturn(List.of());
        lenient().when(notificacaoRepository.findAll()).thenReturn(List.of(notificacaoConvocacao));
        lenient().when(auditLogRepository.save(any(AuditLog.class))).thenAnswer(inv -> inv.getArgument(0));
        lenient().when(auditLogRepository.buscarRelacionadosAoEstudante(anyCollection(), anyString()))
                .thenReturn(List.of(logPei, logLaudoSuperRestrito));
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("TA6.2: Escopo INTERNO deve compilar prontuário, atas, convocações, notificações, laudos e logs de auditoria")
    void deveCompilarDossieCompletoQuandoEscopoInterno() {
        DossieJuridicoResponseDTO dossie = dossieService.exportarDossie(alunoId, EscopoDossie.INTERNO, adminId);

        assertEquals(EscopoDossie.INTERNO, dossie.escopo());
        assertEquals(alunoId, dossie.alunoId());
        assertTrue(dossie.protocolo().startsWith("DOSSIE-INTERNO-"));
        assertNotNull(dossie.prontuario());
        assertEquals("Histórico familiar sensível sigiloso", dossie.prontuario().historicoFamiliar());
        assertEquals("Histórico socioemocional restrito", dossie.prontuario().historicoSocioemocional());
        assertEquals(1, dossie.atasReuniao().size());
        assertEquals(2, dossie.convocacoes().size());
        assertEquals(1, dossie.notificacoes().size());
        assertEquals(3, dossie.anexos().size());
        assertNotNull(dossie.laudosMedicos());
        assertEquals(2, dossie.laudosMedicos().size());
        assertEquals(2, dossie.atendimentos().size());
        assertEquals(2, dossie.logsAuditoria().size());
        verify(auditLogRepository).save(any(AuditLog.class));
    }

    @Test
    @DisplayName("TA6.4: Escopo EXTERNO deve omitir automaticamente laudos médicos, diagnósticos, histórico clínico e logs SUPER_RESTRICAO")
    void deveOmitirLaudosMedicosERegistrosSuperRestricaoQuandoEscopoExterno() {
        DossieJuridicoResponseDTO dossie = dossieService.exportarDossie(alunoId, EscopoDossie.EXTERNO, adminId);

        assertEquals(EscopoDossie.EXTERNO, dossie.escopo());
        assertNull(dossie.laudosMedicos(), "laudosMedicos deve ser omitido no escopo EXTERNO");
        assertEquals(1, dossie.anexos().size(), "Apenas DOCUMENTO_PEDAGOGICO deve permanecer no escopo EXTERNO");
        assertEquals(TipoClassificacaoAnexo.DOCUMENTO_PEDAGOGICO, dossie.anexos().getFirst().classificacao());
        assertEquals(1, dossie.prontuario().totalAnexos());
        assertNull(dossie.prontuario().historicoFamiliar());
        assertNull(dossie.prontuario().historicoSocioemocional());
        assertNull(dossie.estudosDeCaso().getFirst().historicoFamiliar());
        assertNull(dossie.estudosDeCaso().getFirst().historicoSocioemocional());
        assertEquals(1, dossie.atendimentos().size(), "Atendimento PSICOLOGICO clínico deve ser omitido no escopo EXTERNO");
        assertEquals(TipoAtendimento.PEDAGOGICO, dossie.atendimentos().getFirst().tipoAtendimento());
        assertEquals(1, dossie.logsAuditoria().size(), "Logs de anexos/dados SUPER_RESTRICAO devem ser omitidos no escopo EXTERNO");
        assertEquals("PEI", dossie.logsAuditoria().getFirst().entidade());
        assertEquals(1, dossie.atasReuniao().size());
        assertEquals(2, dossie.convocacoes().size());
    }

    @Test
    @DisplayName("TA6.3: AuditLog não herda BaseEntity/@SoftDelete, bloqueia update/remove e repositório não expõe métodos delete")
    void deveGarantirImutabilidadeDeAuditLogERepositoryAppendOnly() throws Exception {
        assertFalse(BaseEntity.class.isAssignableFrom(AuditLog.class),
                "AuditLog não deve estender BaseEntity");
        assertNull(AuditLog.class.getAnnotation(SoftDelete.class),
                "AuditLog não deve possuir @SoftDelete");
        assertNotNull(AuditLog.class.getAnnotation(Immutable.class),
                "AuditLog deve possuir @Immutable");

        boolean possuiMetodoDelete = Arrays.stream(AuditLogRepository.class.getMethods())
                .map(Method::getName)
                .anyMatch(nome -> nome.toLowerCase().contains("delete") || nome.toLowerCase().contains("remove"));
        assertFalse(possuiMetodoDelete, "AuditLogRepository não pode expor nenhum método de deleção (TA6.3)");

        Method preUpdate = AuditLog.class.getDeclaredMethod("impedirAtualizacao");
        preUpdate.setAccessible(true);
        Method preRemove = AuditLog.class.getDeclaredMethod("impedirExclusao");
        preRemove.setAccessible(true);

        var exUpdate = assertThrows(Exception.class, () -> preUpdate.invoke(logPei));
        assertInstanceOf(UnsupportedOperationException.class, exUpdate.getCause());

        var exRemove = assertThrows(Exception.class, () -> preRemove.invoke(logPei));
        assertInstanceOf(UnsupportedOperationException.class, exRemove.getCause());
    }

    @Test
    @DisplayName("Deve lançar NaoEncontradoException quando aluno não existir")
    void deveLancarNaoEncontradoParaAlunoInexistente() {
        UUID idInexistente = UUID.randomUUID();
        when(alunoRepository.findById(idInexistente)).thenReturn(Optional.empty());

        assertThrows(NaoEncontradoException.class,
                () -> dossieService.exportarDossie(idInexistente, EscopoDossie.INTERNO, adminId));
    }
}
