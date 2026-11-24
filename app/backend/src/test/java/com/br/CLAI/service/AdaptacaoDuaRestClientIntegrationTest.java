package com.br.CLAI.service;

import com.br.CLAI.config.IaClientConfig;
import com.br.CLAI.domain.Aluno;
import com.br.CLAI.domain.IndicadorReutilizavel;
import com.br.CLAI.dto.request.AdaptacaoDuaRequestDTO;
import com.br.CLAI.dto.response.AdaptacaoDuaResponseDTO;
import com.br.CLAI.exception.IaIndisponivelException;
import com.br.CLAI.exception.IaTimeoutException;
import com.br.CLAI.repository.AlunoRepository;
import com.sun.net.httpserver.HttpServer;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.web.client.RestClient;

import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.time.Clock;
import java.util.LinkedHashSet;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicReference;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("US 07 - Cliente HTTP real Gemini: payload bruto (TA7.1), parsing JSON (TA7.4) e timeout/falhas (TA7.2)")
class AdaptacaoDuaRestClientIntegrationTest {

    private static final String TEST_MODEL = "gemini-3.5-flash-lite";
    private static final String TEST_API_KEY = "chave-teste-gemini-local";
    private static final String GEMINI_PATH = "/v1beta/models/" + TEST_MODEL + ":generateContent";

    private HttpServer servidor;
    private final AtomicReference<String> corpoRecebido = new AtomicReference<>();
    private final AtomicReference<String> headerApiKeyRecebido = new AtomicReference<>();
    private final AtomicReference<String> queryRecebida = new AtomicReference<>();
    private volatile long atrasoMs = 0;
    private volatile int statusResposta = 200;

    private AlunoRepository alunoRepository;
    private UUID alunoId;

    @BeforeEach
    void setUp() throws Exception {
        servidor = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        servidor.createContext(GEMINI_PATH, exchange -> {
            corpoRecebido.set(new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8));
            headerApiKeyRecebido.set(exchange.getRequestHeaders().getFirst("x-goog-api-key"));
            queryRecebida.set(exchange.getRequestURI().getQuery());
            try {
                Thread.sleep(atrasoMs);
            } catch (InterruptedException ignored) {
                Thread.currentThread().interrupt();
            }

            String geminiJson = """
                    {
                      "candidates": [
                        {
                          "content": {
                            "role": "model",
                            "parts": [
                              {
                                "text": "{\\"textoAdaptado\\":\\"Questão 1:\\\\n- [CALCULE] 2 + 2\\",\\"orientacoesAplicacao\\":[\\"Oferecer tempo adicional de 25%\\"],\\"complexidadePreservada\\":true,\\"questoesAdaptadas\\":[{\\"numero\\":1,\\"enunciadoOriginal\\":\\"Questão 1: calcule 2 + 2\\",\\"comandoDestacado\\":\\"CALCULE\\",\\"enunciadoFragmentado\\":[\\"Leia a operação\\",\\"Calcule 2 + 2\\"],\\"textoAdaptado\\":\\"Questão 1: [CALCULE] 2 + 2\\",\\"adaptacoesVisuaisAplicadas\\":[\\"Destaque de verbo de comando\\"]}]}"
                              }
                            ]
                          }
                        }
                      ]
                    }
                    """;

            byte[] resp = geminiJson.getBytes(StandardCharsets.UTF_8);
            exchange.getResponseHeaders().add("Content-Type", "application/json");
            try {
                exchange.sendResponseHeaders(statusResposta, statusResposta == 200 ? resp.length : -1);
                if (statusResposta == 200) {
                    exchange.getResponseBody().write(resp);
                }
            } catch (java.io.IOException ignored) {
                // cliente já encerrou por timeout
            } finally {
                exchange.close();
            }
        });
        servidor.start();

