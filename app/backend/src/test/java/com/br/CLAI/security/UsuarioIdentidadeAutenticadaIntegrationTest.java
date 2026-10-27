package com.br.CLAI.security;

import com.br.CLAI.controller.EstudoDeCasoController;
import com.br.CLAI.controller.PeaController;
import com.br.CLAI.controller.PeiController;
import com.br.CLAI.domain.Acompanhamento;
import com.br.CLAI.domain.Aluno;
import com.br.CLAI.domain.EstudoDeCaso;
import com.br.CLAI.domain.Pea;
import com.br.CLAI.domain.Pei;
import com.br.CLAI.domain.Usuario;
import com.br.CLAI.domain.enums.NivelRestricao;
import com.br.CLAI.domain.enums.Role;
import com.br.CLAI.domain.enums.StatusEstudoCaso;
import com.br.CLAI.handler.GlobalExceptionHandler;
import com.br.CLAI.mapper.EstudoDeCasoMapper;
import com.br.CLAI.mapper.PeaMapper;
import com.br.CLAI.mapper.PeiMapper;
import com.br.CLAI.repository.AcompanhamentoRepository;
import com.br.CLAI.repository.AlunoRepository;
import com.br.CLAI.repository.EstudoDeCasoRepository;
import com.br.CLAI.repository.IndicadorReutilizavelRepository;
import com.br.CLAI.repository.PeaRepository;
import com.br.CLAI.repository.PeiRepository;
import com.br.CLAI.repository.UsuarioRepository;
import com.br.CLAI.service.EstudoDeCasoService;
import com.br.CLAI.service.PeaService;
import com.br.CLAI.service.PeiService;
import com.br.CLAI.service.validator.EstudoDeCasoValidator;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.annotation.AnnotationConfigApplicationContext;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.MediaType;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.method.annotation.AuthenticationPrincipalArgumentResolver;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
@DisplayName("Segurança e Auditoria: Identificação Confiável de Usuários nos Controllers e Services")
class UsuarioIdentidadeAutenticadaIntegrationTest {

    private static final String TEST_JWT_SECRET = "sigi-clai-dev-jwt-secret-key-2026-ifpb-change-in-prod";

    @Mock
    private AlunoRepository alunoRepository;

    @Mock
    private AcompanhamentoRepository acompanhamentoRepository;

    @Mock
    private EstudoDeCasoRepository estudoDeCasoRepository;

    @Mock
    private IndicadorReutilizavelRepository indicadorRepository;

    @Mock
    private PeaRepository peaRepository;

    @Mock
    private PeiRepository peiRepository;

    @Mock
    private UsuarioRepository usuarioRepository;

    private static EstudoDeCasoService staticEstudoDeCasoService;
    private static PeaService staticPeaService;
    private static PeiService staticPeiService;
    private static RbacGuard staticRbacGuard;

    private JwtService jwtService;
    private RbacGuard rbacGuard;
    private MockMvc mockMvc;
    private AnnotationConfigApplicationContext testContext;

    private UUID alunoId;
    private UUID acompanhamentoId;
    private UUID estudoRascunhoId;
    private UUID peaId;
    private UUID peiId;

    private Aluno alunoTeste;
    private Acompanhamento acompanhamentoTeste;
    private EstudoDeCaso estudoRascunho;
    private Pea peaExistente;
    private Pei peiExistente;

    private Usuario psicopedagogaUser;
    private Usuario coordenadorUser;
    private Usuario professorUser;
    private Usuario usuarioRevogado;

    private final Map<String, Usuario> bancoUsuariosSimulado = new HashMap<>();

    @Configuration
    @EnableMethodSecurity(prePostEnabled = true)
    static class SecurityTestConfig {
        @Bean
        public RbacGuard rbacGuard() {
            return staticRbacGuard;
        }

        @Bean
        public EstudoDeCasoController estudoDeCasoController(RbacGuard rbacGuard) {
            return new EstudoDeCasoController(staticEstudoDeCasoService, rbacGuard);
        }

