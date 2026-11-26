package com.br.CLAI.service;

import com.br.CLAI.domain.Aluno;
import com.br.CLAI.domain.IndicadorReutilizavel;
import com.br.CLAI.dto.request.AdaptacaoDuaRequestDTO;
import com.br.CLAI.dto.request.IaAdaptacaoDuaPayloadDTO;
import com.br.CLAI.dto.response.AdaptacaoDuaResponseDTO;
import com.br.CLAI.dto.response.IaAdaptacaoDuaResultadoDTO;
import com.br.CLAI.exception.NaoEncontradoException;
import com.br.CLAI.exception.RegraDeNegocioException;
import com.br.CLAI.repository.AlunoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.time.Clock;
import java.time.LocalDateTime;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Adaptação DUA de provas via IA (US 07 / Issue #108).
 * <ul>
 *     <li><b>TA7.1</b>: o payload enviado à IA contém apenas texto da prova (higienizado) e nomes das tags;</li>
 *     <li><b>TA7.2</b>: falhas/timeouts do cliente propagam exceções mapeadas para 504/503 (RFC 9457);</li>
 *     <li><b>TA7.4</b>: o prompt proíbe reduzir a complexidade e o resultado é validado quanto à preservação
 *     dos valores numéricos da prova original.</li>
 * </ul>
 */
@Service
public class AdaptacaoDuaService {

    static final String PROMPT_DUA = """
            Você é um assistente pedagógico especializado em Desenho Universal para a Aprendizagem (DUA).
            Adapte a prova fornecida considerando as tags de dificuldade informadas.
            REGRAS OBRIGATÓRIAS:
            1. Apenas FRAGMENTE enunciados longos em passos curtos e sequenciais.
            2. Ajuste SOMENTE a formatação visual (espaçamento, listas, negrito) e destaque o verbo de comando de cada questão, conforme as tags.
            3. NÃO reduza o nível de complexidade pedagógica: preserve todos os conceitos, dados numéricos, alternativas e o conteúdo avaliativo original.
            4. NÃO remova, simplifique nem responda questões; NÃO acrescente dicas ou respostas.
            5. Mantenha a ordem e a numeração originais das questões.
            """;

    private static final Pattern CPF = Pattern.compile("\\b\\d{3}\\.?\\d{3}\\.?\\d{3}-?\\d{2}\\b");
    private static final Pattern NUMERO = Pattern.compile("\\d+(?:[.,]\\d+)*");
    private static final int TAMANHO_MINIMO_PARTE_NOME = 4;

    private final AlunoRepository alunoRepository;
    private final IaAdaptacaoDuaClient iaClient;
    private final Clock clock;

    @Autowired
    public AdaptacaoDuaService(AlunoRepository alunoRepository, IaAdaptacaoDuaClient iaClient, Clock clock) {
        this.alunoRepository = alunoRepository;
        this.iaClient = iaClient;
        this.clock = clock != null ? clock : Clock.systemDefaultZone();
    }

    @Transactional(readOnly = true)
    public AdaptacaoDuaResponseDTO adaptarProva(AdaptacaoDuaRequestDTO dto) {
        Aluno aluno = alunoRepository.findById(dto.alunoId())
                .orElseThrow(() -> new NaoEncontradoException("Aluno não encontrado com o ID fornecido."));

        List<String> tags = resolverTagsAplicadas(dto, aluno);
        String textoHigienizado = higienizar(dto.textoProva(), aluno);

        IaAdaptacaoDuaPayloadDTO payload = new IaAdaptacaoDuaPayloadDTO(textoHigienizado, tags, PROMPT_DUA);
        IaAdaptacaoDuaResultadoDTO resultado = iaClient.solicitarAdaptacao(payload);

        if (resultado == null || resultado.textoAdaptado() == null || resultado.textoAdaptado().isBlank()) {
            throw new RegraDeNegocioException("A IA não retornou uma adaptação válida para a prova informada.");
        }

        boolean preservada = !Boolean.FALSE.equals(resultado.complexidadePreservada())
                && preservaValoresNumericos(textoHigienizado, resultado.textoAdaptado());

        return new AdaptacaoDuaResponseDTO(
                dto.textoProva(),
                resultado.textoAdaptado(),
                tags,
                resultado.orientacoesAplicacao() != null ? resultado.orientacoesAplicacao() : List.of(),
                resultado.questoesAdaptadas() != null ? resultado.questoesAdaptadas() : List.of(),
                preservada,
                PROMPT_DUA,
                LocalDateTime.now(clock)
        );
    }

    /**
     * TA7.1: somente nomes das tags (selecionadas pelo professor ou cadastradas no aluno),
     * higienizadas para nunca enviar identificadores pessoais ou laudos/diagnósticos.
     */
    private List<String> resolverTagsAplicadas(AdaptacaoDuaRequestDTO dto, Aluno aluno) {
        if (dto.tagsDificuldade() != null) {
            return dto.tagsDificuldade().stream()
                    .filter(n -> n != null && !n.isBlank())
                    .map(String::trim)
                    .map(tag -> higienizar(tag, aluno))
                    .filter(tag -> !tag.isBlank() && !"[DADO REMOVIDO]".equals(tag))
                    .distinct()
                    .toList();
        }
        return extrairNomesTags(aluno);
    }

    /** TA7.1: somente nomes das tags; nada de dados do aluno ou clínicos. */
    private List<String> extrairNomesTags(Aluno aluno) {
        Set<IndicadorReutilizavel> tags = aluno.getTagsDificuldade();
        if (tags == null) {
            return List.of();
        }
        return tags.stream()
                .map(IndicadorReutilizavel::getNome)
                .filter(n -> n != null && !n.isBlank())
                .map(String::trim)
                .toList();
    }

    /** Remove do texto da prova ocorrências acidentais de nome, matrícula e CPF. */
    String higienizar(String texto, Aluno aluno) {
        String resultado = CPF.matcher(texto).replaceAll("[DADO REMOVIDO]");
        if (aluno.getMatricula() != null && !aluno.getMatricula().isBlank()) {
            resultado = substituirIgnorandoCase(resultado, aluno.getMatricula().trim());
        }
        if (aluno.getNomeCompleto() != null && !aluno.getNomeCompleto().isBlank()) {
            resultado = substituirIgnorandoCase(resultado, aluno.getNomeCompleto().trim());
            for (String parte : aluno.getNomeCompleto().trim().split("\\s+")) {
                if (parte.length() >= TAMANHO_MINIMO_PARTE_NOME) {
                    resultado = substituirIgnorandoCase(resultado, parte);
                }
            }
        }
        return resultado;
    }

    private String substituirIgnorandoCase(String texto, String alvo) {
        return Pattern.compile(Pattern.quote(alvo), Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE)
                .matcher(texto)
                .replaceAll(Matcher.quoteReplacement("[DADO REMOVIDO]"));
    }

    /** TA7.4: todo valor numérico da prova original deve permanecer na versão adaptada. */
    boolean preservaValoresNumericos(String original, String adaptado) {
        Set<String> numerosAdaptado = extrairNumeros(adaptado);
        return numerosAdaptado.containsAll(extrairNumeros(original));
    }

    private Set<String> extrairNumeros(String texto) {
        Set<String> numeros = new LinkedHashSet<>();
        Matcher m = NUMERO.matcher(Normalizer.normalize(texto, Normalizer.Form.NFC).toLowerCase(Locale.ROOT));
        while (m.find()) {
            numeros.add(m.group());
        }
        return numeros;
    }
}
