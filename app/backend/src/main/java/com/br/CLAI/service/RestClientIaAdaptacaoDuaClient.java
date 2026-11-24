package com.br.CLAI.service;

import com.br.CLAI.dto.request.IaAdaptacaoDuaPayloadDTO;
import com.br.CLAI.dto.response.IaAdaptacaoDuaResultadoDTO;
import com.br.CLAI.exception.IaIndisponivelException;
import com.br.CLAI.exception.IaTimeoutException;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.ObjectMapper;

import java.net.SocketTimeoutException;
import java.net.http.HttpTimeoutException;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeoutException;

/**
 * Cliente HTTP oficial da API Google Gemini ({@code /v1beta/models/{model}:generateContent})
 * com timeouts explícitos (TA7.2) e saída JSON estruturada via {@code responseSchema} (TA7.4).
 */
@Component
public class RestClientIaAdaptacaoDuaClient implements IaAdaptacaoDuaClient {

    static final String MSG_TIMEOUT = "O serviço de inteligência artificial demorou mais que o esperado para adaptar "
            + "a avaliação. Tente novamente em instantes ou faça a adaptação manualmente.";
    static final String MSG_INDISPONIVEL = "O serviço de inteligência artificial está temporariamente indisponível. "
            + "Tente novamente mais tarde.";
    static final String MSG_CHAVE_AUSENTE = "A chave da API de inteligência artificial (GEMINI_API_KEY) não está configurada.";

    private static final String HEADER_API_KEY = "x-goog-api-key";
    private static final String GEMINI_PATH_TEMPLATE = "/v1beta/models/{model}:generateContent";

    private static final Map<String, Object> RESPONSE_SCHEMA = construirResponseSchema();

    private final RestClient restClient;
    private final String model;
    private final String apiKey;
    private final ObjectMapper objectMapper;

    public RestClientIaAdaptacaoDuaClient(
            @Qualifier("iaRestClient") RestClient restClient,
            @Value("${sigi.ia.model:gemini-3.5-flash-lite}") String model,
            @Value("${sigi.ia.api-key:}") String apiKey) {
        this.restClient = restClient;
        this.model = model;
        this.apiKey = apiKey;
        this.objectMapper = new ObjectMapper();
    }

    @Override
    public IaAdaptacaoDuaResultadoDTO solicitarAdaptacao(IaAdaptacaoDuaPayloadDTO payload) {
        if (apiKey == null || apiKey.isBlank()) {
            throw new IaIndisponivelException(MSG_CHAVE_AUSENTE, null);
        }

        Map<String, Object> requestBody = montarRequisicaoGemini(payload);

        try {
            GeminiResponse response = restClient.post()
                    .uri(GEMINI_PATH_TEMPLATE, model)
                    .header(HEADER_API_KEY, apiKey.trim())
                    .contentType(MediaType.APPLICATION_JSON)
                    .accept(MediaType.APPLICATION_JSON)
                    .body(requestBody)
                    .retrieve()
                    .body(GeminiResponse.class);

            String textoJson = extrairTextoResposta(response);
            return desserializarResultado(textoJson);
        } catch (IaIndisponivelException | IaTimeoutException ex) {
            throw ex;
        } catch (RestClientException ex) {
            // O Spring pode encapsular o timeout em ResourceAccessException (conexão) ou em
            // RestClientException genérico (leitura do corpo/cabeçalhos); a causa raiz decide o mapeamento.
            if (isTimeout(ex)) {
                throw new IaTimeoutException(MSG_TIMEOUT, ex);
            }
            throw new IaIndisponivelException(MSG_INDISPONIVEL, ex);
        }
    }

    private Map<String, Object> montarRequisicaoGemini(IaAdaptacaoDuaPayloadDTO payload) {
        String instrucaoSistema = payload.promptDua()
                + "\nRetorne EXCLUSIVAMENTE um objeto JSON válido seguindo o schema definido.";

        String tagsTexto = (payload.tagsDificuldade() == null || payload.tagsDificuldade().isEmpty())
                ? "Nenhuma tag específica informada (aplicar boas práticas gerais de DUA)"
                : String.join(", ", payload.tagsDificuldade());

        String mensagemUsuario = "Tags de dificuldade: " + tagsTexto
                + "\n\nTexto da prova para adaptação DUA:\n" + payload.textoProva();

        Map<String, Object> generationConfig = new LinkedHashMap<>();
        generationConfig.put("temperature", 0.2);
        generationConfig.put("responseMimeType", "application/json");
        generationConfig.put("responseSchema", RESPONSE_SCHEMA);

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("systemInstruction", Map.of("parts", List.of(Map.of("text", instrucaoSistema))));
        body.put("contents", List.of(Map.of(
                "role", "user",
                "parts", List.of(Map.of("text", mensagemUsuario))
        )));
        body.put("generationConfig", generationConfig);
        return body;
    }