        alunoRepository = Mockito.mock(AlunoRepository.class);
        alunoId = UUID.randomUUID();
        Aluno aluno = new Aluno("Mariana Souza Costa", "20261001234");
        aluno.setId(alunoId);
        aluno.setTagsDificuldade(new LinkedHashSet<>(Set.of(
                new IndicadorReutilizavel("TDAH", "laudo médico CID F90 diagnóstico"))));
        Mockito.when(alunoRepository.findById(alunoId)).thenReturn(Optional.of(aluno));
    }

    @AfterEach
    void tearDown() {
        servidor.stop(0);
    }

    private AdaptacaoDuaService criarServico(int readTimeoutMs, String apiKey) {
        String baseUrl = "http://127.0.0.1:" + servidor.getAddress().getPort();
        RestClient restClient = new IaClientConfig().iaRestClient(baseUrl, 1000, readTimeoutMs);
        IaAdaptacaoDuaClient client = new RestClientIaAdaptacaoDuaClient(restClient, TEST_MODEL, apiKey);
        return new AdaptacaoDuaService(alunoRepository, client, Clock.systemDefaultZone());
    }

    @Test
    @DisplayName("Ref. TA7.1 + TA7.4: JSON enviado ao Gemini usa x-goog-api-key, responseSchema e omite PII/laudos")
    void jsonBrutoEnviadoAoGeminiNaoDeveConterDadosSensiveis() {
        AdaptacaoDuaResponseDTO resposta = criarServico(2000, TEST_API_KEY).adaptarProva(
                new AdaptacaoDuaRequestDTO(alunoId,
                        "Mariana Souza Costa (20261001234) CPF 123.456.789-09. Questão 1: calcule 2 + 2"));

        assertEquals(TEST_API_KEY, headerApiKeyRecebido.get());
        assertNull(queryRecebida.get(), "A API key não deve ser enviada na query string");

        String corpo = corpoRecebido.get().toLowerCase();
        assertTrue(corpo.contains("systeminstruction"));
        assertTrue(corpo.contains("responsemimetype"));
        assertTrue(corpo.contains("application/json"));
        assertTrue(corpo.contains("tdah"));
        assertTrue(corpo.contains("calcule 2 + 2"));

        // TA7.1: Data Minimization
        assertFalse(corpo.contains("mariana"));
        assertFalse(corpo.contains("souza"));
        assertFalse(corpo.contains("20261001234"));
        assertFalse(corpo.contains("123.456.789-09"));
        assertFalse(corpo.contains("laudo"));
        assertFalse(corpo.contains("diagn"));
        assertFalse(corpo.contains("alunoid"));
        assertFalse(corpo.contains(alunoId.toString()));

        // TA7.3 / TA7.4: Resposta estruturada do Gemini desserializada corretamente
        assertTrue(resposta.complexidadePreservada());
        assertEquals(1, resposta.questoesAdaptadas().size());
        assertEquals("CALCULE", resposta.questoesAdaptadas().getFirst().comandoDestacado());
        assertEquals(1, resposta.orientacoesAplicacao().size());
    }

    @Test
    @DisplayName("Ref. TA7.2: resposta do Gemini mais lenta que readTimeout gera IaTimeoutException")
    void timeoutDeveGerarIaTimeoutException() {
        atrasoMs = 1500;
        AdaptacaoDuaService servico = criarServico(300, TEST_API_KEY);

        assertThrows(IaTimeoutException.class,
                () -> servico.adaptarProva(new AdaptacaoDuaRequestDTO(alunoId, "Questão 1: calcule 2 + 2")));
    }

    @Test
    @DisplayName("Ref. TA7.2: HTTP 503 do Gemini gera IaIndisponivelException")
    void erro5xxDeveGerarIaIndisponivelException() {
        statusResposta = 503;
        AdaptacaoDuaService servico = criarServico(2000, TEST_API_KEY);

        assertThrows(IaIndisponivelException.class,
                () -> servico.adaptarProva(new AdaptacaoDuaRequestDTO(alunoId, "Questão 1: calcule 2 + 2")));
    }

    @Test
    @DisplayName("Ref. TA7.2: GEMINI_API_KEY ausente lança IaIndisponivelException (HTTP 503) em vez de 500")
    void apiKeyAusenteDeveGerarIaIndisponivelException() {
        AdaptacaoDuaService servico = criarServico(2000, "");

        IaIndisponivelException ex = assertThrows(IaIndisponivelException.class,
                () -> servico.adaptarProva(new AdaptacaoDuaRequestDTO(alunoId, "Questão 1: calcule 2 + 2")));
        assertTrue(ex.getMessage().contains("GEMINI_API_KEY"));
    }
}
