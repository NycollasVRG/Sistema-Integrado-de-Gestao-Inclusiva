package com.br.CLAI.service;

import com.br.CLAI.domain.Aluno;
import com.br.CLAI.domain.IndicadorReutilizavel;
import com.br.CLAI.dto.request.AdaptacaoDuaRequestDTO;
import com.br.CLAI.dto.request.IaAdaptacaoDuaPayloadDTO;
import com.br.CLAI.dto.response.AdaptacaoDuaResponseDTO;
import com.br.CLAI.dto.response.IaAdaptacaoDuaResultadoDTO;
import com.br.CLAI.exception.IaTimeoutException;
import com.br.CLAI.exception.NaoEncontradoException;
import com.br.CLAI.repository.AlunoRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Clock;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("US 07 - AdaptacaoDuaService: Minimização de Dados, Timeout e Preservação de Complexidade")
class AdaptacaoDuaServiceTest {

    @Mock
    private AlunoRepository alunoRepository;

    @Mock
    private IaAdaptacaoDuaClient iaClient;

    private AdaptacaoDuaService service;
    private Aluno aluno;
    private UUID alunoId;

    @BeforeEach
    void setUp() {
        service = new AdaptacaoDuaService(alunoRepository, iaClient, Clock.systemDefaultZone());
        alunoId = UUID.randomUUID();
        aluno = new Aluno("Mariana Souza Costa", "20261001234");
        aluno.setId(alunoId);
        aluno.setCurso("Informática");
        aluno.setTurma("2026.1");
        aluno.setTagsDificuldade(new LinkedHashSet<>(Set.of(
                new IndicadorReutilizavel("TDAH", "Transtorno de déficit de atenção - laudo CID F90"))));
        Mockito.lenient().when(alunoRepository.findById(alunoId)).thenReturn(Optional.of(aluno));
    }

    @Test
    @DisplayName("Ref. TA7.1: payload enviado à IA não contém nome, matrícula, CPF nem diagnóstico/laudo")
    void payloadNaoDeveConterDadosIdentificaveisNemDiagnosticos() {
        when(iaClient.solicitarAdaptacao(any())).thenReturn(
                new IaAdaptacaoDuaResultadoDTO("Questão 1: calcule 2 + 2", List.of(), List.of(), true));

        String prova = "Aluna Mariana Souza Costa, matrícula 20261001234, CPF 123.456.789-09. Questão 1: calcule 2 + 2";
        service.adaptarProva(new AdaptacaoDuaRequestDTO(alunoId, prova));

        ArgumentCaptor<IaAdaptacaoDuaPayloadDTO> captor = ArgumentCaptor.forClass(IaAdaptacaoDuaPayloadDTO.class);
        verify(iaClient).solicitarAdaptacao(captor.capture());
        IaAdaptacaoDuaPayloadDTO payload = captor.getValue();

        String serializado = payload.toString().toLowerCase();
        assertEquals(List.of("TDAH"), payload.tagsDificuldade());
        assertFalse(serializado.contains("mariana"));
        assertFalse(serializado.contains("souza"));
        assertFalse(serializado.contains("20261001234"));
        assertFalse(serializado.contains("123.456.789-09"));
        assertFalse(serializado.contains("laudo"));
        assertFalse(java.util.regex.Pattern.compile("\\bcid\\b").matcher(serializado).find());
        assertFalse(serializado.contains(alunoId.toString()));
        assertTrue(payload.textoProva().contains("calcule 2 + 2"));
    }

