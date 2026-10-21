package com.br.CLAI.security;

import com.br.CLAI.domain.Usuario;
import com.br.CLAI.domain.enums.NivelRestricao;
import com.br.CLAI.domain.enums.Role;
import com.br.CLAI.dto.request.LoginRequestDTO;
import com.br.CLAI.dto.response.LoginResponseDTO;
import com.br.CLAI.repository.UsuarioRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
public class AuthRevocationIntegrationTest {

    @Autowired
    private WebApplicationContext context;

    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    private Usuario adminUser;
    private Usuario alunoApoiadorUser;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders
                .webAppContextSetup(context)
                .apply(SecurityMockMvcConfigurers.springSecurity())
                .build();

        // Garantir que os usuários de teste estejam com estado limpo antes de cada teste
        adminUser = usuarioRepository.findByEmail("admin.test@sigi.ifpb.edu.br")
                .orElseGet(() -> {
                    Usuario novo = new Usuario(
                            "Admin Teste",
                            "admin.test@sigi.ifpb.edu.br",
                            passwordEncoder.encode("senha123"),
                            Role.ADMIN,
                            NivelRestricao.SUPER_RESTRICAO,
                            true
                    );
                    novo.setAcessoAtivo(true);
                    novo.setTokenVersion(1);
                    return usuarioRepository.save(novo);
                });
        adminUser.setAcessoAtivo(true);
        adminUser.setTokenVersion(1);
        usuarioRepository.save(adminUser);