        @Bean
        public PeaController peaController(RbacGuard rbacGuard) {
            return new PeaController(staticPeaService, rbacGuard);
        }

        @Bean
        public PeiController peiController(RbacGuard rbacGuard) {
            return new PeiController(staticPeiService, rbacGuard);
        }
    }

    @BeforeEach
    void setUp() {
        SecurityContextHolder.clearContext();
        bancoUsuariosSimulado.clear();

        jwtService = new JwtService();
        ReflectionTestUtils.setField(jwtService, "jwtSecret", TEST_JWT_SECRET);
        ReflectionTestUtils.setField(jwtService, "jwtExpirationMs", 28800000L);

        rbacGuard = new RbacGuard();
        staticRbacGuard = rbacGuard;

        EstudoDeCasoMapper estudoMapper = new EstudoDeCasoMapper(rbacGuard);
        EstudoDeCasoValidator estudoValidator = new EstudoDeCasoValidator();
        PeaMapper peaMapper = new PeaMapper();
        PeiMapper peiMapper = new PeiMapper();

        staticEstudoDeCasoService = new EstudoDeCasoService(
                estudoDeCasoRepository,
                alunoRepository,
                indicadorRepository,
                estudoValidator,
                estudoMapper
        );

        staticPeaService = new PeaService(
                peaRepository,
                acompanhamentoRepository,
                peaMapper
        );

        staticPeiService = new PeiService(
                peiRepository,
                acompanhamentoRepository,
                peaRepository,
                peiMapper,
                peaMapper
        );

        alunoId = UUID.fromString("11111111-1111-1111-1111-111111111111");
        acompanhamentoId = UUID.fromString("22222222-2222-2222-2222-222222222222");
        estudoRascunhoId = UUID.fromString("33333333-3333-3333-3333-333333333333");
        peaId = UUID.fromString("44444444-4444-4444-4444-444444444444");
        peiId = UUID.fromString("55555555-5555-5555-5555-555555555555");

        alunoTeste = new Aluno("Mariana Costa", "20261001");
        alunoTeste.setId(alunoId);

        acompanhamentoTeste = new Acompanhamento(alunoTeste, LocalDate.now());
        acompanhamentoTeste.setId(acompanhamentoId);

        psicopedagogaUser = registrarUsuario(
                UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-000000000001"),
                "Psicopedagoga CLAI",
                "psicopedagoga@sigi.ifpb.edu.br",
                Role.CLAI_PSICOPEDAGOGO,
                NivelRestricao.RESTRICAO_MODERADA,
                true,
                true
        );

        coordenadorUser = registrarUsuario(
                UUID.fromString("bbbbbbbb-bbbb-bbbb-bbbb-000000000002"),
                "Coordenador CLAI",
                "coordenador@sigi.ifpb.edu.br",
                Role.COORDENADOR,
                NivelRestricao.SUPER_RESTRICAO,
                false,
                true
        );

        professorUser = registrarUsuario(
                UUID.fromString("cccccccc-cccc-cccc-cccc-000000000003"),
                "Professor Titular",
                "professor@sigi.ifpb.edu.br",
                Role.PROFESSOR,
                NivelRestricao.ACESSO_FUNCIONAL,
                false,
                true
        );

        usuarioRevogado = registrarUsuario(
                UUID.fromString("dddddddd-dddd-dddd-dddd-000000000004"),
                "Servidor Desligado",
                "revogado@sigi.ifpb.edu.br",
                Role.CLAI_PSICOPEDAGOGO,
                NivelRestricao.RESTRICAO_MODERADA,
                false,
                false
        );

        estudoRascunho = new EstudoDeCaso(alunoTeste, StatusEstudoCaso.RASCUNHO, "Diagnóstico preliminar em elaboração");
        estudoRascunho.setId(estudoRascunhoId);
        estudoRascunho.setCriadoPor(psicopedagogaUser.getId());
        estudoRascunho.setAtualizadoPor(psicopedagogaUser.getId());
        estudoRascunho.setCriadoEm(LocalDateTime.now());
        estudoRascunho.setAtualizadoEm(LocalDateTime.now());

        peaExistente = new Pea(acompanhamentoTeste, null, "Objetivo inicial", "Metodologia inicial", "Avaliação inicial");
        peaExistente.setId(peaId);
        peaExistente.setCriadoPor(psicopedagogaUser.getId());
        peaExistente.setAtualizadoPor(psicopedagogaUser.getId());

        peiExistente = new Pei(acompanhamentoTeste, "Habilidades iniciais", "Adaptações iniciais");
        peiExistente.setId(peiId);
        peiExistente.setCriadoPor(psicopedagogaUser.getId());
        peiExistente.setAtualizadoPor(psicopedagogaUser.getId());

        lenient().when(alunoRepository.findById(alunoId)).thenReturn(Optional.of(alunoTeste));
        lenient().when(acompanhamentoRepository.findById(acompanhamentoId)).thenReturn(Optional.of(acompanhamentoTeste));
        lenient().when(estudoDeCasoRepository.existsByAlunoIdAndStatus(alunoId, StatusEstudoCaso.ATIVO)).thenReturn(false);
        lenient().when(estudoDeCasoRepository.findById(estudoRascunhoId)).thenReturn(Optional.of(estudoRascunho));
        lenient().when(estudoDeCasoRepository.save(any(EstudoDeCaso.class))).thenAnswer(inv -> {
            EstudoDeCaso ent = inv.getArgument(0);
            if (ent.getId() == null) {
                ent.setId(UUID.randomUUID());
            }
            return ent;
        });

        lenient().when(peaRepository.findById(peaId)).thenReturn(Optional.of(peaExistente));
        lenient().when(peaRepository.findByAcompanhamentoId(acompanhamentoId)).thenReturn(List.of(peaExistente));
        lenient().when(peaRepository.save(any(Pea.class))).thenAnswer(inv -> {
            Pea ent = inv.getArgument(0);
            if (ent.getId() == null) {
                ent.setId(UUID.randomUUID());
            }
            return ent;
        });

        lenient().when(peiRepository.findById(peiId)).thenReturn(Optional.of(peiExistente));
        lenient().when(peiRepository.save(any(Pei.class))).thenAnswer(inv -> {
            Pei ent = inv.getArgument(0);
            if (ent.getId() == null) {
                ent.setId(UUID.randomUUID());
            }
            return ent;
        });

        lenient().when(usuarioRepository.findByEmail(any(String.class))).thenAnswer(inv -> {
            String email = inv.getArgument(0);
            return Optional.ofNullable(bancoUsuariosSimulado.get(email));
        });

        testContext = new AnnotationConfigApplicationContext(SecurityTestConfig.class);
        EstudoDeCasoController proxiedEstudoController = testContext.getBean(EstudoDeCasoController.class);
        PeaController proxiedPeaController = testContext.getBean(PeaController.class);
        PeiController proxiedPeiController = testContext.getBean(PeiController.class);

        JwtAuthenticationFilter jwtFilter = new JwtAuthenticationFilter(jwtService, usuarioRepository);

        mockMvc = MockMvcBuilders.standaloneSetup(proxiedEstudoController, proxiedPeaController, proxiedPeiController)
                .setCustomArgumentResolvers(new AuthenticationPrincipalArgumentResolver())
                .setControllerAdvice(new GlobalExceptionHandler())
                .addFilters(jwtFilter)
                .build();
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
        if (testContext != null) {
            testContext.close();
        }
    }

