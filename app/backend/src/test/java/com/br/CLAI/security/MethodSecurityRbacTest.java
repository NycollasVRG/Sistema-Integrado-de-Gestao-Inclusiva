package com.br.CLAI.security;

import com.br.CLAI.domain.Usuario;
import com.br.CLAI.domain.enums.NivelRestricao;
import com.br.CLAI.domain.enums.Role;
import com.br.CLAI.handler.GlobalExceptionHandler;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.context.annotation.AnnotationConfigApplicationContext;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@DisplayName("Task #52 - Etapa 1: Validação de Method Security e RbacGuard")
class MethodSecurityRbacTest {

    private RbacGuard rbacGuard;

    private Usuario admin;
    private Usuario coordenador;
    private Usuario psicopedagogo;
    private Usuario professor;
    private Usuario alunoApoiador;
    private Usuario usuarioInativo;

    @BeforeEach
    void setUp() {
        SecurityContextHolder.clearContext();
        rbacGuard = new RbacGuard();

        admin = new Usuario("Admin", "admin@sigi.ifpb.edu.br", "hash", Role.ADMIN, NivelRestricao.SUPER_RESTRICAO, true);
        admin.setId(UUID.randomUUID());
        admin.setAcessoAtivo(true);

        coordenador = new Usuario("Coordenador", "coordenador@sigi.ifpb.edu.br", "hash", Role.COORDENADOR, NivelRestricao.SUPER_RESTRICAO, false);
        coordenador.setId(UUID.randomUUID());
        coordenador.setAcessoAtivo(true);

        psicopedagogo = new Usuario("Psicopedagoga", "psicopedagoga@sigi.ifpb.edu.br", "hash", Role.CLAI_PSICOPEDAGOGO, NivelRestricao.RESTRICAO_MODERADA, true);
        psicopedagogo.setId(UUID.randomUUID());
        psicopedagogo.setAcessoAtivo(true);

        professor = new Usuario("Professor", "professor@sigi.ifpb.edu.br", "hash", Role.PROFESSOR, NivelRestricao.ACESSO_FUNCIONAL, false);
        professor.setId(UUID.randomUUID());
        professor.setAcessoAtivo(true);

        alunoApoiador = new Usuario("Apoiador", "apoiador@sigi.ifpb.edu.br", "hash", Role.ALUNO_APOIADOR, NivelRestricao.ACESSO_FUNCIONAL, false);
        alunoApoiador.setId(UUID.randomUUID());
        alunoApoiador.setAcessoAtivo(true);

        usuarioInativo = new Usuario("Inativo", "inativo@sigi.ifpb.edu.br", "hash", Role.CLAI_PSICOPEDAGOGO, NivelRestricao.RESTRICAO_MODERADA, true);
        usuarioInativo.setId(UUID.randomUUID());
        usuarioInativo.setAcessoAtivo(false);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    private void autenticarComo(Usuario usuario) {
        if (usuario == null) {
            SecurityContextHolder.clearContext();
            return;
        }
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                usuario,
                null,
                usuario.getAuthorities()
        );
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    @Nested
    @DisplayName("Testes Unitários das Regras do RbacGuard")
    class RbacGuardUnitTests {

        @Test
        @DisplayName("ADMIN e COORDENADOR (SUPER_RESTRICAO) devem ter acesso moderado/superior e super restrição")
        void adminECoordenadorDevemPossuirSuperRestricaoEModerada() {
            autenticarComo(admin);
            assertTrue(rbacGuard.temRestricaoModeradaOuSuperior());
            assertTrue(rbacGuard.temSuperRestricao());
            assertTrue(rbacGuard.podeAcessarDadosSensiveis());
            assertFalse(rbacGuard.temApenasAcessoFuncional());
            assertTrue(rbacGuard.temAutorizacaoSaude());

            autenticarComo(coordenador);
            assertTrue(rbacGuard.temRestricaoModeradaOuSuperior());
            assertTrue(rbacGuard.temSuperRestricao());
            assertTrue(rbacGuard.podeAcessarDadosSensiveis());
            assertFalse(rbacGuard.temApenasAcessoFuncional());
            assertFalse(rbacGuard.temAutorizacaoSaude());
        }

        @Test
        @DisplayName("CLAI_PSICOPEDAGOGO (RESTRICAO_MODERADA) deve ter acesso moderado/superior mas NÃO super restrição")
        void psicopedagogoDevePossuirRestricaoModeradaMasNaoSuper() {
            autenticarComo(psicopedagogo);
            assertTrue(rbacGuard.temRestricaoModeradaOuSuperior());
            assertFalse(rbacGuard.temSuperRestricao());
            assertTrue(rbacGuard.podeAcessarDadosSensiveis());
            assertFalse(rbacGuard.temApenasAcessoFuncional());
            assertTrue(rbacGuard.temAutorizacaoSaude());
        }

        @Test
        @DisplayName("PROFESSOR e ALUNO_APOIADOR (ACESSO_FUNCIONAL) NÃO devem acessar dados moderados ou superiores")
        void acessoFuncionalDeveSerBarradoEmRestricoesSuperiores() {
            autenticarComo(professor);
            assertFalse(rbacGuard.temRestricaoModeradaOuSuperior());
            assertFalse(rbacGuard.temSuperRestricao());
            assertFalse(rbacGuard.podeAcessarDadosSensiveis());
            assertTrue(rbacGuard.temApenasAcessoFuncional());
            assertFalse(rbacGuard.temAutorizacaoSaude());

            autenticarComo(alunoApoiador);
            assertFalse(rbacGuard.temRestricaoModeradaOuSuperior());
            assertFalse(rbacGuard.temSuperRestricao());
            assertFalse(rbacGuard.podeAcessarDadosSensiveis());
            assertTrue(rbacGuard.temApenasAcessoFuncional());
        }

        @Test
        @DisplayName("Usuário inativo (acessoAtivo = false) não deve ter permissão liberada mesmo com role privilegiada")
        void usuarioInativoDeveSerBarrado() {
            autenticarComo(usuarioInativo);
            assertFalse(rbacGuard.temRestricaoModeradaOuSuperior());
            assertFalse(rbacGuard.temSuperRestricao());
            assertFalse(rbacGuard.podeAcessarDadosSensiveis());
        }

        @Test
        @DisplayName("Sem usuário autenticado, todos os métodos de autorização devem retornar false")
        void semAutenticacaoDeveRetornarFalse() {
            autenticarComo(null);
            assertFalse(rbacGuard.temRestricaoModeradaOuSuperior());
            assertFalse(rbacGuard.temSuperRestricao());
            assertFalse(rbacGuard.temApenasAcessoFuncional());
            assertFalse(rbacGuard.podeAcessarDadosSensiveis());
            assertFalse(rbacGuard.temAutorizacaoSaude());
            assertTrue(rbacGuard.getUsuarioAutenticado().isEmpty());
        }
    }

    @Nested
    @DisplayName("Interceptação com @PreAuthorize e Formatação de Erro 403 (ProblemDetail RFC 9457)")
    class MethodSecurityIntegrationTests {

        private MockMvc mockMvc;
        private AnnotationConfigApplicationContext testContext;

        @RestController
        static class TestSecurityController {
            @GetMapping("/api/test/moderado")
            @PreAuthorize("@rbacGuard.temRestricaoModeradaOuSuperior()")
            public Map<String, String> endpointModerado() {
                return Map.of("mensagem", "Acesso autorizado à equipe moderada/CLAI");
            }

            @GetMapping("/api/test/super-restrito")
            @PreAuthorize("@rbacGuard.temSuperRestricao()")
            public Map<String, String> endpointSuperRestrito() {
                return Map.of("mensagem", "Acesso exclusivo SUPER_RESTRICAO");
            }
        }

        @Configuration
        @EnableMethodSecurity(prePostEnabled = true)
        static class TestSecurityMethodConfig {
            @Bean
            public RbacGuard rbacGuard() {
                return new RbacGuard();
            }

            @Bean
            public TestSecurityController testSecurityController() {
                return new TestSecurityController();
            }
        }

        @BeforeEach
        void initContext() {
            testContext = new AnnotationConfigApplicationContext(TestSecurityMethodConfig.class);
            TestSecurityController proxiedController = testContext.getBean(TestSecurityController.class);

            mockMvc = MockMvcBuilders.standaloneSetup(proxiedController)
                    .setControllerAdvice(new GlobalExceptionHandler())
                    .build();
        }

        @AfterEach
        void closeContext() {
            if (testContext != null) {
                testContext.close();
            }
        }

        @Test
        @DisplayName("PROFESSOR tentando rota com @PreAuthorize deve ser bloqueado com HTTP 403 Forbidden RFC 9457")
        void professorDeveSerBloqueadoCom403ProblemDetail() throws Exception {
            autenticarComo(professor);

            mockMvc.perform(get("/api/test/moderado")
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isForbidden())
                    .andExpect(jsonPath("$.status").value(403))
                    .andExpect(jsonPath("$.title").value("Acesso Negado"))
                    .andExpect(jsonPath("$.type").value("https://api.sigi.com/errors/acesso-negado"))
                    .andExpect(jsonPath("$.detail").value("Seu perfil não possui permissão para acessar este recurso."))
                    .andExpect(jsonPath("$.timestamp").exists());
        }

        @Test
        @DisplayName("CLAI_PSICOPEDAGOGO chamando rota com @PreAuthorize moderada deve receber HTTP 200 OK")
        void psicopedagogoDeveTerAcessoLiberado200Ok() throws Exception {
            autenticarComo(psicopedagogo);

            mockMvc.perform(get("/api/test/moderado")
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.mensagem").value("Acesso autorizado à equipe moderada/CLAI"));
        }

        @Test
        @DisplayName("CLAI_PSICOPEDAGOGO tentando rota SUPER_RESTRICAO deve ser bloqueado com HTTP 403 Forbidden")
        void psicopedagogoBarradoEmSuperRestricao() throws Exception {
            autenticarComo(psicopedagogo);

            mockMvc.perform(get("/api/test/super-restrito")
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isForbidden())
                    .andExpect(jsonPath("$.status").value(403))
                    .andExpect(jsonPath("$.title").value("Acesso Negado"));
        }

        @Test
        @DisplayName("ADMIN chamando rota SUPER_RESTRICAO deve receber HTTP 200 OK")
        void adminAcessoSuperRestricao200Ok() throws Exception {
            autenticarComo(admin);

            mockMvc.perform(get("/api/test/super-restrito")
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.mensagem").value("Acesso exclusivo SUPER_RESTRICAO"));
        }
    }
}
