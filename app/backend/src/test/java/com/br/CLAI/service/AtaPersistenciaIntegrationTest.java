package com.br.CLAI.service;

import com.br.CLAI.domain.Aluno;
import com.br.CLAI.domain.Usuario;
import com.br.CLAI.domain.enums.NivelRestricao;
import com.br.CLAI.domain.enums.Role;
import com.br.CLAI.domain.enums.StatusAluno;
import com.br.CLAI.domain.enums.StatusAta;
import com.br.CLAI.domain.enums.TipoReuniao;
import com.br.CLAI.dto.request.AtaAssinaturaRequestDTO;
import com.br.CLAI.dto.request.AtaAssinaturasRequestDTO;
import com.br.CLAI.dto.request.AtaCompromissoRequestDTO;
import com.br.CLAI.dto.request.AtaReuniaoRequestDTO;
import com.br.CLAI.dto.request.TermoAditivoRequestDTO;
import com.br.CLAI.dto.response.AtaReuniaoResponseDTO;
import com.br.CLAI.dto.response.NotificacaoResponseDTO;
import com.br.CLAI.dto.response.TimelineEventDTO;
import com.br.CLAI.exception.AcessoNegadoException;
import com.br.CLAI.repository.AlunoRepository;
import com.br.CLAI.repository.UsuarioRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@DisplayName("US 08 - Integração JPA/Service: Atas, Timeline (TA8.2), Lembretes (TA8.3) e Isolamento de Notificações")
class AtaPersistenciaIntegrationTest {

    @Autowired
    private AtaReuniaoService ataReuniaoService;

    @Autowired
    private AtaCompromissoLembreteService lembreteService;

    @Autowired
    private TimelineService timelineService;

    @Autowired
    private NotificacaoService notificacaoService;

    @Autowired
    private AlunoRepository alunoRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    private Usuario psicopedagogo;
    private Usuario professorResponsavel;
    private Usuario outroProfessor;
    private Aluno aluno;

    @BeforeEach
    void setUp() {
        String sufixo = UUID.randomUUID().toString().substring(0, 8);

        psicopedagogo = usuarioRepository.saveAndFlush(new Usuario(
                "Psico " + sufixo, "psico." + sufixo + "@sigi.ifpb.edu.br", "hash",
                Role.CLAI_PSICOPEDAGOGO, NivelRestricao.RESTRICAO_MODERADA, true
        ));

        professorResponsavel = usuarioRepository.saveAndFlush(new Usuario(
                "Prof Resp " + sufixo, "prof.resp." + sufixo + "@sigi.ifpb.edu.br", "hash",
                Role.PROFESSOR, NivelRestricao.ACESSO_FUNCIONAL, false
        ));

        outroProfessor = usuarioRepository.saveAndFlush(new Usuario(
                "Outro Prof " + sufixo, "prof.outro." + sufixo + "@sigi.ifpb.edu.br", "hash",
                Role.PROFESSOR, NivelRestricao.ACESSO_FUNCIONAL, false
        ));

        aluno = new Aluno("Estudante US08 " + sufixo, "MAT" + sufixo);
        aluno.setCurso("ADS");
        aluno.setTurma("2026.1");
        aluno.setStatus(StatusAluno.ATIVO);
        aluno.setAtivo(Boolean.TRUE);
        aluno = alunoRepository.saveAndFlush(aluno);
    }

