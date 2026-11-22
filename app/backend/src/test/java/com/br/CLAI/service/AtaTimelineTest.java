package com.br.CLAI.service;

import com.br.CLAI.domain.Acompanhamento;
import com.br.CLAI.domain.Aluno;
import com.br.CLAI.domain.AtaReuniao;
import com.br.CLAI.domain.EstudoDeCaso;
import com.br.CLAI.domain.Pei;
import com.br.CLAI.domain.enums.StatusEstudoCaso;
import com.br.CLAI.domain.enums.TipoReuniao;
import com.br.CLAI.dto.response.TimelineEventDTO;
import com.br.CLAI.repository.AtaReuniaoRepository;
import com.br.CLAI.repository.AtendimentoRepository;
import com.br.CLAI.repository.EstudoDeCasoRepository;
import com.br.CLAI.repository.PeaRepository;
import com.br.CLAI.repository.PeiRepository;
import com.br.CLAI.repository.RaiRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("TA8.2 / TA9.2 - Integração de Atas de Reunião na Linha do Tempo do Estudante")
class AtaTimelineTest {

    @Mock
    private EstudoDeCasoRepository estudoDeCasoRepository;
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

    @Test
    @DisplayName("TA8.2 / TA9.2: Atas vinculadas ao alunoId aparecem em TimelineService com tipo ATA em ordem cronológica")
    void deveIncluirAtasNaTimelineEmOrdemCronologica() {
        UUID alunoId = UUID.randomUUID();
        Aluno aluno = new Aluno("Estudante Timeline Ata", "20263001");
        aluno.setId(alunoId);
        Acompanhamento acompanhamento = new Acompanhamento(aluno, LocalDate.of(2026, 1, 1));

        EstudoDeCaso estudo = new EstudoDeCaso(aluno, StatusEstudoCaso.ATIVO, "Diagnóstico");
        estudo.setId(UUID.randomUUID());
        estudo.setCriadoEm(LocalDateTime.of(2026, 2, 1, 10, 0));

        AtaReuniao ataMeio = new AtaReuniao(
                aluno, TipoReuniao.ALINHAMENTO_FAMILIA,
                LocalDateTime.of(2026, 2, 10, 14, 0), "Sala CLAI", "Pauta família", "Acordo");
        ataMeio.setId(UUID.randomUUID());
        ataMeio.setCriadoEm(LocalDateTime.of(2026, 2, 10, 15, 0));

        Pei pei = new Pei(acompanhamento, "Habilidades", "Propostas");
        pei.setId(UUID.randomUUID());
        pei.setCriadoEm(LocalDateTime.of(2026, 2, 20, 9, 0));

        when(estudoDeCasoRepository.findByAlunoId(alunoId)).thenReturn(List.of(estudo));
        when(peiRepository.findByAcompanhamento_Aluno_Id(alunoId)).thenReturn(List.of(pei));
        when(peaRepository.findByAcompanhamento_Aluno_Id(alunoId)).thenReturn(List.of());
        when(atendimentoRepository.findByAlunoId(alunoId)).thenReturn(List.of());
        when(raiRepository.findByAlunoId(alunoId)).thenReturn(List.of());
        when(ataReuniaoRepository.findByAlunoId(alunoId)).thenReturn(List.of(ataMeio));

        TimelineService timelineService = new TimelineService(
                estudoDeCasoRepository,
                peiRepository,
                peaRepository,
                atendimentoRepository,
                raiRepository,
                ataReuniaoRepository
        );

        List<TimelineEventDTO> eventos = timelineService.buscarPorAluno(alunoId);

        assertEquals(List.of(estudo.getId(), ataMeio.getId(), pei.getId()),
                eventos.stream().map(TimelineEventDTO::id).toList());
        assertEquals(List.of("ESTUDO_DE_CASO", "ATA", "PEI"),
                eventos.stream().map(TimelineEventDTO::tipo).toList());
    }
}