    private Usuario registrarUsuario(
            UUID id,
            String nome,
            String email,
            Role role,
            NivelRestricao nivel,
            boolean saude,
            boolean ativo
    ) {
        Usuario u = new Usuario(nome, email, "hash", role, nivel, saude);
        u.setId(id);
        u.setAcessoAtivo(ativo);
        u.setTokenVersion(1);
        bancoUsuariosSimulado.put(email, u);
        return u;
    }

    @Test
    @DisplayName("EstudoDeCaso (POST/PUT/DELETE): Deve gravar o UUID do usuário autenticado via JWT e ignorar X-User-Id forjado")
    void estudoDeCasoDeveUsarIdentidadeAutenticadaEIgnorarHeaderForjado() throws Exception {
        String tokenPsicopedagoga = jwtService.gerarToken(psicopedagogaUser);
        String tokenCoordenador = jwtService.gerarToken(coordenadorUser);
        UUID idForjadoNoHeader = UUID.fromString("99999999-9999-9999-9999-999999999999");

        String jsonCriar = String.format(
                "{\"alunoId\":\"%s\",\"status\":\"RASCUNHO\",\"diagnosticoInicial\":\"Diagnóstico inicial\"}",
                alunoId
        );

        // 1. POST com JWT da Psicopedagoga + X-User-Id forjado -> deve atribuir psicopedagogaUser.getId()
        mockMvc.perform(post("/api/estudos-de-caso")
                        .header("Authorization", "Bearer " + tokenPsicopedagoga)
                        .header("X-User-Id", idForjadoNoHeader.toString())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonCriar))
                .andExpect(status().isCreated());

