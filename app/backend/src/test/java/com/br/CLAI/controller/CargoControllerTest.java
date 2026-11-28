package com.br.CLAI.controller;

import com.br.CLAI.domain.Cargo;
import com.br.CLAI.domain.Usuario;
import com.br.CLAI.domain.enums.NivelRestricao;
import com.br.CLAI.domain.enums.Role;
import com.br.CLAI.repository.CargoRepository;
import com.br.CLAI.repository.UsuarioRepository;
import com.br.CLAI.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import java.util.UUID;

import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.not;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@ActiveProfiles("test")
@DisplayName("CRUD de Cargos (/api/cargos) - ADMIN e COORDENADOR podem criar e gerir")
class CargoControllerTest {

    @Autowired
    private WebApplicationContext context;
    @Autowired
    private JwtService jwtService;
    @Autowired
    private UsuarioRepository usuarioRepository;
    @Autowired
    private CargoRepository cargoRepository;

    private MockMvc mockMvc;
    private String tokenAdmin;
    private String tokenCoordenador;
    private String tokenPsicopedagogo;
    private String tokenProfessor;
    private String tokenAlunoApoiador;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(context)
                .apply(SecurityMockMvcConfigurers.springSecurity())
                .build();

        String sufixo = UUID.randomUUID().toString().substring(0, 8);
        tokenAdmin = criarUsuarioEToken("admin.cargo." + sufixo + "@sigi.ifpb.edu.br", Role.ADMIN, NivelRestricao.SUPER_RESTRICAO, true);
        tokenCoordenador = criarUsuarioEToken("coord.cargo." + sufixo + "@sigi.ifpb.edu.br", Role.COORDENADOR, NivelRestricao.SUPER_RESTRICAO, false);
        tokenPsicopedagogo = criarUsuarioEToken("psico.cargo." + sufixo + "@sigi.ifpb.edu.br", Role.CLAI_PSICOPEDAGOGO, NivelRestricao.RESTRICAO_MODERADA, true);
        tokenProfessor = criarUsuarioEToken("prof.cargo." + sufixo + "@sigi.ifpb.edu.br", Role.PROFESSOR, NivelRestricao.ACESSO_FUNCIONAL, false);
        tokenAlunoApoiador = criarUsuarioEToken("apoiador.cargo." + sufixo + "@sigi.ifpb.edu.br", Role.ALUNO_APOIADOR, NivelRestricao.ACESSO_FUNCIONAL, false);
    }

    private String criarUsuarioEToken(String email, Role role, NivelRestricao nivel, boolean authSaude) {
        Usuario usuario = new Usuario("Usuario " + role.name(), email, "hash", role, nivel, authSaude);
        usuario.setAcessoAtivo(true);
        usuario.setTokenVersion(1);
        usuario = usuarioRepository.saveAndFlush(usuario);
        return jwtService.gerarToken(usuario);
    }

    @Test
    @DisplayName("ADMIN e COORDENADOR conseguem criar, consultar, atualizar, alterar status e excluir cargos")
    void adminECoordenadorPodemExecutarCrudCompleto() throws Exception {
        String sufixo = UUID.randomUUID().toString().substring(0, 6).toUpperCase();
        String codigoCoord = "INTERPRETE_LIBRAS_" + sufixo;
        String codigoAdmin = "ASSISTENTE_SOCIAL_" + sufixo;

        // 1. COORDENADOR cria cargo (normaliza código com espaços/minúsculas)
        MvcResult criadoCoord = mockMvc.perform(post("/api/cargos")
                        .header("Authorization", "Bearer " + tokenCoordenador)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "codigo": "interprete libras %s",
                                  "nome": "Intérprete de Libras",
                                  "descricao": "Atua na mediação linguística em sala de aula.",
                                  "nivelRestricaoPadrao": "ACESSO_FUNCIONAL",
                                  "autorizacaoSaudePadrao": false
                                }
                                """.formatted(sufixo.toLowerCase())))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.codigo").value(codigoCoord))
                .andExpect(jsonPath("$.nome").value("Intérprete de Libras"))
                .andExpect(jsonPath("$.nivelRestricaoPadrao").value("ACESSO_FUNCIONAL"))
                .andExpect(jsonPath("$.autorizacaoSaudePadrao").value(false))
                .andExpect(jsonPath("$.ativo").value(true))
                .andExpect(jsonPath("$.sistema").value(false))
                .andReturn();

        String idCoord = extrairId(criadoCoord.getResponse().getContentAsString());

        // 2. ADMIN cria outro cargo
        MvcResult criadoAdmin = mockMvc.perform(post("/api/cargos")
                        .header("Authorization", "Bearer " + tokenAdmin)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "codigo": "%s",
                                  "nome": "Assistente Social",
                                  "descricao": "Acompanhamento sociofamiliar.",
                                  "nivelRestricaoPadrao": "RESTRICAO_MODERADA",
                                  "autorizacaoSaudePadrao": true
                                }
                                """.formatted(codigoAdmin)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.codigo").value(codigoAdmin))
                .andExpect(jsonPath("$.nivelRestricaoPadrao").value("RESTRICAO_MODERADA"))
                .andExpect(jsonPath("$.autorizacaoSaudePadrao").value(true))
                .andReturn();

        String idAdmin = extrairId(criadoAdmin.getResponse().getContentAsString());

        // 3. Listagem e busca por ID
        mockMvc.perform(get("/api/cargos")
                        .header("Authorization", "Bearer " + tokenCoordenador)
                        .param("busca", "Libras"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].codigo", hasItem(codigoCoord)));

        mockMvc.perform(get("/api/cargos/" + idAdmin)
                        .header("Authorization", "Bearer " + tokenAdmin))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nome").value("Assistente Social"));

        // 4. Atualização (PUT) pelo COORDENADOR
        mockMvc.perform(put("/api/cargos/" + idCoord)
                        .header("Authorization", "Bearer " + tokenCoordenador)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "codigo": "%s",
                                  "nome": "Tradutor e Intérprete de Libras",
                                  "descricao": "Atuação pedagógica e eventos institucionais.",
                                  "nivelRestricaoPadrao": "RESTRICAO_MODERADA",
                                  "autorizacaoSaudePadrao": false,
                                  "ativo": true
                                }
                                """.formatted(codigoCoord)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nome").value("Tradutor e Intérprete de Libras"))
                .andExpect(jsonPath("$.nivelRestricaoPadrao").value("RESTRICAO_MODERADA"));

        // 5. Alteração de status (PATCH) pelo ADMIN e filtro apenasAtivos
        mockMvc.perform(patch("/api/cargos/" + idCoord + "/status")
                        .header("Authorization", "Bearer " + tokenAdmin)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"ativo\": false}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.ativo").value(false));

        mockMvc.perform(get("/api/cargos")
                        .header("Authorization", "Bearer " + tokenAdmin)
                        .param("apenasAtivos", "true"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].codigo", not(hasItem(codigoCoord))));

        // 6. Exclusão (DELETE) pelo COORDENADOR e verificação de soft-delete
        mockMvc.perform(delete("/api/cargos/" + idCoord)
                        .header("Authorization", "Bearer " + tokenCoordenador))
                .andExpect(status().isNoContent());

        assertFalse(cargoRepository.findById(UUID.fromString(idCoord)).isPresent());
        assertTrue(cargoRepository.findById(UUID.fromString(idAdmin)).isPresent());
    }

    @Test
    @DisplayName("Demais perfis recebem 403 em criação/edição/exclusão e anônimo recebe 401")
    void deveBloquearEscritaParaPerfisSemPermissaoEAnonimo() throws Exception {
        Cargo cargoExistente = cargoRepository.saveAndFlush(new Cargo(
                "CARGO_RBAC_" + UUID.randomUUID().toString().substring(0, 6).toUpperCase(),
                "Cargo Teste RBAC",
                "Descrição",
                NivelRestricao.ACESSO_FUNCIONAL,
                false,
                true,
                false
        ));

        String payloadValido = """
                {
                  "codigo": "NOVO_CARGO_TESTE",
                  "nome": "Novo Cargo",
                  "descricao": "Teste",
                  "nivelRestricaoPadrao": "ACESSO_FUNCIONAL"
                }
                """;

        // Sem token -> 401
        mockMvc.perform(get("/api/cargos")).andExpect(status().isUnauthorized());
        mockMvc.perform(post("/api/cargos")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payloadValido))
                .andExpect(status().isUnauthorized());

        // Professor, Psicopedagogo e Aluno Apoiador -> 401/403 (403 Forbidden) nas mutações, 200 no GET
        for (String token : new String[]{tokenProfessor, tokenPsicopedagogo, tokenAlunoApoiador}) {
            mockMvc.perform(get("/api/cargos")
                            .header("Authorization", "Bearer " + token))
                    .andExpect(status().isOk());

            mockMvc.perform(post("/api/cargos")
                            .header("Authorization", "Bearer " + token)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(payloadValido))
                    .andExpect(status().isForbidden());

            mockMvc.perform(put("/api/cargos/" + cargoExistente.getId())
                            .header("Authorization", "Bearer " + token)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(payloadValido))
                    .andExpect(status().isForbidden());

            mockMvc.perform(patch("/api/cargos/" + cargoExistente.getId() + "/status")
                            .header("Authorization", "Bearer " + token)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"ativo\": false}"))
                    .andExpect(status().isForbidden());

            mockMvc.perform(delete("/api/cargos/" + cargoExistente.getId())
                            .header("Authorization", "Bearer " + token))
                    .andExpect(status().isForbidden());
        }
    }

    @Test
    @DisplayName("Regras de negócio: impede duplicidade de código (409) e protege cargos estruturais do sistema (400)")
    void deveValidarConflitoDeCodigoEProtecaoSistema() throws Exception {
        String sufixo = UUID.randomUUID().toString().substring(0, 6).toUpperCase();
        String codigoSistema = "SYS_COORD_" + sufixo;

        Cargo cargoSistema = cargoRepository.saveAndFlush(new Cargo(
                codigoSistema,
                "Coordenador Estrutural",
                "Cargo base do sistema",
                NivelRestricao.SUPER_RESTRICAO,
                false,
                true,
                true
        ));

        // Tentativa de criar duplicado -> 409 Conflict
        mockMvc.perform(post("/api/cargos")
                        .header("Authorization", "Bearer " + tokenAdmin)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "codigo": "%s",
                                  "nome": "Outro Nome",
                                  "nivelRestricaoPadrao": "ACESSO_FUNCIONAL"
                                }
                                """.formatted(codigoSistema)))
                .andExpect(status().isConflict());

        // Tentativa de alterar código de cargo do sistema -> 400 Bad Request
        mockMvc.perform(put("/api/cargos/" + cargoSistema.getId())
                        .header("Authorization", "Bearer " + tokenAdmin)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "codigo": "OUTRO_CODIGO",
                                  "nome": "Coordenador Estrutural",
                                  "nivelRestricaoPadrao": "SUPER_RESTRICAO"
                                }
                                """))
                .andExpect(status().isBadRequest());

        // Tentativa de desativar cargo do sistema -> 400 Bad Request
        mockMvc.perform(patch("/api/cargos/" + cargoSistema.getId() + "/status")
                        .header("Authorization", "Bearer " + tokenCoordenador)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"ativo\": false}"))
                .andExpect(status().isBadRequest());

        // Tentativa de excluir cargo do sistema -> 400 Bad Request
        mockMvc.perform(delete("/api/cargos/" + cargoSistema.getId())
                        .header("Authorization", "Bearer " + tokenAdmin))
                .andExpect(status().isBadRequest());

        // Pode atualizar nome/descrição de cargo do sistema mantendo o código -> 200 OK
        mockMvc.perform(put("/api/cargos/" + cargoSistema.getId())
                        .header("Authorization", "Bearer " + tokenCoordenador)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "codigo": "%s",
                                  "nome": "Coordenação CLAI",
                                  "descricao": "Descrição atualizada",
                                  "nivelRestricaoPadrao": "SUPER_RESTRICAO",
                                  "autorizacaoSaudePadrao": true,
                                  "ativo": true
                                }
                                """.formatted(codigoSistema)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nome").value("Coordenação CLAI"))
                .andExpect(jsonPath("$.autorizacaoSaudePadrao").value(true));
    }

    private String extrairId(String json) {
        int idx = json.indexOf("\"id\":\"");
        int start = idx + 6;
        int end = json.indexOf("\"", start);
        return json.substring(start, end);
    }
}