        alunoApoiadorUser = usuarioRepository.findByEmail("aluno.test@sigi.ifpb.edu.br")
                .orElseGet(() -> {
                    Usuario novo = new Usuario(
                            "Aluno Apoiador Teste",
                            "aluno.test@sigi.ifpb.edu.br",
                            passwordEncoder.encode("senha123"),
                            Role.ALUNO_APOIADOR,
                            NivelRestricao.ACESSO_FUNCIONAL,
                            false
                    );
                    novo.setAcessoAtivo(true);
                    novo.setTokenVersion(1);
                    return usuarioRepository.save(novo);
                });
        alunoApoiadorUser.setAcessoAtivo(true);
        alunoApoiadorUser.setTokenVersion(1);
        usuarioRepository.save(alunoApoiadorUser);
    }

    @Test
    @DisplayName("CA 2: Deve autenticar com sucesso e emitir JWT com todas as claims (role, nivelRestricao, autorizacaoSaude, tokenVersion)")
    void deveEmitirTokenComClaimsObrigatoriasEPopularContexto() throws Exception {
        LoginRequestDTO loginRequest = new LoginRequestDTO("admin.test@sigi.ifpb.edu.br", "senha123");

        MvcResult loginResult = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.role").value("ADMIN"))
                .andExpect(jsonPath("$.nivelRestricao").value("SUPER_RESTRICAO"))
                .andExpect(jsonPath("$.autorizacaoSaude").value(true))
                .andExpect(jsonPath("$.tokenVersion").value(1))
                .andReturn();

        LoginResponseDTO loginResponse = objectMapper.readValue(
                loginResult.getResponse().getContentAsString(),
                LoginResponseDTO.class
        );

        String token = loginResponse.token();

        // Validar claims no payload do token JWT
        assertEquals("ADMIN", jwtService.extrairRole(token));
        assertEquals("SUPER_RESTRICAO", jwtService.extrairNivelRestricao(token));
        assertTrue(jwtService.extrairAutorizacaoSaude(token));
        assertEquals(1, jwtService.extrairTokenVersion(token));
        assertEquals("admin.test@sigi.ifpb.edu.br", jwtService.extrairEmail(token));

        // Validar que o SecurityContextHolder carrega o usuário e as authorities correspondentes
        mockMvc.perform(get("/api/v1/auth/me")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("ADMIN"))
                .andExpect(jsonPath("$.authorities").isArray())
                .andExpect(jsonPath("$.authorities[0]").value("ROLE_ADMIN"))
                .andExpect(jsonPath("$.authorities[1]").value("REST_SUPER_RESTRICAO"))
                .andExpect(jsonPath("$.authorities[2]").value("AUTH_SAUDE"));
    }

    @Test
    @DisplayName("RBAC: Usuário com perfil não-ADMIN deve ser bloqueado ao tentar revogar acesso (403 Forbidden)")
    void alunoNaoPodeAcessarEndpointDeRevogacao() throws Exception {
        // Login como ALUNO_APOIADOR
        LoginRequestDTO loginAluno = new LoginRequestDTO("aluno.test@sigi.ifpb.edu.br", "senha123");
        MvcResult loginAlunoResult = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginAluno)))
                .andExpect(status().isOk())
                .andReturn();

        LoginResponseDTO alunoResponse = objectMapper.readValue(
                loginAlunoResult.getResponse().getContentAsString(),
                LoginResponseDTO.class
        );

        // Tentativa de chamar endpoint admin de revogação
        mockMvc.perform(patch("/api/v1/admin/usuarios/" + alunoApoiadorUser.getId() + "/revogar-acesso")
                        .header("Authorization", "Bearer " + alunoResponse.token()))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("CA 1 [TA11.4]: Revogação Imediata — Token anterior deve ser sumariamente bloqueado após revogação pelo ADMIN")
    void deveRevogarAcessoImediatamenteEBloquearTokenAnterior() throws Exception {
        // 1. Aluno Apoiador faz login e recebe token
        LoginRequestDTO loginAluno = new LoginRequestDTO("aluno.test@sigi.ifpb.edu.br", "senha123");
        MvcResult loginAlunoResult = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginAluno)))
                .andExpect(status().isOk())
                .andReturn();

        LoginResponseDTO alunoResponse = objectMapper.readValue(
                loginAlunoResult.getResponse().getContentAsString(),
                LoginResponseDTO.class
        );
        String tokenAluno = alunoResponse.token();

        // 2. Aluno Apoiador usa seu token com sucesso
        mockMvc.perform(get("/api/v1/auth/me")
                        .header("Authorization", "Bearer " + tokenAluno))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("aluno.test@sigi.ifpb.edu.br"));

        // 3. Administrador faz login
        LoginRequestDTO loginAdmin = new LoginRequestDTO("admin.test@sigi.ifpb.edu.br", "senha123");
        MvcResult loginAdminResult = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginAdmin)))
                .andExpect(status().isOk())
                .andReturn();

        LoginResponseDTO adminResponse = objectMapper.readValue(
                loginAdminResult.getResponse().getContentAsString(),
                LoginResponseDTO.class
        );
        String tokenAdmin = adminResponse.token();

        // 4. Administrador aciona o endpoint de revogação contra o Aluno Apoiador
        mockMvc.perform(patch("/api/v1/admin/usuarios/" + alunoApoiadorUser.getId() + "/revogar-acesso")
                        .header("Authorization", "Bearer " + tokenAdmin))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.acessoAtivo").value(false))
                .andExpect(jsonPath("$.tokenVersion").value(2));

        // 5. [CRITÉRIO DE ACEITE TA11.4]: O token emitido ANTES da revogação deve ser BLOQUEADO imediatamente (401)
        mockMvc.perform(get("/api/v1/auth/me")
                        .header("Authorization", "Bearer " + tokenAluno))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.detail").value("Acesso revogado: o vínculo do usuário está desativado."));

        // 6. Tentativa de novo login do aluno revogado também deve ser rejeitada
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginAluno)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Sessão Ativa: Token com tokenVersion defasada deve ser rejeitado mesmo com usuário ativo")
    void deveRejeitarTokenComVersaoDefasada() throws Exception {
        // Gerar um token artificial com version 1 para o usuário
        String tokenV1 = jwtService.gerarToken(adminUser);

        // Simular incremento de tokenVersion no banco (ex: logout de todos os dispositivos)
        adminUser.setTokenVersion(2);
        usuarioRepository.save(adminUser);

        // O token antigo (v1) deve falhar imediatamente na validação
        mockMvc.perform(get("/api/v1/auth/me")
                        .header("Authorization", "Bearer " + tokenV1))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.detail").value("Sessão revogada ou versão do token inválida."));
    }
}
