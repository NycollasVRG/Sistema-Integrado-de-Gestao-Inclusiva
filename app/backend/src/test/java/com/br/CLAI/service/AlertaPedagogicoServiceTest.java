package com.br.CLAI.service;

import com.br.CLAI.domain.Acompanhamento;
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
import com.br.CLAI.repository.AlertaPedagogicoRepository;
import com.br.CLAI.repository.AlunoRepository;
import com.br.CLAI.repository.PeaRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("US 05 - AlertaPedagogicoService: Motor de Análise SUAP x PEA/Tags (TA5.1 a TA5.4)")
class AlertaPedagogicoServiceTest {

    private static final ZoneId ZONA = ZoneId.of("America/Fortaleza");
    private static final LocalDateTime AGORA = LocalDateTime.of(2026, 11, 20, 14, 0);

    @Mock
    private AlertaPedagogicoRepository alertaRepository;

    @Mock
    private AlunoRepository alunoRepository;

    @Mock
    private PeaRepository peaRepository;

    @Mock
    private SuapBoletimClient suapBoletimClient;

    private AlertaPedagogicoService service;

    private UUID alunoId;
    private UUID gestorId;
    private Aluno aluno;

    @BeforeEach
    void setUp() {
        Clock clock = Clock.fixed(AGORA.atZone(ZONA).toInstant(), ZONA);
        service = new AlertaPedagogicoService(
                alertaRepository,
                alunoRepository,
                peaRepository,
                suapBoletimClient,
                clock
        );

        alunoId = UUID.randomUUID();
        gestorId = UUID.randomUUID();

        aluno = new Aluno("Lucas Gabriel", "2026100501");
        aluno.setId(alunoId);
        aluno.setCurso("Tecnologia em Sistemas para Internet");
        aluno.setTurma("2026.1");
    }

    private void configurarSaveRetornandoEntidadeComId() {
        when(alertaRepository.save(any(AlertaPedagogico.class))).thenAnswer(inv -> {
            AlertaPedagogico a = inv.getArgument(0);
            if (a.getId() == null) {
                a.setId(UUID.randomUUID());
            }
            return a;
        });
    }

    @Test
    @DisplayName("Ref. TA5.1: Retenção e risco de jubilamento no SUAP devem gerar alertas com severidade VERMELHO")
    void deveGerarAlertasVermelhosParaRetencaoERiscoDeJubilamento() {
        when(alunoRepository.findById(alunoId)).thenReturn(Optional.of(aluno));
        when(alertaRepository.existsByAluno_IdAndTipoAlertaAndDescricaoAndTratadoFalse(
                eq(alunoId), any(TipoAlertaPedagogico.class), anyString())).thenReturn(false);
        configurarSaveRetornandoEntidadeComId();

        SuapBoletimDTO boletim = new SuapBoletimDTO(
                alunoId,
                aluno.getMatricula(),
                "Campus João Pessoa",
                "Tecnologia em Sistemas para Internet",
                "2026.1",
                true,
                true,
                "RETIDO_IMINENCIA_JUBILAMENTO",
                List.of()
        );

        List<AlertaPedagogicoResponseDTO> alertas = service.analisarBoletim(boletim, gestorId);

        assertEquals(2, alertas.size());
        assertTrue(alertas.stream().allMatch(a -> a.severidade() == SeveridadeAlerta.VERMELHO));
        assertTrue(alertas.stream().anyMatch(a -> a.tipoAlerta() == TipoAlertaPedagogico.RETENCAO));
        assertTrue(alertas.stream().anyMatch(a -> a.tipoAlerta() == TipoAlertaPedagogico.RISCO_JUBILAMENTO));
        assertTrue(alertas.stream().allMatch(a -> Boolean.FALSE.equals(a.tratado())));
        assertEquals("Campus João Pessoa", alertas.get(0).unidade());
    }