        ArgumentCaptor<EstudoDeCaso> captorCriar = ArgumentCaptor.forClass(EstudoDeCaso.class);
        verify(estudoDeCasoRepository).save(captorCriar.capture());
        EstudoDeCaso estudoCriado = captorCriar.getValue();

        assertEquals(psicopedagogaUser.getId(), estudoCriado.getCriadoPor());
        assertEquals(psicopedagogaUser.getId(), estudoCriado.getAtualizadoPor());
        assertNotEquals(idForjadoNoHeader, estudoCriado.getCriadoPor());

        SecurityContextHolder.clearContext();

        // 2. PUT com JWT do Coordenador + X-User-Id forjado -> deve atualizar atualizadoPor com coordenadorUser.getId()
        String jsonAtualizar = "{\"status\":\"RASCUNHO\",\"diagnosticoInicial\":\"Diagnóstico revisado\"}";

        mockMvc.perform(put("/api/estudos-de-caso/{id}", estudoRascunhoId)
                        .header("Authorization", "Bearer " + tokenCoordenador)
                        .header("X-User-Id", idForjadoNoHeader.toString())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonAtualizar))
                .andExpect(status().isOk());

        assertEquals(psicopedagogaUser.getId(), estudoRascunho.getCriadoPor());
        assertEquals(coordenadorUser.getId(), estudoRascunho.getAtualizadoPor());
        assertNotEquals(idForjadoNoHeader, estudoRascunho.getAtualizadoPor());

        SecurityContextHolder.clearContext();

        // 3. DELETE com JWT da Psicopedagoga + X-User-Id forjado -> deve gravar psicopedagogaUser.getId()
        mockMvc.perform(delete("/api/estudos-de-caso/{id}", estudoRascunhoId)
                        .header("Authorization", "Bearer " + tokenPsicopedagoga)
                        .header("X-User-Id", idForjadoNoHeader.toString()))
                .andExpect(status().isNoContent());

        assertEquals(psicopedagogaUser.getId(), estudoRascunho.getAtualizadoPor());
        verify(estudoDeCasoRepository).delete(estudoRascunho);
    }

    @Test
    @DisplayName("EstudoDeCaso: Requisições sem autenticação devem retornar 401 Unauthorized (mesmo enviando X-User-Id) e jamais gerar UUID aleatório")
    void estudoDeCasoSemAutenticacaoDeveRetornar401ENaoPersistir() throws Exception {
        UUID idArbitrario = UUID.randomUUID();
        String jsonCriar = String.format(
                "{\"alunoId\":\"%s\",\"status\":\"RASCUNHO\",\"diagnosticoInicial\":\"Tentativa sem auth\"}",
                alunoId
        );

        // 1. POST sem JWT (mesmo enviando X-User-Id) -> 401 Unauthorized
        mockMvc.perform(post("/api/estudos-de-caso")
                        .header("X-User-Id", idArbitrario.toString())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonCriar))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.title").value("Não Autorizado"));

        // 2. PUT sem JWT -> 401 Unauthorized
        mockMvc.perform(put("/api/estudos-de-caso/{id}", estudoRascunhoId)
                        .header("X-User-Id", idArbitrario.toString())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"RASCUNHO\",\"diagnosticoInicial\":\"Tentativa update\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401));

        // 3. DELETE sem JWT -> 401 Unauthorized
        mockMvc.perform(delete("/api/estudos-de-caso/{id}", estudoRascunhoId)
                        .header("X-User-Id", idArbitrario.toString()))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401));

        verify(estudoDeCasoRepository, never()).save(any());
        verify(estudoDeCasoRepository, never()).delete(any());
    }

    @Test
    @DisplayName("PEA (POST/PUT/DELETE): Deve funcionar apenas com JWT válido (sem depender de X-User-Id) e bloquear requisições não autenticadas com 401")
    void peaDeveUtilizarUsuarioAutenticadoDoJwtERejeitarSemAutenticacao() throws Exception {
        String tokenProfessor = jwtService.gerarToken(professorUser);
        UUID idForjado = UUID.fromString("99999999-9999-9999-9999-999999999999");

        String jsonCriarPea = String.format(
                "{\"acompanhamentoId\":\"%s\",\"objetivoGeral\":\"Adaptação em Matemática\",\"metodologia\":\"Uso de material concreto\",\"avaliacao\":\"Contínua\"}",
                acompanhamentoId
        );

        // 1. POST sem autenticação -> 401 Unauthorized
        mockMvc.perform(post("/api/peas")
                        .header("X-User-Id", idForjado.toString())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonCriarPea))
                .andExpect(status().isUnauthorized());

        verify(peaRepository, never()).save(any());

        // 2. POST autenticado com JWT (mesmo enviando X-User-Id de outro usuário) -> 201 Created com ID do JWT
        mockMvc.perform(post("/api/peas")
                        .header("Authorization", "Bearer " + tokenProfessor)
                        .header("X-User-Id", idForjado.toString())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonCriarPea))
                .andExpect(status().isCreated());

        ArgumentCaptor<Pea> captorPea = ArgumentCaptor.forClass(Pea.class);
        verify(peaRepository).save(captorPea.capture());
        assertEquals(professorUser.getId(), captorPea.getValue().getCriadoPor());
        assertEquals(professorUser.getId(), captorPea.getValue().getAtualizadoPor());

        SecurityContextHolder.clearContext();

        // 3. PUT autenticado com JWT (sem header X-User-Id) -> 200 OK
        mockMvc.perform(put("/api/peas/{id}", peaId)
                        .header("Authorization", "Bearer " + tokenProfessor)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"objetivoGeral\":\"Objetivo atualizado\"}"))
                .andExpect(status().isOk());

        assertEquals(professorUser.getId(), peaExistente.getAtualizadoPor());

        SecurityContextHolder.clearContext();

        // 4. DELETE autenticado com JWT -> 204 No Content
        mockMvc.perform(delete("/api/peas/{id}", peaId)
                        .header("Authorization", "Bearer " + tokenProfessor))
                .andExpect(status().isNoContent());

        assertEquals(professorUser.getId(), peaExistente.getAtualizadoPor());
        verify(peaRepository).delete(peaExistente);
    }

    @Test
    @DisplayName("PEI (POST/PUT/DELETE e Anexos Sensíveis): Deve usar identidade autenticada do JWT, rejeitar sem auth (401) e impedir bypass de perfil via X-User-Perfil (403)")
    void peiDeveUtilizarUsuarioAutenticadoEBloquearBypassDePerfil() throws Exception {
        String tokenPsicopedagoga = jwtService.gerarToken(psicopedagogaUser);
        String tokenProfessor = jwtService.gerarToken(professorUser);
        UUID idForjado = UUID.fromString("99999999-9999-9999-9999-999999999999");

        String jsonCriarPei = String.format(
                "{\"acompanhamentoId\":\"%s\",\"habilidadesInteresses\":\"Facilidade visual\",\"propostasAdaptacoes\":\"Tempo adicional em provas\"}",
                acompanhamentoId
        );

        // 1. POST sem autenticação -> 401 Unauthorized
        mockMvc.perform(post("/api/peis")
                        .header("X-User-Id", idForjado.toString())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonCriarPei))
                .andExpect(status().isUnauthorized());

        verify(peiRepository, never()).save(any());

        // 2. POST autenticado com JWT -> 201 Created com criadoPor = psicopedagogaUser.getId()
        mockMvc.perform(post("/api/peis")
                        .header("Authorization", "Bearer " + tokenPsicopedagoga)
                        .header("X-User-Id", idForjado.toString())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonCriarPei))
                .andExpect(status().isCreated());

        ArgumentCaptor<Pei> captorPei = ArgumentCaptor.forClass(Pei.class);
        verify(peiRepository).save(captorPei.capture());
        assertEquals(psicopedagogaUser.getId(), captorPei.getValue().getCriadoPor());
        assertEquals(psicopedagogaUser.getId(), captorPei.getValue().getAtualizadoPor());

        SecurityContextHolder.clearContext();

        // 3. PUT autenticado com JWT do Coordenador -> 200 OK com atualizadoPor = coordenadorUser.getId()
        String tokenCoordenador = jwtService.gerarToken(coordenadorUser);
        mockMvc.perform(put("/api/peis/{id}", peiId)
                        .header("Authorization", "Bearer " + tokenCoordenador)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"propostasAdaptacoes\":\"Adaptações revisadas pela coordenação\"}"))
                .andExpect(status().isOk());

        assertEquals(coordenadorUser.getId(), peiExistente.getAtualizadoPor());

        SecurityContextHolder.clearContext();

        // 4. Autorização insuficiente (403 Forbidden): Professor tentando acessar anexos sensíveis enviando X-User-Perfil forjado
        mockMvc.perform(get("/api/peis/{id}/anexos-sensiveis", peiId)
                        .header("Authorization", "Bearer " + tokenProfessor)
                        .header("X-User-Perfil", "Coordenador"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403))
                .andExpect(jsonPath("$.title").value("Acesso Negado"));

        SecurityContextHolder.clearContext();

        // 5. DELETE autenticado com JWT -> 204 No Content
        mockMvc.perform(delete("/api/peis/{id}", peiId)
                        .header("Authorization", "Bearer " + tokenPsicopedagoga))
                .andExpect(status().isNoContent());

        assertEquals(psicopedagogaUser.getId(), peiExistente.getAtualizadoPor());
        verify(peiRepository).delete(peiExistente);
    }

    @Test
    @DisplayName("Token JWT inválido ou de usuário com acesso revogado deve ser rejeitado com HTTP 401 Unauthorized")
    void deveRejeitarTokenInvalidoOuUsuarioRevogadoCom401() throws Exception {
        String tokenRevogado = jwtService.gerarToken(usuarioRevogado);
        String jsonCriar = String.format(
                "{\"alunoId\":\"%s\",\"status\":\"RASCUNHO\",\"diagnosticoInicial\":\"Teste token inválido\"}",
                alunoId
        );

        // 1. Token malformado / assinatura inválida -> 401 Unauthorized
        mockMvc.perform(post("/api/estudos-de-caso")
                        .header("Authorization", "Bearer token.jwt.invalido")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonCriar))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401));

        // 2. Token de usuário com acesso revogado -> 401 Unauthorized
        mockMvc.perform(post("/api/estudos-de-caso")
                        .header("Authorization", "Bearer " + tokenRevogado)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonCriar))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401));

        verify(estudoDeCasoRepository, never()).save(any());
    }
}
