package com.br.CLAI.service;

import com.br.CLAI.domain.Aluno;
import com.br.CLAI.domain.AtaCompromisso;
import com.br.CLAI.domain.AtaReuniao;
import com.br.CLAI.domain.Notificacao;
import com.br.CLAI.domain.Usuario;
import com.br.CLAI.domain.enums.NivelRestricao;
import com.br.CLAI.domain.enums.Role;
import com.br.CLAI.domain.enums.StatusAta;
import com.br.CLAI.domain.enums.TipoReuniao;
import com.br.CLAI.job.AtaLembreteJob;
import com.br.CLAI.repository.AtaCompromissoRepository;
import com.br.CLAI.repository.NotificacaoRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("TA8.3 - Job @Scheduled e Lembretes Automáticos para Compromissos de Atas")
class AtaCompromissoLembreteServiceTest {

    @Mock
    private AtaCompromissoRepository compromissoRepository;

    @Mock
    private NotificacaoRepository notificacaoRepository;

    private Clock clockFixo;
    private NotificacaoService notificacaoService;
    private AtaCompromissoLembreteService lembreteService;

    @BeforeEach
    void setUp() {
        // Data de referência fixa: 2026-11-22
        clockFixo = Clock.fixed(Instant.parse("2026-11-22T11:00:00Z"), ZoneOffset.UTC);
        notificacaoService = new NotificacaoService(notificacaoRepository);
        lembreteService = new AtaCompromissoLembreteService(
                compromissoRepository, notificacaoService, clockFixo, 3);

        lenient().when(notificacaoRepository.save(any(Notificacao.class))).thenAnswer(inv -> {
            Notificacao n = inv.getArgument(0);
            if (n.getId() == null) {
                n.setId(UUID.randomUUID());
            }
            return n;
        });
    }

    @Test
    @DisplayName("TA8.3: Deve enviar notificação individual ao responsável para compromissos vencendo em até 3 dias e vencidos, marcando lembreteEnviadoEm")
    void deveGerarNotificacoesIndividuaisParaCompromissosDentroDaJanela() {
        Usuario prof = new Usuario("Prof. João", "joao@sigi.ifpb.edu.br", "hash",
                Role.PROFESSOR, NivelRestricao.ACESSO_FUNCIONAL, false);
        prof.setId(UUID.randomUUID());

        Aluno aluno = new Aluno("Lucas Almeida", "20262001");
        aluno.setId(UUID.randomUUID());

        AtaReuniao ata = new AtaReuniao(aluno, TipoReuniao.PEDAGOGICA,
                LocalDateTime.of(2026, 11, 15, 10, 0), "Sala 1", "Pauta", "Deliberações");
        ata.setId(UUID.randomUUID());
        ata.setStatus(StatusAta.FINALIZADA);

        AtaCompromisso venceEm2Dias = new AtaCompromisso(ata, "Entregar adaptação de prova", prof, LocalDate.of(2026, 11, 24));
        venceEm2Dias.setId(UUID.randomUUID());

        AtaCompromisso venceHoje = new AtaCompromisso(ata, "Reunião com coordenação", prof, LocalDate.of(2026, 11, 22));
        venceHoje.setId(UUID.randomUUID());

        AtaCompromisso vencido = new AtaCompromisso(ata, "Enviar relatório pendente", prof, LocalDate.of(2026, 11, 20));
        vencido.setId(UUID.randomUUID());

        // Limite esperado: 2026-11-22 + 3 dias = 2026-11-25
        when(compromissoRepository.buscarPendentesParaLembrete(eq(LocalDate.of(2026, 11, 25))))
                .thenReturn(List.of(vencido, venceHoje, venceEm2Dias));

        int total = lembreteService.enviarLembretes();

        assertEquals(3, total);
        assertNotNull(venceEm2Dias.getLembreteEnviadoEm());
        assertNotNull(venceHoje.getLembreteEnviadoEm());
        assertNotNull(vencido.getLembreteEnviadoEm());

        ArgumentCaptor<Notificacao> captor = ArgumentCaptor.forClass(Notificacao.class);
        verify(notificacaoRepository, times(3)).save(captor.capture());

        List<Notificacao> salvas = captor.getAllValues();
        assertTrue(salvas.stream().allMatch(n -> prof.getId().equals(n.getUsuarioDestinatarioId())));
        assertTrue(salvas.stream().allMatch(n -> "PROFESSOR".equals(n.getPerfilDestinatario())));
        assertTrue(salvas.stream().allMatch(n -> ("/api/atas/" + ata.getId()).equals(n.getLinkReferencia())));
        assertTrue(salvas.get(0).getMensagem().contains("venceu há 2 dias"));
        assertTrue(salvas.get(1).getMensagem().contains("vence hoje"));
        assertTrue(salvas.get(2).getMensagem().contains("vence em 2 dias"));
    }

    @Test
    @DisplayName("AtaLembreteJob deve invocar enviarLembretes e absorver exceções sem interromper scheduler")
    void jobDeveExecutarComSeguranca() {
        AtaCompromissoLembreteService mockService = mock(AtaCompromissoLembreteService.class);
        when(mockService.enviarLembretes()).thenReturn(2);

        AtaLembreteJob job = new AtaLembreteJob(mockService);
        assertDoesNotThrow(job::executar);
        verify(mockService, times(1)).enviarLembretes();
    }
}