    @Test
    @DisplayName("Ref. TA5.1 (via SuapBoletimClient): Situação acadêmica 'IMINENCIA_JUBILAMENTO' dispara alerta VERMELHO")
    void deveConsultarClienteSuapEDispararAlertaVermelho() {
        when(alunoRepository.findById(alunoId)).thenReturn(Optional.of(aluno));
        when(suapBoletimClient.consultarBoletimPorMatricula(aluno.getMatricula()))
                .thenReturn(Optional.of(new SuapBoletimDTO(
                        null,
                        aluno.getMatricula(),
                        "Campus Campina Grande",
                        null,
                        null,
                        false,
                        false,
                        "Iminência de Jubilamento",
                        List.of()
                )));
        when(alertaRepository.existsByAluno_IdAndTipoAlertaAndDescricaoAndTratadoFalse(
                eq(alunoId), eq(TipoAlertaPedagogico.RISCO_JUBILAMENTO), anyString())).thenReturn(false);
        configurarSaveRetornandoEntidadeComId();

        List<AlertaPedagogicoResponseDTO> alertas = service.analisarAlunoViaSuap(alunoId, gestorId);

        assertEquals(1, alertas.size());
        assertEquals(SeveridadeAlerta.VERMELHO, alertas.get(0).severidade());
        assertEquals(TipoAlertaPedagogico.RISCO_JUBILAMENTO, alertas.get(0).tipoAlerta());
        assertEquals("Campus Campina Grande", alertas.get(0).unidade());
        assertEquals(aluno.getCurso(), alertas.get(0).curso());
        assertEquals(aluno.getTurma(), alertas.get(0).turma());
    }

    @Test
    @DisplayName("Ref. TA5.2: Aluno com tag 'Não Alfabetizado' + nota máxima em disciplina teórica sem PEA dispara alerta PEDAGOGICO")
    void deveGerarAlertaPedagogicoParaNaoAlfabetizadoComNotaMaximaSemPea() {
        aluno.setTagsDificuldade(new LinkedHashSet<>(Set.of(
                new IndicadorReutilizavel("Não Alfabetizado", "Estudante em processo inicial de alfabetização")
        )));

        when(alunoRepository.findById(alunoId)).thenReturn(Optional.of(aluno));
        when(peaRepository.findByAcompanhamento_Aluno_Id(alunoId)).thenReturn(List.of());
        when(alertaRepository.existsByAluno_IdAndTipoAlertaAndDescricaoAndTratadoFalse(
                eq(alunoId), eq(TipoAlertaPedagogico.INCOERENCIA_PEDAGOGICA), anyString())).thenReturn(false);
        configurarSaveRetornandoEntidadeComId();

        SuapBoletimDTO boletim = new SuapBoletimDTO(
                alunoId,
                aluno.getMatricula(),
                "Campus João Pessoa",
                aluno.getCurso(),
                aluno.getTurma(),
                false,
                false,
                "REGULAR",
                List.of(
                        new SuapDisciplinaBoletimDTO(null, "Filosofia", true, BigDecimal.valueOf(100), BigDecimal.valueOf(100)),
                        new SuapDisciplinaBoletimDTO(null, "Educação Física Prática", false, BigDecimal.valueOf(100), BigDecimal.valueOf(100)),
                        new SuapDisciplinaBoletimDTO(null, "Sociologia", true, BigDecimal.valueOf(75), BigDecimal.valueOf(100))
                )
        );

        List<AlertaPedagogicoResponseDTO> alertas = service.analisarBoletim(boletim, gestorId);

        assertEquals(1, alertas.size());
        AlertaPedagogicoResponseDTO alerta = alertas.get(0);
        assertEquals(SeveridadeAlerta.PEDAGOGICO, alerta.severidade());
        assertEquals(TipoAlertaPedagogico.INCOERENCIA_PEDAGOGICA, alerta.tipoAlerta());
        assertTrue(alerta.descricao().contains("Filosofia"));
        assertTrue(alerta.descricao().contains("Não Alfabetizado"));
        assertFalse(alerta.tratado());
    }

