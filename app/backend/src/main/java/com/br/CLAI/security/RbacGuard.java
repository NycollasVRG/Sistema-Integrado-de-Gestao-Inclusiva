package com.br.CLAI.security;

import com.br.CLAI.domain.Usuario;
import com.br.CLAI.domain.enums.NivelRestricao;
import com.br.CLAI.domain.enums.Role;
import org.springframework.security.authentication.AuthenticationCredentialsNotFoundException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.Collection;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

/**
 * Componente avaliador de expressões granulares de autorização RBAC (Task #52 - US 11).
 * Utilizado em anotações @PreAuthorize (ex: @PreAuthorize("@rbacGuard.temRestricaoModeradaOuSuperior()"))
 * e em serviços de domínio/mappers para controle de fluxo e omissão de dados sensíveis.
 */
@Component("rbacGuard")
public class RbacGuard {

    private static final Set<String> AUTHORITIES_MODERADA_OU_SUPERIOR = Set.of(
            "REST_RESTRICAO_MODERADA",
            "REST_SUPER_RESTRICAO",
            "ROLE_CLAI_PSICOPEDAGOGO",
            "ROLE_COORDENADOR",
            "ROLE_ADMIN"
    );

    private static final Set<String> AUTHORITIES_SUPER_RESTRICAO = Set.of(
            "REST_SUPER_RESTRICAO",
            "ROLE_ADMIN"
    );

    private static final Set<String> AUTHORITIES_ACESSO_FUNCIONAL = Set.of(
            "REST_ACESSO_FUNCIONAL",
            "ROLE_PROFESSOR",
            "ROLE_ALUNO_APOIADOR"
    );

    /**
     * Retorna a entidade Usuario atualmente autenticada no SecurityContextHolder, se presente.
     */
    public Optional<Usuario> getUsuarioAutenticado() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            return Optional.empty();
        }
        Object principal = auth.getPrincipal();
        if (principal instanceof Usuario usuario) {
            return Optional.of(usuario);
        }
        return Optional.empty();
    }

    /**
     * Obtém e valida obrigatoriamente o usuário autenticado a partir do principal resolvido
     * ou do SecurityContextHolder. Lança exceção de autenticação (HTTP 401) caso ausente ou inativo.
     */
    public Usuario exigirUsuarioAutenticado(Usuario usuarioPrincipal) {
        Usuario usuario = (usuarioPrincipal != null)
                ? usuarioPrincipal
                : getUsuarioAutenticado().orElse(null);

        if (usuario == null || usuario.getId() == null) {
            throw new AuthenticationCredentialsNotFoundException(
                    "Autenticação obrigatória para acessar este recurso."
            );
        }

        if (!Boolean.TRUE.equals(usuario.getAcessoAtivo())) {
            throw new DisabledException(
                    "Acesso revogado: o vínculo deste usuário encontra-se desativado."
            );
        }

        return usuario;
    }

    /**
     * Obtém e valida obrigatoriamente o usuário autenticado a partir do SecurityContextHolder.
     */
    public Usuario exigirUsuarioAutenticado() {
        return exigirUsuarioAutenticado(null);
    }

    /**
     * Obtém o UUID confiável do usuário autenticado a partir do principal ou do contexto de segurança.
     */
    public UUID exigirUsuarioAutenticadoId(Usuario usuarioPrincipal) {
        return exigirUsuarioAutenticado(usuarioPrincipal).getId();
    }

    /**
     * Obtém o UUID confiável do usuário autenticado a partir do SecurityContextHolder.
     */
    public UUID exigirUsuarioAutenticadoId() {
        return exigirUsuarioAutenticado(null).getId();
    }

    /**
     * Verifica se o usuário autenticado possui nível RESTRICAO_MODERADA ou superior,
     * ou papéis equivalentes (CLAI_PSICOPEDAGOGO, COORDENADOR, ADMIN).
     */
    public boolean temRestricaoModeradaOuSuperior() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            return false;
        }

        if (auth.getPrincipal() instanceof Usuario usuario) {
            if (!Boolean.TRUE.equals(usuario.getAcessoAtivo())) {
                return false;
            }
            NivelRestricao nivel = usuario.getNivelRestricao();
            Role role = usuario.getRole();

            boolean porNivel = nivel == NivelRestricao.RESTRICAO_MODERADA || nivel == NivelRestricao.SUPER_RESTRICAO;
            boolean porRole = role == Role.CLAI_PSICOPEDAGOGO || role == Role.COORDENADOR || role == Role.ADMIN;

            if (porNivel || porRole) {
                return true;
            }
        }

        return possuiAlgumaAuthority(auth.getAuthorities(), AUTHORITIES_MODERADA_OU_SUPERIOR);
    }

    /**
     * Verifica se o usuário autenticado possui nível SUPER_RESTRICAO (ou Role ADMIN).
     */
    public boolean temSuperRestricao() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            return false;
        }

        if (auth.getPrincipal() instanceof Usuario usuario) {
            if (!Boolean.TRUE.equals(usuario.getAcessoAtivo())) {
                return false;
            }
            if (usuario.getNivelRestricao() == NivelRestricao.SUPER_RESTRICAO || usuario.getRole() == Role.ADMIN) {
                return true;
            }
        }

        return possuiAlgumaAuthority(auth.getAuthorities(), AUTHORITIES_SUPER_RESTRICAO);
    }

    /**
     * Verifica se o usuário autenticado possui apenas nível de ACESSO_FUNCIONAL
     * (ex: PROFESSOR, ALUNO_APOIADOR) e não tem acesso moderado/superior.
     */
    public boolean temApenasAcessoFuncional() {
        if (temRestricaoModeradaOuSuperior()) {
            return false;
        }

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            return false;
        }

        if (auth.getPrincipal() instanceof Usuario usuario) {
            return usuario.getNivelRestricao() == NivelRestricao.ACESSO_FUNCIONAL
                    || usuario.getRole() == Role.PROFESSOR
                    || usuario.getRole() == Role.ALUNO_APOIADOR;
        }

        return possuiAlgumaAuthority(auth.getAuthorities(), AUTHORITIES_ACESSO_FUNCIONAL);
    }

    /**
     * Método semântico para checar se o usuário atual tem permissão para visualizar dados sensíveis
     * (estudos socioemocionais e histórico familiar).
     */
    public boolean podeAcessarDadosSensiveis() {
        return temRestricaoModeradaOuSuperior();
    }

    /**
     * Verifica se o usuário possui autorização específica para sigilo médico (laudos/saúde).
     */
    public boolean temAutorizacaoSaude() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            return false;
        }

        if (auth.getPrincipal() instanceof Usuario usuario) {
            return Boolean.TRUE.equals(usuario.getAutorizacaoSaude());
        }

        return possuiAlgumaAuthority(auth.getAuthorities(), Set.of("AUTH_SAUDE"));
    }

    private boolean possuiAlgumaAuthority(Collection<? extends GrantedAuthority> authorities, Set<String> permitidas) {
        if (authorities == null || authorities.isEmpty()) {
            return false;
        }
        for (GrantedAuthority ga : authorities) {
            if (permitidas.contains(ga.getAuthority())) {
                return true;
            }
        }
        return false;
    }
}
