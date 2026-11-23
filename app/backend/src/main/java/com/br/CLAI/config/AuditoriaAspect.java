package com.br.CLAI.config;

import com.br.CLAI.dto.response.NotificacaoResponseDTO;
import com.br.CLAI.service.AuditoriaService;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.AfterReturning;
import org.aspectj.lang.annotation.Aspect;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.lang.reflect.Method;
import java.util.Locale;
import java.util.UUID;

/**
 * Aspecto AOP de auditoria automática (US 06 / TA6.1).
 * <p>
 * Garante o registro em {@code sigi.audit_log} para:
 * <ul>
 *     <li>Disparos de notificações, convocações e alertas via {@code NotificacaoService}
 *     (inclusive disparos indiretos originados em {@code RaiService}, {@code IndicacaoService}
 *     ou jobs agendados como {@code AtaCompromissoLembreteService});</li>
 *     <li>Operações de escrita (inserção, atualização, deleção) em serviços de documentos
 *     quando executadas fora de uma requisição HTTP já auditada pelo {@code AuditoriaFilter}.</li>
 * </ul>
 */
@Aspect
@Component
public class AuditoriaAspect {

    private static final Logger log = LoggerFactory.getLogger(AuditoriaAspect.class);

    private final AuditoriaService auditoriaService;

    public AuditoriaAspect(AuditoriaService auditoriaService) {
        this.auditoriaService = auditoriaService;
    }

    @AfterReturning(
            pointcut = "execution(* com.br.CLAI.service.NotificacaoService.criarNotificacao*(..))",
            returning = "resultado"
    )
    public void auditarDisparoNotificacao(JoinPoint joinPoint, Object resultado) {
        AuditoriaService.HttpAuditContext httpCtx = auditoriaService.getContextoHttpAtual();
        // Quando a própria requisição HTTP já foi POST /api/notificacoes, o AuditoriaFilter registra a ação.
        if (httpCtx != null && httpCtx.endpoint() != null && httpCtx.endpoint().startsWith("/api/notificacoes")) {
            return;
        }

        try {
            UUID notificacaoId = null;
            String detalhes = "origem=" + joinPoint.getSignature().toShortString();

            if (resultado instanceof NotificacaoResponseDTO dto) {
                notificacaoId = dto.getId();
                detalhes = construirDetalhesNotificacao(dto);
            }

            String endpoint = (httpCtx != null && httpCtx.endpoint() != null)
                    ? httpCtx.endpoint()
                    : "/internal/notificacoes";
            String metodo = (httpCtx != null && httpCtx.metodoHttp() != null)
                    ? httpCtx.metodoHttp()
                    : "SYSTEM";

            auditoriaService.registrar(
                    null,
                    "DISPARO_NOTIFICACAO",
                    "NOTIFICACAO",
                    notificacaoId,
                    endpoint,
                    metodo,
                    detalhes
            );
        } catch (Exception ex) {
            log.error("Falha ao auditar disparo de notificação: {}", ex.getMessage(), ex);
        }
    }

    @AfterReturning(
            pointcut = "execution(* com.br.CLAI.service.*Service.criar*(..))"
                    + " || execution(* com.br.CLAI.service.*Service.atualizar*(..))"
                    + " || execution(* com.br.CLAI.service.*Service.excluir*(..))"
                    + " || execution(* com.br.CLAI.service.*Service.inativar*(..))"
                    + " || execution(* com.br.CLAI.service.*Service.emitir*(..))"
                    + " || execution(* com.br.CLAI.service.*Service.upload*(..))"
                    + " || execution(* com.br.CLAI.service.*Service.finalizar*(..))"
                    + " || execution(* com.br.CLAI.service.*Service.adicionarTermoAditivo*(..))"
                    + " || execution(* com.br.CLAI.service.*Service.registrarAssinaturas*(..))",
            returning = "resultado"
    )
    public void auditarOperacaoDocumentoForaDeFiltroHttp(JoinPoint joinPoint, Object resultado) {
        if (auditoriaService.isContextoHttpAtivo()) {
            return;
        }
        String className = joinPoint.getTarget().getClass().getSimpleName();
        if ("AuditoriaService".equals(className) || "NotificacaoService".equals(className) || "DossieService".equals(className)) {
            return;
        }

        try {
            String methodName = joinPoint.getSignature().getName();
            String acao = resolverAcaoPorMetodo(methodName);
            String metodoHttpEquivalente = resolverMetodoHttpEquivalente(acao);
            String entidade = resolverEntidadePorServico(className);
            UUID entidadeId = extrairIdDeRetornoOuArgs(resultado, joinPoint.getArgs());
            UUID alunoId = extrairAlunoIdDeRetorno(resultado);

            StringBuilder detalhes = new StringBuilder("origem=AOP; metodo=").append(className).append(".").append(methodName);
            if (alunoId != null) {
                detalhes.append("; alunoId=").append(alunoId);
            }

            auditoriaService.registrar(
                    null,
                    acao,
                    entidade,
                    entidadeId,
                    "/service/" + className + "/" + methodName,
                    metodoHttpEquivalente,
                    detalhes.toString()
            );
        } catch (Exception ex) {
            log.error("Falha ao auditar operação de serviço via AOP: {}", ex.getMessage(), ex);
        }
    }