    @Test
    @DisplayName("TA8.1 + TA8.2 + TA8.3 + TA8.4: fluxo ponta a ponta com persistência JPA, Timeline, lembrete idempotente e isolamento de notificações pessoais")
    void fluxoCompletoDeAtaTimelineLembreteETermoAditivo() {
        LocalDate prazoProximo = LocalDate.now().plusDays(2);
        LocalDate prazoDistante = LocalDate.now().plusDays(15);

        // 1. Cria ata com 2 compromissos (um dentro da janela de 3 dias, outro fora)
        AtaReuniaoResponseDTO criada = ataReuniaoService.criar(
                new AtaReuniaoRequestDTO(
                        aluno.getId(),
                        TipoReuniao.ALINHAMENTO_FAMILIA,
                        LocalDateTime.now().minusHours(1),
                        "Sala da CLAI",
                        "Alinhamento pedagógico e familiar",
                        "Acordada adaptação de materiais e revisão bimestral.",
                        List.of(
                                new AtaCompromissoRequestDTO(
                                        "Adaptar avaliação de Algoritmos",
                                        professorResponsavel.getId(),
                                        prazoProximo
                                ),
                                new AtaCompromissoRequestDTO(
                                        "Reunião de acompanhamento futuro",
                                        professorResponsavel.getId(),
                                        prazoDistante
                                )
                        )
                ),
                psicopedagogo.getId()
        );

        assertEquals(StatusAta.RASCUNHO, criada.status());
        assertEquals(2, criada.compromissos().size());

        // 2. TA8.2 / TA9.2: Ata aparece automaticamente na timeline do aluno com tipo ATA
        List<TimelineEventDTO> timeline = timelineService.buscarPorAluno(aluno.getId());
        assertTrue(timeline.stream().anyMatch(e -> criada.id().equals(e.id()) && "ATA".equals(e.tipo())));

        // 3. Enquanto está em RASCUNHO, o job de lembretes NÃO dispara notificação
        lembreteService.enviarLembretes();
        assertTrue(notificacaoService.buscarPorUsuario(professorResponsavel.getId(), false).isEmpty());

        // 4. TA8.1: Coleta assinaturas digitais e finaliza a ata
        ataReuniaoService.registrarAssinaturas(
                criada.id(),
                new AtaAssinaturasRequestDTO(List.of(
                        new AtaAssinaturaRequestDTO("Responsável Legal", "Mãe", null),
                        new AtaAssinaturaRequestDTO(psicopedagogo.getNome(), "Psicopedagoga", psicopedagogo.getId())
                )),
                psicopedagogo.getId(),
                "10.0.0.5"
        );

        AtaReuniaoResponseDTO finalizada = ataReuniaoService.finalizar(criada.id(), psicopedagogo.getId());
        assertEquals(StatusAta.FINALIZADA, finalizada.status());
        assertEquals(2, finalizada.assinaturas().size());

        // 5. TA8.3: Job gera exatamente 1 lembrete (apenas o compromisso dentro da janela de 3 dias)
        lembreteService.enviarLembretes();

        List<NotificacaoResponseDTO> minhasResp = notificacaoService.buscarPorUsuario(professorResponsavel.getId(), true);
        assertEquals(1, minhasResp.size());
        assertEquals(professorResponsavel.getId(), minhasResp.getFirst().getUsuarioDestinatarioId());
        assertTrue(minhasResp.getFirst().getMensagem().contains("Adaptar avaliação de Algoritmos"));

        // Segunda execução não duplica lembrete (idempotência via lembreteEnviadoEm)
        lembreteService.enviarLembretes();
        assertEquals(1, notificacaoService.buscarPorUsuario(professorResponsavel.getId(), false).size());

        // Isolamento: notificação pessoal não vaza para outro professor nem para busca genérica por perfil PROFESSOR
        assertTrue(notificacaoService.buscarPorUsuario(outroProfessor.getId(), false).isEmpty());
        assertTrue(notificacaoService.buscarPorPerfil("PROFESSOR", false).stream()
                .noneMatch(n -> minhasResp.getFirst().getId().equals(n.getId())));

        // Outro usuário não pode marcar notificação pessoal como lida
        UUID notifId = minhasResp.getFirst().getId();
        assertThrows(AcessoNegadoException.class,
                () -> notificacaoService.marcarComoLida(notifId, outroProfessor.getId()));
        NotificacaoResponseDTO lida = notificacaoService.marcarComoLida(notifId, professorResponsavel.getId());
        assertTrue(Boolean.TRUE.equals(lida.getLida()));

        // 6. TA8.4: Termo aditivo explicativo vinculado à ata finalizada persiste e retorna na busca
        ataReuniaoService.adicionarTermoAditivo(
                criada.id(),
                new TermoAditivoRequestDTO("Retificação: incluído apoio de monitoria semanal."),
                psicopedagogo.getId()
        );

        AtaReuniaoResponseDTO recarregada = ataReuniaoService.buscarPorId(criada.id());
        assertEquals(1, recarregada.termosAditivos().size());
        assertTrue(recarregada.termosAditivos().getFirst().texto().contains("monitoria semanal"));
    }
}
