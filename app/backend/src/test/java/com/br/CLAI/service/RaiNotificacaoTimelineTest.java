package com.br.CLAI.service;

import com.br.CLAI.domain.Aluno;
import com.br.CLAI.domain.Acompanhamento;
import com.br.CLAI.domain.Atendimento;
import com.br.CLAI.domain.EstudoDeCaso;
import com.br.CLAI.domain.Notificacao;
import com.br.CLAI.domain.Pea;
import com.br.CLAI.domain.Pei;
import com.br.CLAI.domain.Rai;
import com.br.CLAI.domain.enums.StatusEstudoCaso;
import com.br.CLAI.domain.enums.TipoAtendimento;
import com.br.CLAI.domain.enums.TipoRelatorio;
import com.br.CLAI.dto.request.RaiRequestDTO;
import com.br.CLAI.dto.response.NotificacaoResponseDTO;
import com.br.CLAI.dto.response.RaiResponseDTO;
import com.br.CLAI.dto.response.TimelineEventDTO;
import com.br.CLAI.repository.AcompanhamentoRepository;
import com.br.CLAI.repository.AlunoRepository;
import com.br.CLAI.repository.AtendimentoRepository;
import com.br.CLAI.repository.EstudoDeCasoRepository;
import com.br.CLAI.repository.NotificacaoRepository;
import com.br.CLAI.repository.PeaRepository;
import com.br.CLAI.repository.PeiRepository;
import com.br.CLAI.repository.RaiRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("TA3.3 / TA9.2 - RAI, notificação ao COORDENADOR e Linha do Tempo")
class RaiNotificacaoTimelineTest {

    @Mock
    private RaiRepository raiRepository;
    @Mock
    private NotificacaoService notificacaoService;
    @Mock
    private NotificacaoRepository notificacaoRepository;
    @Mock
    private AlunoRepository alunoRepository;
    @Mock
    private PeiRepository peiRepository;
    @Mock
    private AcompanhamentoRepository acompanhamentoRepository;
    @Mock
    private EstudoDeCasoRepository estudoDeCasoRepository;
    @Mock
    private PeaRepository peaRepository;
    @Mock
    private AtendimentoRepository atendimentoRepository;

    @Test
    @DisplayName("TA3.3: RAI com indicativo de regressão gera notificação pendente para COORDENADOR revisar o PEI")
    void emitirRaiComRegressaoDeveNotificarCoordenador() {
        UUID alunoId = UUID.randomUUID();
        UUID raiId = UUID.randomUUID();
        UUID usuarioId = UUID.randomUUID();
        Aluno aluno = new Aluno("Estudante RAI", "2026009");
        aluno.setId(alunoId);

        when(alunoRepository.findById(alunoId)).thenReturn(Optional.of(aluno));
        when(raiRepository.save(any(Rai.class))).thenAnswer(invocation -> {
            Rai salvo = invocation.getArgument(0);
            salvo.setId(raiId);
            return salvo;
        });
        when(notificacaoService.criarNotificacao(anyString(), anyString(), anyString(), anyString()))
                .thenReturn(new NotificacaoResponseDTO());

        RaiService service = new RaiService(
                raiRepository, notificacaoService, alunoRepository, peiRepository, acompanhamentoRepository);

        RaiResponseDTO response = service.emitirRai(
                new RaiRequestDTO(alunoId, null, null, 2, true, "Queda no desempenho"), usuarioId);

        ArgumentCaptor<Rai> raiCaptor = ArgumentCaptor.forClass(Rai.class);
        verify(raiRepository).save(raiCaptor.capture());
        Rai raiSalvo = raiCaptor.getValue();

        assertEquals(raiId, response.getId());
        assertEquals(alunoId, raiSalvo.getAlunoId());
        assertEquals(2, raiSalvo.getBimestre());
        assertEquals(Boolean.TRUE, raiSalvo.getIndicativoRegressao());
        assertEquals(TipoRelatorio.RAI, raiSalvo.getTipoRelatorio());
        assertEquals(usuarioId, raiSalvo.getCriadoPor());

        verify(notificacaoService).criarNotificacao(
                eq("COORDENADOR"),
                contains("PEI"),
                contains("revisão do PEI"),
                contains("/api/peis/aluno/" + alunoId)
        );
    }