    private String construirDetalhesNotificacao(NotificacaoResponseDTO dto) {
        StringBuilder sb = new StringBuilder();
        sb.append("perfilDestinatario=").append(dto.getPerfilDestinatario());
        if (dto.getUsuarioDestinatarioId() != null) {
            sb.append("; usuarioDestinatarioId=").append(dto.getUsuarioDestinatarioId());
        }
        if (dto.getTitulo() != null) {
            sb.append("; titulo=").append(dto.getTitulo());
        }
        if (dto.getLinkReferencia() != null) {
            sb.append("; linkReferencia=").append(dto.getLinkReferencia());
        }
        return sb.toString();
    }

    private String resolverAcaoPorMetodo(String methodName) {
        String lower = methodName.toLowerCase(Locale.ROOT);
        if (lower.startsWith("excluir") || lower.startsWith("inativar") || lower.startsWith("deletar")) {
            return "DELECAO";
        }
        if (lower.startsWith("atualizar") || lower.startsWith("reabrir")) {
            return "ATUALIZACAO";
        }
        if (lower.startsWith("finalizar")) {
            return "FINALIZACAO";
        }
        if (lower.startsWith("registrarassinaturas")) {
            return "ASSINATURA";
        }
        return "INSERCAO";
    }

    private String resolverMetodoHttpEquivalente(String acao) {
        return switch (acao) {
            case "DELECAO" -> "DELETE";
            case "ATUALIZACAO" -> "PUT";
            default -> "POST";
        };
    }

    private String resolverEntidadePorServico(String serviceClassName) {
        String base = serviceClassName.replace("Service", "");
        return switch (base) {
            case "EstudoDeCaso" -> "ESTUDO_DE_CASO";
            case "PlanoAcao" -> "PLANO_ACAO";
            case "AtaReuniao" -> "ATA_REUNIAO";
            case "AnexoEstudante" -> "ANEXO_ESTUDANTE";
            case "IndicadorReutilizavel" -> "INDICADOR_REUTILIZAVEL";
            case "AlertaPedagogico" -> "ALERTA_PEDAGOGICO";
            default -> base.toUpperCase(Locale.ROOT);
        };
    }

    private UUID extrairIdDeRetornoOuArgs(Object resultado, Object[] args) {
        UUID id = invocarGetterUuid(resultado, "id", "getId");
        if (id != null) {
            return id;
        }
        if (args != null) {
            for (Object arg : args) {
                if (arg instanceof UUID uuid) {
                    return uuid;
                }
            }
        }
        return null;
    }

    private UUID extrairAlunoIdDeRetorno(Object resultado) {
        return invocarGetterUuid(resultado, "alunoId", "getAlunoId");
    }

    private UUID invocarGetterUuid(Object target, String... methodNames) {
        if (target == null) {
            return null;
        }
        for (String name : methodNames) {
            try {
                Method method = target.getClass().getMethod(name);
                Object value = method.invoke(target);
                if (value instanceof UUID uuid) {
                    return uuid;
                }
            } catch (Exception ignored) {
                // Ignora caso o DTO não exponha o método
            }
        }
        return null;
    }
}
