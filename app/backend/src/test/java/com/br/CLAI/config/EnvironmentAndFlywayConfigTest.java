package com.br.CLAI.config;

import com.br.CLAI.security.SecurityConfig;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.beans.factory.config.YamlPropertiesFactoryBean;
import org.springframework.core.io.ClassPathResource;

import java.lang.reflect.Constructor;
import java.lang.reflect.Parameter;
import java.util.Properties;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("Configurações por Ambiente, Segredos em PRD, Flyway e ddl-auto: validate")
class EnvironmentAndFlywayConfigTest {

    @Test
    @DisplayName("application.yaml deve habilitar Flyway, ddl-auto: validate e open-in-view: false")
    void applicationYamlDeveConfigurarValidateEFlyway() {
        Properties props = carregarYaml("application.yaml");

        assertEquals("false", props.getProperty("spring.jpa.open-in-view"));
        assertEquals("validate", props.getProperty("spring.jpa.hibernate.ddl-auto"));
        assertEquals("true", props.getProperty("spring.flyway.enabled"));
        assertEquals("${DB_SCHEMA:sigi}", props.getProperty("spring.flyway.schemas"));
        assertEquals("${DB_SCHEMA:sigi}", props.getProperty("spring.flyway.default-schema"));
        assertEquals("classpath:db/migration", props.getProperty("spring.flyway.locations"));
    }

    @Test
    @DisplayName("application-dev.yaml deve incluir seeds de desenvolvimento no Flyway")
    void applicationDevDeveIncluirSeedsNoFlyway() {
        Properties props = carregarYaml("application-dev.yaml");
        String locations = props.getProperty("spring.flyway.locations");

        assertNotNull(locations);
        assertTrue(locations.contains("classpath:db/migration"));
        assertTrue(locations.contains("classpath:db/seed/dev"));
    }

    @Test
    @DisplayName("application-prd.yaml deve isolar migrations estruturais e não possuir valores padrão para segredos ou banco")
    void applicationPrdNaoDevePossuirDefaultsDeSegredosNemSeeds() {
        Properties props = carregarYaml("application-prd.yaml");

        assertEquals("classpath:db/migration", props.getProperty("spring.flyway.locations"));
        assertEquals("true", props.getProperty("spring.flyway.clean-disabled"));

        assertEquals("${JWT_SECRET}", props.getProperty("sigi.security.jwt-secret"));
        assertEquals("${AES_KEY}", props.getProperty("sigi.security.aes-key"));
        assertEquals("${SPRING_DATASOURCE_URL}", props.getProperty("spring.datasource.url"));
        assertEquals("${SPRING_DATASOURCE_USERNAME}", props.getProperty("spring.datasource.username"));
        assertEquals("${SPRING_DATASOURCE_PASSWORD}", props.getProperty("spring.datasource.password"));
    }

    @Test
    @DisplayName("SecurityConfig não deve possuir fallback hardcoded de jwt-secret na anotação @Value e deve rejeitar valor vazio")
    void securityConfigNaoDeveTerFallbackHardcodedDeJwtSecret() throws NoSuchMethodException {
        Constructor<SecurityConfig> ctor = SecurityConfig.class.getConstructor(String.class, java.util.List.class);
        Parameter[] params = ctor.getParameters();
        Value valueAnnotation = params[0].getAnnotation(Value.class);

        assertNotNull(valueAnnotation);
        assertEquals("${sigi.security.jwt-secret}", valueAnnotation.value());
        assertThrows(IllegalArgumentException.class, () -> new SecurityConfig("   "));
    }

    @Test
    @DisplayName("Scripts de migration e seeds de desenvolvimento devem existir no classpath do Flyway")
    void scriptsFlywayDevemExistirNoClasspath() {
        assertTrue(new ClassPathResource("db/migration/V1__create_initial_schema.sql").exists());
        assertTrue(new ClassPathResource("db/migration/V2__constraints_indexes_and_comments.sql").exists());
        assertTrue(new ClassPathResource("db/seed/dev/R__01_seed_us11_rbac.sql").exists());
        assertTrue(new ClassPathResource("db/seed/dev/R__02_seed_us02_estudo_caso.sql").exists());
        assertTrue(new ClassPathResource("db/seed/dev/R__03_seed_us03_planejamento_pedagogico.sql").exists());
    }

    private Properties carregarYaml(String resourcePath) {
        YamlPropertiesFactoryBean factory = new YamlPropertiesFactoryBean();
        factory.setResources(new ClassPathResource(resourcePath));
        Properties props = factory.getObject();
        assertNotNull(props, "Não foi possível carregar " + resourcePath);
        return props;
    }
}
