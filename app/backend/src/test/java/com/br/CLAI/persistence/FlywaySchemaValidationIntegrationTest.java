package com.br.CLAI.persistence;

import com.br.CLAI.repository.UsuarioRepository;
import org.flywaydb.core.Flyway;
import org.flywaydb.core.api.MigrationInfo;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.postgresql.PostgreSQLContainer;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.Statement;
import java.util.Arrays;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("dev")
@Testcontainers(disabledWithoutDocker = true)
@DisplayName("Integração Flyway + Hibernate ddl-auto: validate em PostgreSQL 16")
class FlywaySchemaValidationIntegrationTest {

    @Container
    @ServiceConnection
    static PostgreSQLContainer postgres = new PostgreSQLContainer("postgres:16-alpine");

    @Autowired
    private Flyway flyway;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Test
    @DisplayName("Perfil dev: Flyway aplica V1, V2 e seeds R__01..03 e Hibernate validate passa")
    void deveExecutarMigrationsESeedsDevEValidarSchemaJpa() {
        List<String> scriptsAplicados = Arrays.stream(flyway.info().applied())
                .map(MigrationInfo::getScript)
                .filter(script -> script != null && script.endsWith(".sql"))
                .toList();

        assertEquals(List.of(
                "V1__create_initial_schema.sql",
                "V2__constraints_indexes_and_comments.sql",
                "V3__alinhamento_anexo_iii_pei_pea.sql",
                "V4__evolucao_estudo_caso_versionamento_e_historico.sql",
                "V5__evolucao_plano_acao_anexo_iii.sql",
                "R__01_seed_us11_rbac.sql",
                "R__02_seed_us02_estudo_caso.sql",
                "R__03_seed_us03_planejamento_pedagogico.sql"
        ), scriptsAplicados);

        Integer totalTabelasSigi = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'sigi' AND table_type = 'BASE TABLE'",
                Integer.class
        );
        assertEquals(12, totalTabelasSigi, "11 tabelas de domínio + flyway_schema_history no schema sigi.");

        Integer indiceEstudoAtivo = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'sigi' AND indexname = 'idx_estudo_caso_ativo'",
                Integer.class
        );
        assertEquals(1, indiceEstudoAtivo);

        assertEquals(5, usuarioRepository.count(), "Os 5 usuários base RBAC devem ser semeados em dev.");
    }

    @Test
    @DisplayName("Perfil prd: Flyway aplica apenas db/migration (V1 a V5) sem inserir dados fictícios")
    void deveExecutarApenasMigrationsEstruturaisSemSeedsParaPrd() throws Exception {
        String baseUrl = postgres.getJdbcUrl();
        try (Connection conn = DriverManager.getConnection(baseUrl, postgres.getUsername(), postgres.getPassword());
             Statement stmt = conn.createStatement()) {
            stmt.execute("CREATE DATABASE sigi_prd_check");
        }

        String prdUrl = baseUrl.replace("/" + postgres.getDatabaseName(), "/sigi_prd_check");
        Flyway prdFlyway = Flyway.configure()
                .dataSource(prdUrl, postgres.getUsername(), postgres.getPassword())
                .schemas("sigi")
                .defaultSchema("sigi")
                .locations("classpath:db/migration")
                .load();

        prdFlyway.migrate();

        List<String> scriptsPrd = Arrays.stream(prdFlyway.info().applied())
                .map(MigrationInfo::getScript)
                .filter(script -> script != null && script.endsWith(".sql"))
                .toList();

        assertEquals(List.of(
                "V1__create_initial_schema.sql",
                "V2__constraints_indexes_and_comments.sql",
                "V3__alinhamento_anexo_iii_pei_pea.sql",
                "V4__evolucao_estudo_caso_versionamento_e_historico.sql",
                "V5__evolucao_plano_acao_anexo_iii.sql"
        ), scriptsPrd);

        try (Connection prdConn = DriverManager.getConnection(prdUrl, postgres.getUsername(), postgres.getPassword());
             Statement stmt = prdConn.createStatement();
             var rs = stmt.executeQuery("SELECT COUNT(*) FROM sigi.usuario")) {
            assertTrue(rs.next());
            assertEquals(0, rs.getInt(1), "Banco de produção não deve conter usuários de teste.");
        }
    }
}