    private String extrairTextoResposta(GeminiResponse response) {
        if (response == null || response.candidates() == null || response.candidates().isEmpty()) {
            throw new IaIndisponivelException(MSG_INDISPONIVEL, null);
        }
        GeminiCandidate primeiro = response.candidates().getFirst();
        if (primeiro == null || primeiro.content() == null || primeiro.content().parts() == null
                || primeiro.content().parts().isEmpty()) {
            throw new IaIndisponivelException(MSG_INDISPONIVEL, null);
        }
        String texto = primeiro.content().parts().getFirst().text();
        if (texto == null || texto.isBlank()) {
            throw new IaIndisponivelException(MSG_INDISPONIVEL, null);
        }
        return limparCercasMarkdown(texto);
    }

    private String limparCercasMarkdown(String texto) {
        String limpo = texto.trim();
        if (limpo.startsWith("```")) {
            int primeiraQuebra = limpo.indexOf('\n');
            if (primeiraQuebra > 0) {
                limpo = limpo.substring(primeiraQuebra + 1);
            }
            if (limpo.endsWith("```")) {
                limpo = limpo.substring(0, limpo.length() - 3);
            }
        }
        return limpo.trim();
    }

    private IaAdaptacaoDuaResultadoDTO desserializarResultado(String textoJson) {
        try {
            IaAdaptacaoDuaResultadoDTO resultado = objectMapper.readValue(textoJson, IaAdaptacaoDuaResultadoDTO.class);
            if (resultado == null) {
                throw new IaIndisponivelException(MSG_INDISPONIVEL, null);
            }
            return resultado;
        } catch (JacksonException ex) {
            throw new IaIndisponivelException(MSG_INDISPONIVEL, ex);
        }
    }

    private boolean isTimeout(Throwable ex) {
        for (Throwable t = ex; t != null; t = t.getCause()) {
            if (t instanceof SocketTimeoutException || t instanceof HttpTimeoutException
                    || t instanceof TimeoutException) {
                return true;
            }
            if (t.getCause() == t) {
                break;
            }
        }
        return false;
    }

    private static Map<String, Object> construirResponseSchema() {
        Map<String, Object> questaoProperties = new LinkedHashMap<>();
        questaoProperties.put("numero", Map.of("type", "INTEGER"));
        questaoProperties.put("enunciadoOriginal", Map.of("type", "STRING"));
        questaoProperties.put("comandoDestacado", Map.of("type", "STRING"));
        questaoProperties.put("enunciadoFragmentado", Map.of("type", "ARRAY", "items", Map.of("type", "STRING")));
        questaoProperties.put("textoAdaptado", Map.of("type", "STRING"));
        questaoProperties.put("adaptacoesVisuaisAplicadas", Map.of("type", "ARRAY", "items", Map.of("type", "STRING")));

        Map<String, Object> questaoSchema = new LinkedHashMap<>();
        questaoSchema.put("type", "OBJECT");
        questaoSchema.put("properties", questaoProperties);
        questaoSchema.put("required", List.of(
                "numero", "enunciadoOriginal", "comandoDestacado",
                "enunciadoFragmentado", "textoAdaptado", "adaptacoesVisuaisAplicadas"
        ));

        Map<String, Object> rootProperties = new LinkedHashMap<>();
        rootProperties.put("textoAdaptado", Map.of(
                "type", "STRING",
                "description", "Texto completo da prova adaptada em DUA contendo TODAS as questões adaptadas, "
                        + "todos os dados numéricos originais e alternativas (não retornar apenas um resumo)."
        ));
        rootProperties.put("orientacoesAplicacao", Map.of("type", "ARRAY", "items", Map.of("type", "STRING")));
        rootProperties.put("complexidadePreservada", Map.of("type", "BOOLEAN"));
        rootProperties.put("questoesAdaptadas", Map.of("type", "ARRAY", "items", questaoSchema));

        Map<String, Object> schema = new LinkedHashMap<>();
        schema.put("type", "OBJECT");
        schema.put("properties", rootProperties);
        schema.put("required", List.of(
                "textoAdaptado", "orientacoesAplicacao", "complexidadePreservada", "questoesAdaptadas"
        ));
        return schema;
    }

    private record GeminiResponse(List<GeminiCandidate> candidates) {
    }

    private record GeminiCandidate(GeminiContent content) {
    }

    private record GeminiContent(List<GeminiPart> parts) {
    }

    private record GeminiPart(String text) {
    }
}
