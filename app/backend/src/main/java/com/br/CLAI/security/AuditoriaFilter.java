package com.br.CLAI.security;

import com.br.CLAI.service.AuditoriaService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.util.ContentCachingResponseWrapper;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Filtro HTTP automático e invisível de auditoria (US 06 / TA6.1).
 * Intercepta requisições {@code POST}, {@code PUT}, {@code PATCH} e {@code DELETE}
 * em recursos/documentos da API e grava o log correspondente em {@code sigi.audit_log}.
 */
@Component
public class AuditoriaFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(AuditoriaFilter.class);

    private static final Set<String> METODOS_AUDITADOS = Set.of("POST", "PUT", "PATCH", "DELETE");

    private static final Pattern UUID_PATTERN = Pattern.compile(
            "([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})"
    );
    private static final Pattern JSON_ID_PATTERN = Pattern.compile(
            "\"id\"\\s*:\\s*\"([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})\""
    );
    private static final Pattern JSON_ALUNO_ID_PATTERN = Pattern.compile(
            "\"alunoId\"\\s*:\\s*\"([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})\""
    );
    private static final Pattern JSON_CLASSIFICACAO_PATTERN = Pattern.compile(
            "\"classificacao\"\\s*:\\s*\"([A-Z_]+)\""
    );
    private static final Pattern ALUNO_PATH_PATTERN = Pattern.compile(
            "/api/alunos/([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})"
    );

    private final AuditoriaService auditoriaService;

    public AuditoriaFilter(AuditoriaService auditoriaService) {
        this.auditoriaService = auditoriaService;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String metodo = request.getMethod();
        if (metodo == null || !METODOS_AUDITADOS.contains(metodo.toUpperCase(Locale.ROOT))) {
            return true;
        }
        String uri = request.getRequestURI();
        if (uri == null || !uri.startsWith("/api/")) {
            return true;
        }
        return uri.startsWith("/api/auth/");
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        String metodo = request.getMethod().toUpperCase(Locale.ROOT);
        String endpoint = request.getRequestURI();
        String authorizationHeader = request.getHeader("Authorization");

        UUID usuarioAntes = auditoriaService.resolverUsuarioAutenticadoId(authorizationHeader);
        ContentCachingResponseWrapper responseWrapper = (response instanceof ContentCachingResponseWrapper existing)
                ? existing
                : new ContentCachingResponseWrapper(response);

        auditoriaService.iniciarContextoHttp(endpoint, metodo);
        try {
            filterChain.doFilter(request, responseWrapper);

            int status = responseWrapper.getStatus();
            if (status >= 200 && status < 300) {
                UUID usuarioId = usuarioAntes != null
                        ? usuarioAntes
                        : auditoriaService.resolverUsuarioAutenticadoId(authorizationHeader);

                String responseBody = extrairBodyTexto(responseWrapper);
                String entidade = resolverEntidade(endpoint);
                String acao = resolverAcao(metodo, endpoint);
                UUID entidadeId = resolverEntidadeId(endpoint, responseBody);
                String detalhes = construirDetalhes(request, endpoint, status, responseBody);

                try {
                    auditoriaService.registrar(usuarioId, acao, entidade, entidadeId, endpoint, metodo, detalhes);
                } catch (Exception ex) {
                    log.error("Falha ao registrar trilha de auditoria para {} {}: {}", metodo, endpoint, ex.getMessage(), ex);
                }
            }
        } finally {
            auditoriaService.encerrarContextoHttp();
            if (responseWrapper != response) {
                responseWrapper.copyBodyToResponse();
            }
        }
    }

    private String extrairBodyTexto(ContentCachingResponseWrapper responseWrapper) {
        byte[] content = responseWrapper.getContentAsByteArray();
        if (content.length == 0) {
            return "";
        }
        String contentType = responseWrapper.getContentType();
        if (contentType != null && !contentType.toLowerCase(Locale.ROOT).contains("json")
                && !contentType.toLowerCase(Locale.ROOT).contains("text")) {
            return "";
        }
        return new String(content, StandardCharsets.UTF_8);
    }

    private String resolverEntidade(String endpoint) {
        if (endpoint.contains("/anexos") || endpoint.contains("/laudos-medicos")) {
            return "ANEXO_ESTUDANTE";
        }
        if (endpoint.startsWith("/api/estudos-de-caso")) {
            return "ESTUDO_DE_CASO";
        }
        if (endpoint.startsWith("/api/peis")) {
            return "PEI";
        }
        if (endpoint.startsWith("/api/peas")) {
            return "PEA";
        }
        if (endpoint.startsWith("/api/planos-acao")) {
            return "PLANO_ACAO";
        }
        if (endpoint.startsWith("/api/atas")) {
            return "ATA_REUNIAO";
        }
        if (endpoint.startsWith("/api/atendimentos")) {
            return "ATENDIMENTO";
        }
        if (endpoint.startsWith("/api/rais")) {
            return "RAI";
        }
        if (endpoint.startsWith("/api/indicacoes")) {
            return "INDICACAO";
        }
        if (endpoint.startsWith("/api/notificacoes")) {
            return "NOTIFICACAO";
        }
        if (endpoint.startsWith("/api/indicadores")) {
            return "INDICADOR_REUTILIZAVEL";
        }
        if (endpoint.startsWith("/api/admin/usuarios")) {
            return "USUARIO";
        }
        if (endpoint.startsWith("/api/dashboard/alertas")) {
            return "ALERTA_PEDAGOGICO";
        }
        if (endpoint.startsWith("/api/alunos")) {
            return "ALUNO";
        }
        return "DOCUMENTO";
    }

    private String resolverAcao(String metodo, String endpoint) {
        return switch (metodo) {
            case "POST" -> {
                if (endpoint.startsWith("/api/notificacoes")) {
                    yield "DISPARO_NOTIFICACAO";
                }
                if (endpoint.endsWith("/finalizar")) {
                    yield "FINALIZACAO";
                }
                if (endpoint.endsWith("/assinaturas")) {
                    yield "ASSINATURA";
                }
                yield "INSERCAO";
            }
            case "PUT", "PATCH" -> "ATUALIZACAO";
            case "DELETE" -> "DELECAO";
            default -> metodo;
        };
    }

    private UUID resolverEntidadeId(String endpoint, String responseBody) {
        if (responseBody != null && !responseBody.isBlank()) {
            Matcher matcher = JSON_ID_PATTERN.matcher(responseBody);
            if (matcher.find()) {
                return UUID.fromString(matcher.group(1));
            }
        }
        UUID ultimoUuid = null;
        Matcher pathMatcher = UUID_PATTERN.matcher(endpoint);
        while (pathMatcher.find()) {
            ultimoUuid = UUID.fromString(pathMatcher.group(1));
        }
        return ultimoUuid;
    }

    private String construirDetalhes(
            HttpServletRequest request,
            String endpoint,
            int status,
            String responseBody
    ) {
        StringBuilder sb = new StringBuilder();
        sb.append("httpStatus=").append(status);

        String alunoId = extrairAlunoId(endpoint, responseBody);
        if (alunoId != null) {
            sb.append("; alunoId=").append(alunoId);
        }

        String classificacao = extrairClassificacao(request, responseBody);
        if (classificacao != null) {
            sb.append("; classificacao=").append(classificacao);
            if ("LAUDO_MEDICO".equals(classificacao) || "DIAGNOSTICO_NEUROPSICOLOGICO".equals(classificacao)) {
                sb.append("; nivelRestricao=SUPER_RESTRICAO");
            }
        }

        if (endpoint.contains("/permissoes-acesso") || endpoint.contains("/laudos-medicos")) {
            sb.append("; nivelRestricao=SUPER_RESTRICAO");
        }

        String query = request.getQueryString();
        if (query != null && !query.isBlank()) {
            sb.append("; query=").append(query);
        }

        return sb.toString();
    }

    private String extrairAlunoId(String endpoint, String responseBody) {
        if (responseBody != null && !responseBody.isBlank()) {
            Matcher jsonMatcher = JSON_ALUNO_ID_PATTERN.matcher(responseBody);
            if (jsonMatcher.find()) {
                return jsonMatcher.group(1);
            }
        }
        Matcher pathMatcher = ALUNO_PATH_PATTERN.matcher(endpoint);
        if (pathMatcher.find()) {
            return pathMatcher.group(1);
        }
        return null;
    }

    private String extrairClassificacao(HttpServletRequest request, String responseBody) {
        String param = request.getParameter("classificacao");
        if (param != null && !param.isBlank()) {
            return param.trim().toUpperCase(Locale.ROOT);
        }
        if (responseBody != null && !responseBody.isBlank()) {
            Matcher matcher = JSON_CLASSIFICACAO_PATTERN.matcher(responseBody);
            if (matcher.find()) {
                return matcher.group(1);
            }
        }
        return null;
    }
}