    @Test
    @DisplayName("Ref. TA7.4: prompt proíbe reduzir complexidade e limita a fragmentação/formatação")
    void promptDeveExigirPreservacaoDeComplexidade() {
        when(iaClient.solicitarAdaptacao(any())).thenReturn(
                new IaAdaptacaoDuaResultadoDTO("Questão 1: calcule 2 + 2", List.of(), List.of(), true));

        service.adaptarProva(new AdaptacaoDuaRequestDTO(alunoId, "Questão 1: calcule 2 + 2"));

        ArgumentCaptor<IaAdaptacaoDuaPayloadDTO> captor = ArgumentCaptor.forClass(IaAdaptacaoDuaPayloadDTO.class);
        verify(iaClient).solicitarAdaptacao(captor.capture());
        String prompt = captor.getValue().promptDua();
        assertTrue(prompt.contains("FRAGMENTE"));
        assertTrue(prompt.contains("formatação visual"));
        assertTrue(prompt.contains("NÃO reduza o nível de complexidade"));
    }

    @Test
    @DisplayName("Ref. TA7.4: resposta que altera valores numéricos da prova é marcada como complexidade NÃO preservada")
    void deveSinalizarQuandoValoresNumericosForemAlterados() {
        when(iaClient.solicitarAdaptacao(any())).thenReturn(
                new IaAdaptacaoDuaResultadoDTO("Questão 1: calcule 2 + 3", List.of(), List.of(), true));

        AdaptacaoDuaResponseDTO resposta =
                service.adaptarProva(new AdaptacaoDuaRequestDTO(alunoId, "Questão 1: calcule 2 + 25"));

        assertFalse(resposta.complexidadePreservada());
    }

    @Test
    @DisplayName("Ref. TA7.4: adaptação que apenas fragmenta mantém complexidadePreservada = true")
    void deveManterComplexidadePreservadaQuandoApenasFragmenta() {
        when(iaClient.solicitarAdaptacao(any())).thenReturn(
                new IaAdaptacaoDuaResultadoDTO("Questão 1:\n- Passo 1: some 2\n- Passo 2: some 25", List.of(), List.of(), true));

        AdaptacaoDuaResponseDTO resposta =
                service.adaptarProva(new AdaptacaoDuaRequestDTO(alunoId, "Questão 1: some 2 e 25"));

        assertTrue(resposta.complexidadePreservada());
        assertEquals(List.of("TDAH"), resposta.tagsDificuldadeAplicadas());
    }

    @Test
    @DisplayName("Ref. TA7.2: timeout do cliente de IA propaga IaTimeoutException ao controller advice")
    void timeoutDeveSerPropagado() {
        when(iaClient.solicitarAdaptacao(any())).thenThrow(new IaTimeoutException("timeout", null));

        assertThrows(IaTimeoutException.class,
                () -> service.adaptarProva(new AdaptacaoDuaRequestDTO(alunoId, "Questão 1")));
    }

    @Test
    @DisplayName("Aluno inexistente deve lançar NaoEncontradoException")
    void alunoInexistente() {
        UUID outro = UUID.randomUUID();
        when(alunoRepository.findById(outro)).thenReturn(Optional.empty());

        assertThrows(NaoEncontradoException.class,
                () -> service.adaptarProva(new AdaptacaoDuaRequestDTO(outro, "Questão 1")));
    }

    @Test
    @DisplayName("Ref. TA7.1: quando tagsDificuldade são selecionadas no request, usa apenas os nomes selecionados higienizados")
    void deveUsarTagsSelecionadasNoRequestHigienizadas() {
        when(iaClient.solicitarAdaptacao(any())).thenReturn(
                new IaAdaptacaoDuaResultadoDTO("Questão 1: calcule 2 + 2", List.of(), List.of(), true));

        AdaptacaoDuaResponseDTO resposta = service.adaptarProva(
                new AdaptacaoDuaRequestDTO(alunoId, "Questão 1: calcule 2 + 2", List.of("Dislexia", "Baixa Visão"))
        );

        ArgumentCaptor<IaAdaptacaoDuaPayloadDTO> captor = ArgumentCaptor.forClass(IaAdaptacaoDuaPayloadDTO.class);
        verify(iaClient).solicitarAdaptacao(captor.capture());

        assertEquals(List.of("Dislexia", "Baixa Visão"), captor.getValue().tagsDificuldade());
        assertEquals(List.of("Dislexia", "Baixa Visão"), resposta.tagsDificuldadeAplicadas());
    }
}
