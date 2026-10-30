package com.br.CLAI.handler;

import com.br.CLAI.exception.AcessoNegadoException;
import com.br.CLAI.exception.ConflitoException;
import com.br.CLAI.exception.NaoEncontradoException;
import com.br.CLAI.exception.RegraDeNegocioException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.AuthenticationCredentialsNotFoundException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.InsufficientAuthenticationException;
import org.springframework.security.authentication.LockedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.net.URI;
import java.time.Instant;
import java.util.stream.Collectors;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(NaoEncontradoException.class)
    public ProblemDetail handleNaoEncontradoException(NaoEncontradoException ex) {
        ProblemDetail problemDetail = ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, ex.getMessage());
        problemDetail.setTitle("Recurso Não Encontrado");
        problemDetail.setType(URI.create("https://api.sigi.com/errors/nao-encontrado"));
        problemDetail.setProperty("timestamp", Instant.now());
        return problemDetail;
    }

    @ExceptionHandler({AcessoNegadoException.class, AccessDeniedException.class})
    public ProblemDetail handleAcessoNegadoException(RuntimeException ex) {
        String detail = ex.getMessage();
        if (detail == null || detail.isBlank() || "Access Denied".equalsIgnoreCase(detail.trim())) {
            detail = "Seu perfil não possui permissão para acessar este recurso.";
        }

        ProblemDetail problemDetail = ProblemDetail.forStatusAndDetail(HttpStatus.FORBIDDEN, detail);
        problemDetail.setTitle("Acesso Negado");
        problemDetail.setType(URI.create("https://api.sigi.com/errors/acesso-negado"));
        problemDetail.setProperty("timestamp", Instant.now());
        return problemDetail;
    }

    @ExceptionHandler({DisabledException.class, LockedException.class})
    public ProblemDetail handleContaRevogadaException(AuthenticationException ex) {
        ProblemDetail problemDetail = ProblemDetail.forStatusAndDetail(
                HttpStatus.UNAUTHORIZED,
                "Acesso revogado: o vínculo deste usuário encontra-se desativado."
        );
        problemDetail.setTitle("Sessão Revogada");
        problemDetail.setType(URI.create("https://api.sigi.com/errors/sessao-revogada"));
        problemDetail.setProperty("timestamp", Instant.now());
        return problemDetail;
    }

    @ExceptionHandler({AuthenticationCredentialsNotFoundException.class, InsufficientAuthenticationException.class})
    public ProblemDetail handleAutenticacaoAusenteException(AuthenticationException ex) {
        String detail = (ex.getMessage() != null && !ex.getMessage().isBlank())
                ? ex.getMessage()
                : "Autenticação obrigatória para acessar este recurso.";

        ProblemDetail problemDetail = ProblemDetail.forStatusAndDetail(HttpStatus.UNAUTHORIZED, detail);
        problemDetail.setTitle("Não Autorizado");
        problemDetail.setType(URI.create("https://api.sigi.com/errors/nao-autorizado"));
        problemDetail.setProperty("timestamp", Instant.now());
        return problemDetail;
    }

    @ExceptionHandler(AuthenticationException.class)
    public ProblemDetail handleAuthenticationException(AuthenticationException ex) {
        ProblemDetail problemDetail = ProblemDetail.forStatusAndDetail(
                HttpStatus.UNAUTHORIZED,
                "Credenciais inválidas: e-mail ou senha incorretos."
        );
        problemDetail.setTitle("Falha na Autenticação");
        problemDetail.setType(URI.create("https://api.sigi.com/errors/falha-autenticacao"));
        problemDetail.setProperty("timestamp", Instant.now());
        return problemDetail;
    }

    @ExceptionHandler(RegraDeNegocioException.class)
    public ProblemDetail handleRegraDeNegocioException(RegraDeNegocioException ex) {
        ProblemDetail problemDetail = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, ex.getMessage());
        problemDetail.setTitle("Erro de Regra de Negócio");
        problemDetail.setType(URI.create("https://api.sigi.com/errors/regra-de-negocio"));
        problemDetail.setProperty("timestamp", Instant.now());
        return problemDetail;
    }

    @ExceptionHandler(ConflitoException.class)
    public ProblemDetail handleConflitoException(ConflitoException ex) {
        ProblemDetail problemDetail = ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, ex.getMessage());
        problemDetail.setTitle("Conflito de Dados");
        problemDetail.setType(URI.create("https://api.sigi.com/errors/conflito"));
        problemDetail.setProperty("timestamp", Instant.now());
        return problemDetail;
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ProblemDetail handleValidationExceptions(MethodArgumentNotValidException ex) {
        String detail = ex.getBindingResult().getFieldErrors().stream()
                .map(error -> error.getField() + ": " + error.getDefaultMessage())
                .collect(Collectors.joining(", "));

        ProblemDetail problemDetail = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, detail);
        problemDetail.setTitle("Erro de Validação de Campos");
        problemDetail.setType(URI.create("https://api.sigi.com/errors/validacao"));
        problemDetail.setProperty("timestamp", Instant.now());
        return problemDetail;
    }
}