    @Test
    @DisplayName("Ref. TA5.2: Aluno com tag 'Estágio Silábico' + nota 10 em disciplina teórica sem PEA dispara alerta PEDAGOGICO")
    void deveGerarAlertaPedagogicoParaEstagioSilabicoComNota10SemPea() {
        aluno.setTagsDificuldade(new LinkedHashSet<>(Set.of(
                new IndicadorReutilizavel("Estágio Silábico", "Estágio silábico de escrita")
        )));

        when(alunoRepository.findById(alunoId)).thenReturn(Optional.of(aluno));
        when(peaRepository.findByAcompanhamento_Aluno_Id(alunoId)).thenReturn(List.of());
        when(alertaRepository.existsByAluno_IdAndTipoAlertaAndDescricaoAndTratadoFalse(
                eq(alunoId), eq(TipoAlertaPedagogico.INCOERENCIA_PEDAGOGICA), anyString())).thenReturn(false);
        configurarSaveRetornandoEntidadeComId();

        SuapBoletimDTO boletim = new SuapBoletimDTO(
                alunoId,
                aluno.getMatricula(),
                "Campus Patos",
                aluno.getCurso(),
                aluno.getTurma(),
                false,
                false,
                "REGULAR",
                List.of(new SuapDisciplinaBoletimDTO("História Contemporânea", true, BigDecimal.TEN))
        );

        List<AlertaPedagogicoResponseDTO> alertas = service.analisarBoletim(boletim, gestorId);

        assertEquals(1, alertas.size());
        assertEquals(SeveridadeAlerta.PEDAGOGICO, alertas.get(0).severidade());
        assertEquals(TipoAlertaPedagogico.INCOERENCIA_PEDAGOGICA, alertas.get(0).tipoAlerta());
        assertTrue(alertas.get(0).descricao().contains("História Contemporânea"));
    }

    @Test
    @DisplayName("Ref. TA5.2: Não deve disparar alerta de incoerência quando existe PEA ativo para a disciplina teórica")
    void naoDeveGerarAlertaQuandoExistePeaCadastradoParaDisciplina() {
        aluno.setTagsDificuldade(new LinkedHashSet<>(Set.of(
                new IndicadorReutilizavel("Não Alfabetizado", "Não alfabetizado")
        )));

        Acompanhamento acomp = new Acompanhamento(aluno, LocalDate.of(2026, 2, 1));
        Pea peaFilosofia = new Pea();
        peaFilosofia.setAcompanhamento(acomp);
        peaFilosofia.setComponenteCurricular("Filosofia");

        when(alunoRepository.findById(alunoId)).thenReturn(Optional.of(aluno));
        when(peaRepository.findByAcompanhamento_Aluno_Id(alunoId)).thenReturn(List.of(peaFilosofia));

        SuapBoletimDTO boletim = new SuapBoletimDTO(
                alunoId,
                aluno.getMatricula(),
                "Campus João Pessoa",
                aluno.getCurso(),
                aluno.getTurma(),
                false,
                false,
                "REGULAR",
                List.of(new SuapDisciplinaBoletimDTO("Filosofia", true, BigDecimal.valueOf(100)))
        );

        List<AlertaPedagogicoResponseDTO> alertas = service.analisarBoletim(boletim, gestorId);

        assertTrue(alertas.isEmpty());
        verify(alertaRepository, never()).save(any());
    }

    @Test
    @DisplayName("Ref. TA5.4: Marcar alerta como tratado deve definir tratado=true, tratadoPor e tratadoEm")
    void marcarComoTratadoDeveAtualizarFlagAutorETimestamp() {
        UUID alertaId = UUID.randomUUID();
        AlertaPedagogico alerta = new AlertaPedagogico(
                aluno,
                TipoAlertaPedagogico.RETENCAO,
                SeveridadeAlerta.VERMELHO,
                "Campus João Pessoa",
                aluno.getCurso(),
                aluno.getTurma(),
                "Retenção detectada no SUAP"
        );
        alerta.setId(alertaId);

        when(alertaRepository.findById(alertaId)).thenReturn(Optional.of(alerta));
        when(alertaRepository.save(any(AlertaPedagogico.class))).thenAnswer(inv -> inv.getArgument(0));

        AlertaPedagogicoResponseDTO tratado = service.marcarComoTratado(alertaId, gestorId);

        assertTrue(tratado.tratado());
        assertEquals(gestorId, tratado.tratadoPor());
        assertEquals(AGORA, tratado.tratadoEm());
        verify(alertaRepository).save(alerta);
    }

    @Test
    @DisplayName("Buscar ou tratar alerta inexistente deve lançar NaoEncontradoException")
    void buscarOuTratarAlertaInexistenteDeveLancar404() {
        UUID idInexistente = UUID.randomUUID();
        when(alertaRepository.findById(idInexistente)).thenReturn(Optional.empty());

        assertThrows(NaoEncontradoException.class, () -> service.buscarPorId(idInexistente));
        assertThrows(NaoEncontradoException.class, () -> service.marcarComoTratado(idInexistente, gestorId));
        assertNotNull(service);
    }
}
