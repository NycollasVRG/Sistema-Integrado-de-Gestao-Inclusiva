package com.br.CLAI.service;

import com.br.CLAI.domain.AuditLog;
import com.br.CLAI.domain.Usuario;
import com.br.CLAI.repository.AuditLogRepository;
import com.br.CLAI.security.RbacGuard;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.time.Clock;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Serviço central de gravação na trilha imutável de auditoria ({@code sigi.audit_log} - US 06 / TA6.1).
 * Mantém coordenação por thread para evitar duplicidade entre {@code AuditoriaFilter} e {@code AuditoriaAspect}.
 */
@Service
public class AuditoriaService {

    private static final Pattern JWT_USER_ID_PATTERN =
            Pattern.compile("\"userId\"\\s*:\\s*\"([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})\"");

    private static final ThreadLocal<HttpAuditContext> HTTP_CONTEXT = new ThreadLocal<>();

    public record HttpAuditContext(String endpoint, String metodoHttp) {
    }

    private final AuditLogRepository auditLogRepository;
    private final RbacGuard rbacGuard;
    private final Clock clock;

    @Autowired
    public AuditoriaService(AuditLogRepository auditLogRepository, RbacGuard rbacGuard, Clock clock) {
        this.auditLogRepository = auditLogRepository;
        this.rbacGuard = rbacGuard != null ? rbacGuard : new RbacGuard();
        this.clock = clock != null ? clock : Clock.systemDefaultZone();
    }

    public AuditoriaService(AuditLogRepository auditLogRepository) {
        this(auditLogRepository, new RbacGuard(), Clock.systemDefaultZone());
    }

    public void iniciarContextoHttp(String endpoint, String metodoHttp) {
        HTTP_CONTEXT.set(new HttpAuditContext(endpoint, metodoHttp));
    }

    public void encerrarContextoHttp() {
        HTTP_CONTEXT.remove();
    }

    public boolean isContextoHttpAtivo() {
        return HTTP_CONTEXT.get() != null;
    }

    public HttpAuditContext getContextoHttpAtual() {
        return HTTP_CONTEXT.get();
    }

    public AuditLog registrar(
            UUID usuarioId,
            String acao,
            String entidade,
            UUID entidadeId,
            String endpoint,
            String metodoHttp,
            String detalhes
    ) {
        UUID usuarioResolvido = usuarioId != null ? usuarioId : resolverUsuarioAutenticadoId(null);

        AuditLog log = new AuditLog(
                usuarioResolvido,
                limitar(valorOuPadrao(acao, "OPERACAO"), 100),
                limitar(valorOuPadrao(entidade, "DOCUMENTO"), 100),
                entidadeId,
                limitar(valorOuPadrao(endpoint, "/internal"), 500),
                limitar(valorOuPadrao(metodoHttp, "SYSTEM"), 20),
                detalhes,
                LocalDateTime.now(clock)
        );
        return auditLogRepository.save(log);
    }

    public UUID resolverUsuarioAutenticadoId(String authorizationHeader) {
        UUID idPeloContexto = rbacGuard.getUsuarioAutenticado()
                .map(Usuario::getId)
                .orElse(null);
        if (idPeloContexto != null) {
            return idPeloContexto;
        }
        return extrairUserIdDeBearerToken(authorizationHeader);
    }

    private UUID extrairUserIdDeBearerToken(String authorizationHeader) {
        if (authorizationHeader == null || !authorizationHeader.startsWith("Bearer ")) {
            return null;
        }
        String token = authorizationHeader.substring(7).trim();
        String[] partes = token.split("\\.");
        if (partes.length < 2) {
            return null;
        }
        try {
            byte[] payloadBytes = Base64.getUrlDecoder().decode(partes[1]);
            String payloadJson = new String(payloadBytes, StandardCharsets.UTF_8);
            Matcher matcher = JWT_USER_ID_PATTERN.matcher(payloadJson);
            if (matcher.find()) {
                return UUID.fromString(matcher.group(1));
            }
        } catch (IllegalArgumentException ignored) {
            return null;
        }
        return null;
    }

    private String valorOuPadrao(String valor, String padrao) {
        return (valor == null || valor.isBlank()) ? padrao : valor.trim();
    }

    private String limitar(String valor, int max) {
        return valor.length() <= max ? valor : valor.substring(0, max);
    }
}