    @Test
    @DisplayName("TA3.3: RAE com regressão identifica o tipo no título da notificação")
    void emitirRaeComRegressaoDeveUsarTipoNoTituloDaNotificacao() {
        UUID alunoId = UUID.randomUUID();
        UUID usuarioId = UUID.randomUUID();
        Aluno aluno = new Aluno("Estudante RAE", "2026011");
        aluno.setId(alunoId);

        when(alunoRepository.findById(alunoId)).thenReturn(Optional.of(aluno));
        when(raiRepository.save(any(Rai.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(notificacaoService.criarNotificacao(anyString(), anyString(), anyString(), anyString()))
                .thenReturn(new NotificacaoResponseDTO());

        RaiService service = new RaiService(
                raiRepository, notificacaoService, alunoRepository, peiRepository, acompanhamentoRepository);

        RaiResponseDTO response = service.emitirRai(
                new RaiRequestDTO(alunoId, null, null, "RAE", 3, true, "Queda nas metas do PEI"), usuarioId);

        assertEquals(TipoRelatorio.RAE, response.getTipoRelatorio());
        ArgumentCaptor<String> tituloCaptor = ArgumentCaptor.forClass(String.class);
        verify(notificacaoService).criarNotificacao(
                eq("COORDENADOR"),
                tituloCaptor.capture(),
                contains("revisão do PEI"),
                contains("/api/peis/aluno/" + alunoId)
        );
        assertTrue(tituloCaptor.getValue().contains("RAE"));
        assertFalse(tituloCaptor.getValue().contains("no RAI"));
    }

    @Test
    @DisplayName("RAI sem indicativo de regressão não gera notificação")
    void emitirRaiSemRegressaoNaoDeveNotificar() {
        UUID alunoId = UUID.randomUUID();
        Aluno aluno = new Aluno("Estudante Sem Regressão", "2026010");
        aluno.setId(alunoId);

        when(alunoRepository.findById(alunoId)).thenReturn(Optional.of(aluno));
        when(raiRepository.save(any(Rai.class))).thenAnswer(invocation -> invocation.getArgument(0));

        RaiService service = new RaiService(
                raiRepository, notificacaoService, alunoRepository, peiRepository, acompanhamentoRepository);

        RaiResponseDTO response = service.emitirRai(
                new RaiRequestDTO(alunoId, null, null, 1, false, "Evolução estável"));

        assertFalse(response.getIndicativoRegressao());
        verifyNoInteractions(notificacaoService);
    }

    @Test
    @DisplayName("Notificação criada pela infraestrutura compartilhada nasce pendente (lida = false)")
    void criarNotificacaoDeveNascerPendente() {
        when(notificacaoRepository.save(any(Notificacao.class))).thenAnswer(invocation -> {
            Notificacao salva = invocation.getArgument(0);
            salva.setId(UUID.randomUUID());
            return salva;
        });

        NotificacaoService service = new NotificacaoService(notificacaoRepository);
        NotificacaoResponseDTO response = service.criarNotificacao(
                "coordenador", "Revisão de PEI", "Solicita-se revisão.", "/api/peis/aluno/123");

        ArgumentCaptor<Notificacao> captor = ArgumentCaptor.forClass(Notificacao.class);
        verify(notificacaoRepository).save(captor.capture());

        assertEquals("COORDENADOR", captor.getValue().getPerfilDestinatario());
        assertEquals(Boolean.FALSE, captor.getValue().getLida());
        assertEquals(response.getId(), captor.getValue().getId());
    }

    @Test
    @DisplayName("TA9.2/TA9.3: RAI e RAE são agregados à timeline em ordem cronológica")
    void timelineDeveIncluirRaiERaeEmOrdemCronologica() {
        UUID alunoId = UUID.randomUUID();
        Aluno aluno = new Aluno("Estudante Timeline RAI", "2026011");
        aluno.setId(alunoId);
        Acompanhamento acompanhamento = new Acompanhamento(aluno, LocalDate.of(2026, 1, 1));

        EstudoDeCaso estudo = new EstudoDeCaso(aluno, StatusEstudoCaso.ENCERRADO, "Diagnóstico");
        estudo.setId(UUID.randomUUID());
        estudo.setCriadoEm(LocalDateTime.of(2026, 1, 5, 12, 0));

        Pei pei = new Pei(acompanhamento, "Hab", "Prop");
        pei.setId(UUID.randomUUID());
        pei.setCriadoEm(LocalDateTime.of(2026, 1, 20, 12, 0));

        Rai raiAntigo = new Rai(alunoId, pei.getId(), acompanhamento.getId(), TipoRelatorio.RAI,
                1, false, "Primeiro RAI");
        raiAntigo.setId(UUID.randomUUID());
        raiAntigo.setCriadoEm(LocalDateTime.of(2026, 1, 2, 9, 0));

        Rai raeRecente = new Rai(alunoId, pei.getId(), acompanhamento.getId(), TipoRelatorio.RAE,
                2, false, "RAE do bimestre");
        raeRecente.setId(UUID.randomUUID());
        raeRecente.setCriadoEm(LocalDateTime.of(2026, 1, 10, 9, 0));

        when(estudoDeCasoRepository.findByAlunoId(alunoId)).thenReturn(List.of(estudo));
        when(peiRepository.findByAcompanhamento_Aluno_Id(alunoId)).thenReturn(List.of(pei));
        when(peaRepository.findByAcompanhamento_Aluno_Id(alunoId)).thenReturn(List.of());
        when(atendimentoRepository.findByAlunoId(alunoId)).thenReturn(List.of());
        // Retorno propositalmente fora de ordem: a ordenação é do TimelineService.
        when(raiRepository.findByAlunoId(alunoId)).thenReturn(List.of(raeRecente, raiAntigo));

        TimelineService timelineService = new TimelineService(
                estudoDeCasoRepository, peiRepository, peaRepository, atendimentoRepository, raiRepository);

        List<TimelineEventDTO> eventos = timelineService.buscarPorAluno(alunoId);

        assertEquals(
                List.of(raiAntigo.getId(), estudo.getId(), raeRecente.getId(), pei.getId()),
                eventos.stream().map(TimelineEventDTO::id).toList()
        );
        assertEquals(
                List.of("RAI", "ESTUDO_DE_CASO", "RAE", "PEI"),
                eventos.stream().map(TimelineEventDTO::tipo).toList()
        );
        assertNotNull(eventos);
        assertTrue(eventos.stream().anyMatch(e -> "RAE".equals(e.tipo())));
    }
}
