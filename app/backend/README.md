# SIGI / CLAI — Documentação Técnica do Back-end

API REST do **Sistema Integrado de Gestão Inclusiva (SIGI)** da **Coordenação Local de Acessibilidade e Inclusão (CLAI)** do IFPB.

- Código-fonte do back-end: [`app/backend`](.)
- Front-end (React/Vite): [`app/frontend`](../frontend/README.md)
- Execução completa via Docker (db + backend + frontend): [`DOCKER_GUIDE.md`](../../DOCKER_GUIDE.md)
- Detalhes de banco de dados: [`app/backend/database/README.md`](database/README.md)

## Sumário

1. [Visão Geral do Projeto](#1-visão-geral-do-projeto-sigi--clai)
2. [Arquitetura e Comportamento do Sistema](#2-arquitetura-e-comportamento-do-sistema)
3. [Como Configurar e Executar o Projeto Localmente](#3-como-configurar-e-executar-o-projeto-localmente)
4. [Catálogo de Endpoints da API](#4-catálogo-de-endpoints-da-api)
5. [Tratamento de Erros e Exceções](#5-tratamento-de-erros-e-exceções-handler-e-exception)
6. [Como Testar a API no Postman](#6-como-testar-a-api-no-postman-collection)

---

## 1. Visão Geral do Projeto (SIGI / CLAI)

### Propósito da API

A API centraliza o acompanhamento pedagógico de estudantes com necessidades específicas e expõe:

| Módulo | O que faz |
| :--- | :--- |
| **Estudo de Caso** | Registro do diagnóstico inicial, indicadores reutilizáveis (barreiras/necessidades) e **histórico familiar/socioemocional (dados sensíveis)**. Ciclo `RASCUNHO` → `ATIVO` → `ENCERRADO`. |
| **Planejamento Pedagógico (PEI / PEA)** | **PEI** (Plano de Ensino Individualizado) e **PEA** (Plano de Ensino Adaptado, por disciplina), ambos vinculados a um *Acompanhamento* do aluno. |
| **Timeline** | Linha do tempo cronológica unificada (Estudo de Caso, PEI e PEA) do aluno. |
| **Prontuário Unificado** | Consolidado do estudante (estudo vigente, totais de PEI/PEA/anexos) com projeção condicional de dados sensíveis. |
| **Anexos do Estudante** | Upload/download de documentos; laudos e diagnósticos são **criptografados em repouso (AES-256-GCM)**. |
| **Autenticação e RBAC** | Login com JWT, perfis (`Role`), níveis de restrição (`NivelRestricao`), autorização de saúde e revogação imediata de sessão. |

### Stack tecnológica (extraída de [`app/backend/pom.xml`](pom.xml), [`docker-compose.yml`](../../docker-compose.yml) e [`Dockerfile`](Dockerfile))

| Tecnologia | Versão / Detalhe |
| :--- | :--- |
| **Java** | 21 (`java.version`; imagem `eclipse-temurin:21`) |
| **Spring Boot** | 4.1.1 (`spring-boot-starter-parent`) |
| **Spring WebMVC** | `spring-boot-starter-webmvc` |
| **Spring Security** | `spring-boot-starter-security` (stateless, filtro JWT, `@EnableMethodSecurity`) |
| **Spring Data JPA / Hibernate** | `spring-boot-starter-data-jpa` (`ddl-auto: none`, `@SoftDelete`, JPA Auditing) |
| **Bean Validation** | `spring-boot-starter-validation` |
| **Actuator** | `spring-boot-starter-actuator` (health check do container) |
| **JWT** | `io.jsonwebtoken` `jjwt-api` / `jjwt-impl` / `jjwt-jackson` **0.12.6** (HS256 via `Keys.hmacShaKeyFor`) |
| **Senhas** | `BCryptPasswordEncoder` |
| **Banco de dados** | **PostgreSQL 16** (`postgres:16-alpine`; scripts compatíveis com 14+) + driver `org.postgresql:postgresql` |
| **DevTools** | `spring-boot-devtools` (runtime, opcional) |
| **Testes** | starters de teste (actuator, data-jpa, validation, webmvc) + `spring-security-test` |
| **Build** | Maven (wrapper `mvnw` incluso) · Artefato `com.br:CLAI:0.0.1-SNAPSHOT` |
| **Erros** | RFC 9457 — `ProblemDetail` (`application/problem+json`) |

---

## 2. Arquitetura e Comportamento do Sistema

### Estrutura de pacotes (`com.br.CLAI`)

| Pacote | Papel |
| :--- | :--- |
| `controller` | Endpoints REST: `AuthController`, `UsuarioAdminController`, `EstudoDeCasoController`, `ProntuarioController`, `PeiController`, `PeaController`, `AnexoEstudanteController`, `TimelineController`. |
| `domain` | Entidades JPA (`schema = sigi`) que herdam de `BaseEntity`: `Usuario`, `Aluno`, `Acompanhamento`, `EstudoDeCaso`, `IndicadorReutilizavel`, `PlanoAcao`, `Pei`, `Pea`, `AnexoEstudante`. Subpacote `domain.enums`: `Role`, `NivelRestricao`, `StatusEstudoCaso`, `TipoClassificacaoAnexo`. |
| `dto` | Contratos da API como `record`s Java. `dto.request` (entrada + Bean Validation) e `dto.response` (saída). |
| `exception` | Exceções de negócio: `NaoEncontradoException`, `RegraDeNegocioException`, `AcessoNegadoException`. |
| `handler` | `GlobalExceptionHandler` (`@RestControllerAdvice`) → converte exceções em `ProblemDetail`. |
| `mapper` | Conversão manual Entidade ↔ DTO (`EstudoDeCasoMapper`, `PeaMapper`, `PeiMapper`). O `EstudoDeCasoMapper` aplica a omissão de dados sensíveis. |
| `repository` | Interfaces Spring Data JPA (um por entidade). |
| `security` | `SecurityConfig`, `JwtAuthenticationFilter`, `JwtService`, `RbacGuard`, `UserDetailsServiceImpl`. |
| `service` | Regras de negócio e orquestração (`EstudoDeCasoService`, `PeiService`, `PeaService`, `ProntuarioService`, `TimelineService`, `AnexoEstudanteService`, `CryptoStorageService`, `AuthService`, `UsuarioAdminService`). Subpacote `service.validator` → `EstudoDeCasoValidator`. |

### Comportamentos padrão da API

#### 2.1 Autenticação e Autorização (RBAC)

**Login e token**

1. `POST /api/v1/auth/login` com `email` e `senha` (BCrypt). Retorna `token`, `tipoToken = "Bearer"` e dados do usuário.
2. Todas as demais rotas exigem o header:
   ```http
   Authorization: Bearer <token>
   ```
3. O JWT (HS256) tem `subject = email` e as claims `role`, `nivelRestricao`, `autorizacaoSaude`, `tokenVersion`, `nome`, `userId`. Expiração padrão: **8 h** (`sigi.security.jwt-expiration-ms`, padrão `28800000`).
4. A sessão é **stateless** (`SessionCreationPolicy.STATELESS`, CSRF desabilitado).
5. O `JwtAuthenticationFilter` valida a cada requisição: assinatura/expiração, existência do usuário, `acessoAtivo = true` e `tokenVersion` do token == `tokenVersion` do banco. O usuário autenticado vira o *principal* (`Usuario`), e **o ID do auditor (`criadoPor`/`atualizadoPor`) vem sempre do token** — o header `X-User-Id` **não é lido** pelo back-end.
6. **Revogação imediata (TA11.4):** `PATCH /api/v1/admin/usuarios/{id}/revogar-acesso` define `acessoAtivo = false` e incrementa `tokenVersion`; tokens anteriores passam a receber `401`.

**Regras do `SecurityFilterChain`** ([`SecurityConfig`](src/main/java/com/br/CLAI/security/SecurityConfig.java))

| Rota | Regra |
| :--- | :--- |
| `POST /api/v1/auth/login`, `/actuator/**` | Pública |
| `/api/v1/admin/**` | `hasRole('ADMIN')` |
| Qualquer outra | Autenticada |

**Perfis e níveis** (enums de `domain.enums`)

| `Role` | Authority gerada | `NivelRestricao` | Authority gerada |
| :--- | :--- | :--- | :--- |
| `ADMIN`, `COORDENADOR`, `CLAI_PSICOPEDAGOGO`, `PROFESSOR`, `ALUNO_APOIADOR` | `ROLE_<ROLE>` | `SUPER_RESTRICAO`, `RESTRICAO_MODERADA`, `ACESSO_FUNCIONAL` | `REST_<NIVEL>` |

Além disso, `autorizacaoSaude = true` gera a authority `AUTH_SAUDE`.

**Matriz granular (Task #52 — TA11.3 / TA3.2)** — implementada por [`RbacGuard`](src/main/java/com/br/CLAI/security/RbacGuard.java):

| Perfil (nível) | Dados sensíveis no Estudo de Caso / Prontuário | `GET .../historico-socioemocional` | `GET /api/peis/{id}/anexos-sensiveis` |
| :--- | :--- | :--- | :--- |
| `PROFESSOR`, `ALUNO_APOIADOR` (`ACESSO_FUNCIONAL`) | **Omitidos** do JSON (`@JsonInclude(NON_NULL)`) | `403` | `403` |
| `CLAI_PSICOPEDAGOGO` (`RESTRICAO_MODERADA`) | Presentes | `200` | `200` |
| `COORDENADOR`, `ADMIN` (`SUPER_RESTRICAO`) | Presentes | `200` | `200` |

- `RbacGuard.temRestricaoModeradaOuSuperior()` é `true` se o nível for `RESTRICAO_MODERADA`/`SUPER_RESTRICAO` **ou** a role for `CLAI_PSICOPEDAGOGO`/`COORDENADOR`/`ADMIN` (e o acesso estiver ativo). É usado em `@PreAuthorize("@rbacGuard.temRestricaoModeradaOuSuperior()")` e na projeção de dados nos mappers/services.
- **Download de anexo sensível (TA11.2):** exige `nivelRestricao = SUPER_RESTRICAO` **e** `autorizacaoSaude = true` (conferido em `AnexoEstudanteService`). Nos dados de seed, só o `ADMIN` atende a ambos.
- As demais rotas não possuem `@PreAuthorize`: basta estar autenticado (ver coluna "Roles" nas tabelas da seção 4).

#### 2.2 Soft Delete (Exclusão Lógica)

- `BaseEntity` (`@MappedSuperclass`) é anotada com `@SoftDelete` do Hibernate: **todas** as entidades herdam a coluna `deleted BOOLEAN NOT NULL DEFAULT FALSE`.
- `repository.delete(entidade)` é interceptado e vira `UPDATE ... SET deleted = true`; o registro **permanece fisicamente no banco**.
- Consultas (`findById`, `findAll`, derivadas) **ignoram automaticamente** registros excluídos — um recurso excluído passa a responder `404`, e não aparece na Timeline, no Prontuário nem nas listagens.
- Antes de excluir, os services gravam `atualizadoPor` (auditoria). A `BaseEntity` também traz `criadoEm`/`atualizadoEm` (JPA Auditing, `@EnableJpaAuditing`) e `criadoPor`/`atualizadoPor`.
- O índice único parcial `idx_estudo_caso_ativo` considera apenas `deleted = FALSE`.
- Rotas `DELETE`: Estudo de Caso (somente `RASCUNHO`), PEA e PEI (`204 No Content`).

#### 2.3 Regras de domínio relevantes

**Estudo de Caso** (`EstudoDeCasoService` + `EstudoDeCasoValidator`)

- Status: `RASCUNHO`, `ATIVO`, `ENCERRADO` (obrigatório na requisição).
- **TA2.3:** status `ENCERRADO` exige `diagnosticoInicial` não vazio **e** ao menos 1 indicador (`indicadoresIds`) → `400`. `RASCUNHO`/`ATIVO` aceitam campos vazios.
- **TA2.4:** só pode existir **1 estudo `ATIVO` por aluno** (checado no service e garantido por índice único parcial no banco).
- Estudo `ATIVO`/`ENCERRADO` **não pode voltar para `RASCUNHO`** e **não pode ser excluído**; apenas rascunhos são descartáveis.
- Aluno inexistente na criação → `400` (`RegraDeNegocioException`); indicadores inexistentes → `400`.
- **Dados sensíveis:** `historicoFamiliar` e `historicoSocioemocional` são gravados normalmente, mas **só aparecem na resposta** para `RESTRICAO_MODERADA` ou superior. No `PUT`, `status`/`diagnosticoInicial`/`indicadoresIds` (se enviado) são substituídos; os históricos só são alterados se enviados (não nulos).
- **TA2.2:** `criadoPor`/`atualizadoPor` gravados a partir do usuário do token.

**PEI / PEA** (`PeiService`, `PeaService`)

- Ambos pertencem a um **`Acompanhamento`** (ponte Aluno ↔ planos). Não há endpoint REST para criar `Acompanhamento`: ele é criado por seed/SQL. `acompanhamentoId` inexistente → `404`.
- `PUT` é **parcial**: campos `null` são ignorados.
- `PeaResponseDTO.alunoId` é derivado do acompanhamento; `disciplinaId` é opcional.
- **TA3.2:** `GET /api/peis/{id}/anexos-sensiveis` devolve os PEAs do acompanhamento do PEI, restrito a `RESTRICAO_MODERADA`+ (`403` para `PROFESSOR`).
- **TA3.4:** `DELETE` é soft delete com trilha de auditoria.
- `PlanoAcao` existe no domínio/banco, mas **não possui controller**.

**Anexos do Estudante** (`AnexoEstudanteService`, `CryptoStorageService`)

| `TipoClassificacaoAnexo` | Sensível | Armazenamento |
| :--- | :---: | :--- |
| `LAUDO_MEDICO` | Sim | Cifrado **AES/GCM/NoPadding**, chave 256 bits, IV aleatório de 12 bytes (Base64 em `iv`), tag 128 bits; arquivo salvo com sufixo `.enc` |
| `DIAGNOSTICO_NEUROPSICOLOGICO` | Sim | Idem |
| `DOCUMENTO_PEDAGOGICO` | Não | Gravado em claro |

- Arquivos ficam em `ATTACHMENTS_STORAGE_PATH/{alunoId}/{uuid}_{nome}`; nome sanitizado (`[^a-zA-Z0-9._-]` → `_`); proteção contra *path traversal*.
- O download decifra **somente em memória** (nenhum arquivo temporário) e responde com `Content-Disposition: attachment` e `Cache-Control: no-store`.
- A listagem devolve apenas metadados (nunca caminho físico nem IV).
- Documento **não sensível**: qualquer usuário autenticado pode baixar.
- A chave `AES_KEY` deve ter exatamente **32 bytes** (32 caracteres ou 64 hex), senão a aplicação não sobe.

**Prontuário e Timeline**

- `GET /api/v1/estudantes/{id}/prontuario`: usa o estudo `ATIVO` (ou o último, se não houver ativo) e retorna `totalPeis`, `totalPeas`, `totalAnexos`; históricos sensíveis só para `RESTRICAO_MODERADA`+.
- `GET /api/alunos/{alunoId}/timeline`: agrega eventos `ESTUDO_DE_CASO`, `PEI` e `PEA` (`id`, `tipo`, `dataCriacao`), ordenados por `dataCriacao` **crescente** (desempate por `id`). Registros excluídos logicamente não aparecem. Aluno sem registros retorna `[]`.

---

## 3. Como Configurar e Executar o Projeto Localmente

### Pré-requisitos

- **JDK 21**
- **Docker + Docker Compose** (Opção A) **ou** PostgreSQL 14+ instalado (Opção B)
- Maven (ou use o wrapper `mvnw` / `mvnw.cmd` em `app/backend`)

### Credenciais e variáveis (padrões do projeto)

| Variável | Padrão | Uso |
| :--- | :--- | :--- |
| `POSTGRES_DB` | `sigi_clai` | Nome do banco |
| `POSTGRES_USER` / `POSTGRES_PASSWORD` | `postgres` / `postgres` | Credenciais (container) |
| `GROUP_DB_USER` / `GROUP_DB_PASSWORD` | `postgres` / `postgres` | Credenciais lidas pelo `application.yaml` em execução local |
| `DB_HOST` / `DB_PORT` | `localhost` / `5432` | Host/porta do banco |
| `DB_SCHEMA` | `sigi` | Schema Hibernate (`default_schema`) |
| `SPRING_DATASOURCE_URL` / `_USERNAME` / `_PASSWORD` | derivados dos itens acima | Sobrescrevem a conexão (usados no `docker-compose`) |
| `SERVER_PORT` | `8080` | Porta da API |
| `JWT_SECRET` | `dev-only-jwt-secret-key-change-in-production-minimum-256-bits` (`application.yaml`); o `docker-compose` injeta `sigi-clai-dev-jwt-secret-key-2026-ifpb-change-in-prod` | Chave HMAC do JWT (≥ 32 caracteres) |
| `AES_KEY` | `0123456789abcdef0123456789abcdef` | Chave AES-256 dos anexos sensíveis (**trocar em produção**) |
| `ATTACHMENTS_STORAGE_PATH` | `/app/storage/anexos` | Diretório dos anexos |

> [!WARNING]
> `JWT_SECRET` e `AES_KEY` padrão servem **apenas para desenvolvimento**. Trocar a `AES_KEY` torna ilegíveis os anexos já cifrados.

> [!NOTE]
> O `application.yaml` usa `ddl-auto: none`: **o banco precisa ter o schema criado** (via scripts de `database/`). A aplicação não cria tabelas.

### Opção A — Via Docker (Recomendado)

O serviço `db` do [`docker-compose.yml`](../../docker-compose.yml) é o container **`sigi-db`** (`postgres:16-alpine`), com porta **`5432:5432`** (configurável por `DB_PORT`), volume persistente `sigi_postgres_data` e healthcheck (`pg_isready`).

```bash
# 1. (opcional) copie o modelo de variáveis; sem .env valem os padrões acima
cp .env.example .env            # PowerShell: Copy-Item .env.example .env

# 2. suba somente o banco
docker compose up -d db
```

Na **primeira inicialização** (volume vazio) o PostgreSQL executa automaticamente, em ordem alfabética, os scripts montados em `/docker-entrypoint-initdb.d/`:

| Ordem | Origem (host) | Destino no container |
| :---: | :--- | :--- |
| 1 | `app/backend/database/schema/01_create_tables.sql` | `01-create-tables.sql` |
| 2 | `app/backend/database/schema/02_alter_tables_constraints.sql` | `02-alter-tables-constraints.sql` |
| 3 | `app/backend/database/inserts/01_seed_us11_rbac.sql` | `03-seed-us11-rbac.sql` |
| 4 | `app/backend/database/inserts/02_seed_us02_estudo_caso.sql` | `04-seed-us02-estudo-caso.sql` |
| 5 | `app/backend/database/inserts/03_seed_us03_planejamento_pedagogico.sql` | `05-seed-us03-planejamento-pedagogico.sql` |

> [!NOTE]
> **Verificação do `docker-compose.yml`:** os cinco volumes já apontam corretamente para `database/schema/` e `database/inserts/` (todos os arquivos existem) e a ordem de execução está correta — nenhum ajuste foi necessário.

> [!IMPORTANT]
> Os scripts só rodam quando o volume de dados está vazio. Para recriar o banco do zero (apaga os dados): `docker compose down -v && docker compose up -d db`.

Para subir também API e front-end em containers: `docker compose up -d --build` (veja o [`DOCKER_GUIDE.md`](../../DOCKER_GUIDE.md)).

Verificação rápida:
```bash
docker exec -it sigi-db psql -U postgres -d sigi_clai -c "SELECT email, role FROM sigi.usuario;"
```

### Opção B — PostgreSQL Nativo / Clientes Externos (DBeaver, pgAdmin)

1. **Conexão** (também vale para o container da Opção A):

   | Parâmetro | Valor |
   | :--- | :--- |
   | Host | `localhost` |
   | Porta | `5432` |
   | Banco | `sigi_clai` |
   | Usuário / Senha | `postgres` / `postgres` |
   | Schema | `sigi` |

   > Se já houver um PostgreSQL local usando a `5432`, pare-o ou defina `DB_PORT` (ex.: `5433`) para o container e use a mesma porta em `DB_PORT`/`SPRING_DATASOURCE_URL` da aplicação.

2. Crie o banco (caso não exista):
   ```sql
   CREATE DATABASE sigi_clai;
   ```
3. Execute **manualmente, nesta ordem exata**, conectado em `sigi_clai`:

   | # | Script | Função |
   | :---: | :--- | :--- |
   | 1 | `app/backend/database/schema/01_create_tables.sql` | Schema `sigi` + 10 tabelas |
   | 2 | `app/backend/database/schema/02_alter_tables_constraints.sql` | Colunas sensíveis, índice único `idx_estudo_caso_ativo`, índices, comentários |
   | 3 | `app/backend/database/inserts/01_seed_us11_rbac.sql` | 5 usuários RBAC (senha `senha123`) |
   | 4 | `app/backend/database/inserts/02_seed_us02_estudo_caso.sql` | 2 alunos + 3 indicadores |
   | 5 | `app/backend/database/inserts/03_seed_us03_planejamento_pedagogico.sql` | 2 acompanhamentos |

   Via `psql` (a partir de `app/backend`):
   ```bash
   psql -U postgres -d sigi_clai -f database/schema/01_create_tables.sql
   psql -U postgres -d sigi_clai -f database/schema/02_alter_tables_constraints.sql
   psql -U postgres -d sigi_clai -f database/inserts/01_seed_us11_rbac.sql
   psql -U postgres -d sigi_clai -f database/inserts/02_seed_us02_estudo_caso.sql
   psql -U postgres -d sigi_clai -f database/inserts/03_seed_us03_planejamento_pedagogico.sql
   ```
   Os seeds usam `ON CONFLICT DO NOTHING` (idempotentes). A ordem importa: seeds dependem das tabelas, e o seed 03 depende de `aluno`/`acompanhamento`. O DDL usa `gen_random_uuid()` (nativo no PostgreSQL 13+).

### Executando a aplicação Spring Boot

```bash
cd app/backend

# Variáveis só são necessárias se diferirem dos padrões (PowerShell: $env:NOME="valor")
export GROUP_DB_USER=postgres
export GROUP_DB_PASSWORD=postgres
export ATTACHMENTS_STORAGE_PATH=./storage/anexos     # recomendado fora do Docker

mvn clean install          # compila e roda os testes (precisam do PostgreSQL acessível)
mvn spring-boot:run        # sobe a API em http://localhost:8080
```

- Sem Maven instalado: `./mvnw spring-boot:run` (Linux/macOS) ou `.\mvnw.cmd spring-boot:run` (Windows).
- Para pular os testes: `mvn clean install -DskipTests`.
- Health check: `GET http://localhost:8080/actuator/health`.
- Fora do Docker, o padrão `/app/storage/anexos` não é adequado: defina `ATTACHMENTS_STORAGE_PATH` para uma pasta local.
- Limite de upload: não há configuração `spring.servlet.multipart.*` no projeto — vale o padrão do Spring (**1 MB por arquivo**).

---

## 4. Catálogo de Endpoints da API

**Convenções**

- Todas as rotas exigem `Authorization: Bearer <token>`, exceto as marcadas como **Pública**.
- "Autenticado" = qualquer usuário ativo com token válido.
- Sucesso: `200 OK` (consulta/atualização), `201 Created` (criação), `204 No Content` (exclusão).
- Erros: ver [seção 5](#5-tratamento-de-erros-e-exceções-handler-e-exception). Todos os IDs são `UUID`.
- O ID do usuário auditor é obtido do token (não é enviado no corpo nem em header).

### 4.1 Autenticação e Administração de Acesso (RBAC)

| Método | Rota | Descrição | Roles / Permissão | Request | Sucesso / Response |
| :---: | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/login` | Autentica e emite o JWT | **Pública** | Body `LoginRequestDTO` | `200` · `LoginResponseDTO` |
| `GET` | `/api/v1/auth/me` | Dados da sessão atual e authorities | Autenticado | — | `200` · `UsuarioSessaoDTO` |
| `PATCH` | `/api/v1/admin/usuarios/{id}/revogar-acesso` | Revoga acesso e invalida todos os tokens do usuário (TA11.4) | `ADMIN` | Path `id` | `200` · `UsuarioRevogadoResponseDTO` |

**DTOs**

- **`LoginRequestDTO`** — `email` *String* `@NotBlank` `@Email`; `senha` *String* `@NotBlank`.
- **`LoginResponseDTO`** — `token` *String*; `tipoToken` *String* (`"Bearer"`); `userId` *UUID*; `nome`; `email`; `role` *Role*; `nivelRestricao` *NivelRestricao*; `autorizacaoSaude` *Boolean*; `tokenVersion` *Integer*.
- **`UsuarioSessaoDTO`** — `id`; `nome`; `email`; `role`; `nivelRestricao`; `autorizacaoSaude`; `acessoAtivo` *Boolean*; `tokenVersion`; `authorities` *List\<String\>* (ex.: `ROLE_ADMIN`, `REST_SUPER_RESTRICAO`, `AUTH_SAUDE`).
- **`UsuarioRevogadoResponseDTO`** — `id`; `email`; `nome`; `acessoAtivo` *Boolean* (`false`); `tokenVersion` *Integer* (incrementado); `mensagem` *String*.

### 4.2 Estudo de Caso (`/api/estudos-de-caso`)

| Método | Rota | Descrição | Roles / Permissão | Request | Sucesso / Response |
| :---: | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/estudos-de-caso/{id}` | Busca um estudo de caso | Autenticado¹ | Path `id` | `200` · `EstudoDeCasoResponseDTO` |
| `GET` | `/api/estudos-de-caso/aluno/{alunoId}` | Lista estudos de um aluno | Autenticado¹ | Path `alunoId` | `200` · `List<EstudoDeCasoResponseDTO>` |
| `POST` | `/api/estudos-de-caso` | Cria estudo (`RASCUNHO`, `ATIVO` ou `ENCERRADO`) | Autenticado | Body `EstudoDeCasoRequestDTO` | `201` · `EstudoDeCasoResponseDTO` |
| `PUT` | `/api/estudos-de-caso/{id}` | Atualiza/conclui estudo | Autenticado | Path `id` + Body `EstudoDeCasoUpdateDTO` | `200` · `EstudoDeCasoResponseDTO` |
| `DELETE` | `/api/estudos-de-caso/{id}` | Descarta rascunho (soft delete) | Autenticado | Path `id` | `204` · sem corpo |

¹ Campos sensíveis (`historicoFamiliar`, `historicoSocioemocional`) só retornam para `RESTRICAO_MODERADA`+; para `PROFESSOR`/`ALUNO_APOIADOR` as chaves são omitidas.

**DTOs**

- **`EstudoDeCasoRequestDTO`** — `alunoId` *UUID* `@NotNull`; `status` *StatusEstudoCaso* `@NotNull`; `diagnosticoInicial` *String* (obrigatório se `ENCERRADO`); `historicoFamiliar` *String*; `historicoSocioemocional` *String*; `indicadoresIds` *List\<UUID\>* (≥ 1 se `ENCERRADO`).
- **`EstudoDeCasoUpdateDTO`** — igual ao anterior, **sem `alunoId`**; `status` `@NotNull`.
- **`EstudoDeCasoResponseDTO`** (`NON_NULL`) — `id`; `alunoId`; `status`; `diagnosticoInicial`; `historicoFamiliar`\*; `historicoSocioemocional`\*; `indicadoresIds` *List\<UUID\>*; `criadoEm`, `atualizadoEm` *LocalDateTime* (\* omitidos sem permissão).

### 4.3 Prontuário Unificado (`/api/v1/estudantes`)

| Método | Rota | Descrição | Roles / Permissão | Request | Sucesso / Response |
| :---: | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/estudantes/{estudanteId}/prontuario` | Prontuário consolidado do estudante (TA11.3) | Autenticado¹ | Path `estudanteId` | `200` · `ProntuarioResponseDTO` |
| `GET` | `/api/v1/estudantes/{estudanteId}/historico-socioemocional` | Histórico familiar e socioemocional completo | `RESTRICAO_MODERADA`+ (`@PreAuthorize("@rbacGuard.temRestricaoModeradaOuSuperior()")`) | Path `estudanteId` | `200` · `HistoricoSocioemocionalResponseDTO` |

¹ Projeção condicional dos campos sensíveis.

**DTOs**

- **`ProntuarioResponseDTO`** (`NON_NULL`) — `alunoId`; `nomeAluno`; `matricula`; `estudoDeCasoId`; `statusEstudoDeCaso`; `diagnosticoInicial`; `historicoFamiliar`\*; `historicoSocioemocional`\*; `totalPeis`, `totalPeas`, `totalAnexos` *int*; `atualizadoEm`.
- **`HistoricoSocioemocionalResponseDTO`** — `alunoId`; `nomeAluno`; `matricula`; `estudoDeCasoId`; `historicoFamiliar`; `historicoSocioemocional`; `atualizadoEm`.

### 4.4 Planejamento Pedagógico — PEI (`/api/peis`)

| Método | Rota | Descrição | Roles / Permissão | Request | Sucesso / Response |
| :---: | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/peis` | Lista todos os PEIs ativos | Autenticado | — | `200` · `List<PeiResponseDTO>` |
| `GET` | `/api/peis/{id}` | Busca PEI por ID | Autenticado | Path `id` | `200` · `PeiResponseDTO` |
| `GET` | `/api/peis/acompanhamento/{acompanhamentoId}` | PEIs de um acompanhamento | Autenticado | Path | `200` · `List<PeiResponseDTO>` |
| `GET` | `/api/peis/aluno/{alunoId}` | PEIs de um aluno | Autenticado | Path | `200` · `List<PeiResponseDTO>` |
| `GET` | `/api/peis/{id}/anexos-sensiveis` | PEAs anexados ao PEI (TA3.2) | `RESTRICAO_MODERADA`+ (`@PreAuthorize`) | Path `id` | `200` · `List<PeaResponseDTO>` |
| `POST` | `/api/peis` | Cria PEI (TA3.1) | Autenticado | Body `PeiRequestDTO` | `201` · `PeiResponseDTO` |
| `PUT` | `/api/peis/{id}` | Atualização parcial do PEI | Autenticado | Path + Body `PeiUpdateDTO` | `200` · `PeiResponseDTO` |
| `DELETE` | `/api/peis/{id}` | Inativa o PEI (soft delete — TA3.4) | Autenticado | Path `id` | `204` · sem corpo |

### 4.5 Planejamento Pedagógico — PEA (`/api/peas`)

| Método | Rota | Descrição | Roles / Permissão | Request | Sucesso / Response |
| :---: | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/peas` | Lista todos os PEAs ativos | Autenticado | — | `200` · `List<PeaResponseDTO>` |
| `GET` | `/api/peas/{id}` | Busca PEA por ID | Autenticado | Path `id` | `200` · `PeaResponseDTO` |
| `GET` | `/api/peas/acompanhamento/{acompanhamentoId}` | PEAs de um acompanhamento | Autenticado | Path | `200` · `List<PeaResponseDTO>` |
| `GET` | `/api/peas/aluno/{alunoId}` | PEAs de um aluno | Autenticado | Path | `200` · `List<PeaResponseDTO>` |
| `POST` | `/api/peas` | Cria PEA | Autenticado | Body `PeaRequestDTO` | `201` · `PeaResponseDTO` |
| `PUT` | `/api/peas/{id}` | Atualização parcial do PEA | Autenticado | Path + Body `PeaUpdateDTO` | `200` · `PeaResponseDTO` |
| `DELETE` | `/api/peas/{id}` | Exclusão lógica do PEA | Autenticado | Path `id` | `204` · sem corpo |

**DTOs (PEI e PEA)**

- **`PeiRequestDTO`** — `acompanhamentoId` *UUID* `@NotNull`; `habilidadesInteresses` *String* `@NotBlank`; `propostasAdaptacoes` *String* `@NotBlank`.
- **`PeiUpdateDTO`** — `habilidadesInteresses`, `propostasAdaptacoes` *String* (sem validação; `null` = não altera).
- **`PeiResponseDTO`** — `id`; `acompanhamentoId`; `alunoId`; `habilidadesInteresses`; `propostasAdaptacoes`; `criadoEm`; `atualizadoEm`.
- **`PeaRequestDTO`** — `acompanhamentoId` *UUID* `@NotNull`; `disciplinaId` *UUID* (opcional); `objetivoGeral` *String* `@NotBlank`; `metodologia` *String* `@NotBlank`; `avaliacao` *String* `@NotBlank`.
- **`PeaUpdateDTO`** — `disciplinaId` *UUID*, `objetivoGeral`, `metodologia`, `avaliacao` *String* (sem validação; `null` = não altera).
- **`PeaResponseDTO`** — `id`; `acompanhamentoId`; `alunoId`; `disciplinaId`; `objetivoGeral`; `metodologia`; `avaliacao`; `criadoEm`; `atualizadoEm`.

### 4.6 Anexos do Estudante (`/api/v1`)

| Método | Rota | Descrição | Roles / Permissão | Request | Sucesso / Response |
| :---: | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/estudantes/{id}/anexos` | Upload de anexo (cifra laudos/diagnósticos — TA11.1) | Autenticado | Path `id` + `multipart/form-data`: `arquivo` (ou `file`) *MultipartFile*, `classificacao` *TipoClassificacaoAnexo* | `201` · `AnexoEstudanteResponseDTO` |
| `GET` | `/api/v1/estudantes/{id}/anexos` | Lista metadados dos anexos do estudante | Autenticado | Path `id` | `200` · `List<AnexoEstudanteResponseDTO>` |
| `GET` | `/api/v1/anexos/{anexoId}/download` | Baixa o arquivo (decifra em memória — TA11.2) | Anexo sensível: `SUPER_RESTRICAO` **+** `autorizacaoSaude=true`. Não sensível: Autenticado | Path `anexoId` | `200` · bytes (`Content-Type` original, `Content-Disposition: attachment`) |

**DTO**

- **`AnexoEstudanteResponseDTO`** — `id`; `alunoId`; `nomeOriginal`; `contentType`; `tamanhoBytes` *Long*; `classificacao` *LAUDO_MEDICO \| DIAGNOSTICO_NEUROPSICOLOGICO \| DOCUMENTO_PEDAGOGICO*; `criptografado` *Boolean*; `criadoEm`.
- Parâmetros do upload: `classificacao` é obrigatória (`400` se ausente/inválida); arquivo vazio/ausente → `400`.

### 4.7 Timeline (`/api/alunos`)

| Método | Rota | Descrição | Roles / Permissão | Request | Sucesso / Response |
| :---: | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/alunos/{alunoId}/timeline` | Eventos do aluno em ordem cronológica (TA9.2) | Autenticado | Path `alunoId` | `200` · `List<TimelineEventDTO>` |

**DTO**

- **`TimelineEventDTO`** — `id` *UUID*; `tipo` *String* (`ESTUDO_DE_CASO` \| `PEI` \| `PEA`); `dataCriacao` *LocalDateTime*.

### 4.8 Monitoramento

| Método | Rota | Descrição | Roles | Sucesso |
| :---: | :--- | :--- | :--- | :--- |
| `GET` | `/actuator/health` | Health check (usado pelo `docker-compose`) | **Pública** | `200` |

---

## 5. Tratamento de Erros e Exceções (`handler` e `exception`)

O [`GlobalExceptionHandler`](src/main/java/com/br/CLAI/handler/GlobalExceptionHandler.java) (`@RestControllerAdvice`) responde sempre com **RFC 9457 `ProblemDetail`** (`application/problem+json`), acrescido do campo `timestamp` (ISO-8601, UTC). O Spring adiciona `instance` com o caminho da requisição.

```json
{
  "type": "https://api.sigi.com/errors/nao-encontrado",
  "title": "Recurso Não Encontrado",
  "status": 404,
  "detail": "Estudo de Caso não encontrado com o ID fornecido.",
  "instance": "/api/estudos-de-caso/00000000-0000-0000-0000-000000000000",
  "timestamp": "2026-10-27T16:30:00.123456Z"
}
```

### Erros mapeados

| Exceção (`com.br.CLAI.exception` ou Spring) | Status HTTP | Título / `type` (`https://api.sigi.com/errors/...`) | Cenário em que ocorre na API |
| :--- | :---: | :--- | :--- |
| `NaoEncontradoException` | **404** | `Recurso Não Encontrado` · `nao-encontrado` | Estudo de Caso, PEA, PEI, Acompanhamento, Estudante, Anexo ou Usuário inexistente (ou excluído logicamente); `GET /estudos-de-caso/aluno/{id}` com aluno inexistente; `GET /prontuario` e anexos com estudante inexistente. |
| `RegraDeNegocioException` | **400** | `Erro de Regra de Negócio` · `regra-de-negocio` | Estudo `ENCERRADO` sem diagnóstico ou sem indicador; 2º estudo `ATIVO` para o mesmo aluno; aluno ou indicador inexistente na criação de estudo; reverter estudo concluído para `RASCUNHO`; excluir estudo `ATIVO`/`ENCERRADO`; upload sem arquivo ou sem classificação; arquivo físico do anexo ausente no volume; falha de I/O no armazenamento. |
| `AcessoNegadoException` | **403** | `Acesso Negado` · `acesso-negado` | Download de anexo sensível sem `SUPER_RESTRICAO` + `autorizacaoSaude`; download sem usuário autenticado resolvido. |
| `AccessDeniedException` (Spring Security, `@PreAuthorize`) | **403** | `Acesso Negado` · `acesso-negado` | `PROFESSOR`/`ALUNO_APOIADOR` em `/historico-socioemocional` ou `/peis/{id}/anexos-sensiveis`; não-`ADMIN` em `/admin/**` com método protegido. Mensagem padrão: *"Seu perfil não possui permissão para acessar este recurso."* |
| `DisabledException` / `LockedException` | **401** | `Sessão Revogada` · `sessao-revogada` | Login de usuário com `acesso_ativo = false`; uso do principal revogado. |
| `AuthenticationCredentialsNotFoundException` / `InsufficientAuthenticationException` | **401** | `Não Autorizado` · `nao-autorizado` | Operação de escrita sem usuário identificado no contexto de segurança. |
| `AuthenticationException` (demais, ex.: `BadCredentialsException`) | **401** | `Falha na Autenticação` · `falha-autenticacao` | Login com e-mail/senha incorretos (*"Credenciais inválidas: e-mail ou senha incorretos."*). |
| `MethodArgumentNotValidException` | **400** | `Erro de Validação de Campos` · `validacao` | Falha de Bean Validation em `@Valid @RequestBody` (ver abaixo). |

### Validação (`MethodArgumentNotValidException` → `400 Bad Request`)

O `detail` concatena `campo: mensagem` de cada violação, separados por vírgula:

```json
{
  "type": "https://api.sigi.com/errors/validacao",
  "title": "Erro de Validação de Campos",
  "status": 400,
  "detail": "objetivoGeral: O objetivo geral é obrigatório, metodologia: A metodologia é obrigatória",
  "instance": "/api/peas",
  "timestamp": "2026-10-27T16:30:00.123456Z"
}
```

Exemplos de mensagens: `alunoId: O ID do aluno é obrigatório`, `status: O status do estudo de caso é obrigatório`, `email: Formato de e-mail inválido`, `senha: A senha é obrigatória`, `acompanhamentoId: O ID do acompanhamento é obrigatório`.

### Erros de segurança (`401` / `403`)

Gerados na cadeia de filtros (antes dos controllers), também em `application/problem+json`:

| Origem | Status | `detail` |
| :--- | :---: | :--- |
| `AuthenticationEntryPoint` (sem header `Authorization`) | **401** `Não Autorizado` | `Autenticação obrigatória para acessar este recurso.` |
| `JwtAuthenticationFilter` — token vazio | **401** | `Token JWT ausente no cabeçalho Authorization.` |
| `JwtAuthenticationFilter` — assinatura inválida/expirado | **401** | `Token JWT inválido ou expirado.` |
| `JwtAuthenticationFilter` — usuário do token não existe | **401** | `Usuário associado ao token não encontrado.` |
| `JwtAuthenticationFilter` — `acesso_ativo = false` | **401** | `Acesso revogado: o vínculo do usuário está desativado.` |
| `JwtAuthenticationFilter` — `tokenVersion` divergente (após revogação) | **401** | `Sessão revogada ou versão do token inválida.` |
| `AccessDeniedHandler` (ex.: não-`ADMIN` em `/api/v1/admin/**`) | **403** `Acesso Negado` | `Seu perfil não possui permissão para acessar este recurso.` |

> [!NOTE]
> **Não mapeados explicitamente** (sem handler customizado, portanto sem o formato `ProblemDetail` do projeto): JSON malformado ou valor de enum inválido no corpo, UUID inválido no path, parte multipart ausente, upload acima de 1 MB (limite padrão do Spring) e falhas internas de criptografia (`SecurityException`/`IllegalArgumentException` em `CryptoStorageService`, ex.: adulteração do arquivo cifrado), que resultam no tratamento padrão do Spring (4xx/5xx).

---

## 6. Como Testar a API no Postman (`collection/`)

As coleções ficam em [`app/backend/collection/`](collection) (formato Postman Collection v2.1).

### Passo a passo

1. Suba o banco **com os seeds** (seção 3) e a API (`mvn spring-boot:run`) em `http://localhost:8080`.
2. No Postman: **Import** → selecione o par `.postman_collection.json` + `.postman_environment.json` da pasta desejada.
3. Escolha o ambiente correspondente (canto superior direito) e rode as requisições na ordem numérica, ou **Run Collection**.
4. Via terminal (Newman), a partir de `app/backend`:
   ```bash
   npx newman run collection/US03/SIGI_PlanejamentoPedagogico.postman_collection.json -e collection/US03/SIGI_Environment.postman_environment.json
   ```

### Coleção × seed necessário

| Pasta | Arquivos | Ambiente Postman | Cobertura | Seed obrigatório (`database/inserts/`) |
| :--- | :--- | :--- | :--- | :--- |
| `collection/US02` | `SIGI_EstudoDeCaso.postman_collection.json` + `SIGI_Environment.postman_environment.json` | `SIGI - Localhost Environment` | CRUD de Estudo de Caso (TA2.2/2.3/2.4, soft delete) | `02_seed_us02_estudo_caso.sql` (alunos `1111…`/`2222…` e indicadores `aaaa…`/`bbbb…`/`cccc…`) + `01_seed_us11_rbac.sql` (usuários, necessários para obter o JWT) |
| `collection/US03` | `SIGI_PlanejamentoPedagogico.postman_collection.json` + `SIGI_Environment.postman_environment.json` | `SIGI - US03 Environment` | PEA e PEI (TA3.1/3.2/3.4) | `03_seed_us03_planejamento_pedagogico.sql` (acompanhamentos `3333…`/`4444…`) + `01_seed_us11_rbac.sql` |
| `collection/US11` | `SIGI_US11_Autenticacao_RBAC.postman_collection.json` + `SIGI_US11_Environment.postman_environment.json` | `SIGI - US11 Environment` | Login/JWT, RBAC, revogação (TA11.4), anexos AES-256 (TA11.1/11.2), matriz granular (TA11.3/TA3.2) | `01_seed_us11_rbac.sql` + `02_seed_us02_estudo_caso.sql` (estudante `1111…`); recomendado também `03_seed_us03_planejamento_pedagogico.sql` |

Rodar os três seeds na ordem (automático no Docker) atende a todas as coleções. A coleção **US11** inclui scripts PowerShell auxiliares (`test_matriz_granular.ps1`, `test_criptografia_anexos.ps1`, `test_revogacao_sessao.ps1`) e faz o login de cada perfil, salvando os tokens em variáveis do ambiente (`tokenAdmin`, `tokenProfessor`, `tokenPsicopedagogo`, `tokenCoordenador`, `tokenAluno`).

### Usuários de seed (senha `senha123` para todos)

| E-mail | Role | Nível | `autorizacaoSaude` |
| :--- | :--- | :--- | :---: |
| `admin@sigi.ifpb.edu.br` | `ADMIN` | `SUPER_RESTRICAO` | ✅ |
| `coordenador@sigi.ifpb.edu.br` | `COORDENADOR` | `SUPER_RESTRICAO` | ❌ |
| `psicopedagogo@sigi.ifpb.edu.br` | `CLAI_PSICOPEDAGOGO` | `RESTRICAO_MODERADA` | ✅ |
| `professor@sigi.ifpb.edu.br` | `PROFESSOR` | `ACESSO_FUNCIONAL` | ❌ |
| `aluno.apoiador@sigi.ifpb.edu.br` | `ALUNO_APOIADOR` | `ACESSO_FUNCIONAL` | ❌ |

IDs fixos de seed: alunos `11111111-1111-1111-1111-111111111111` (`MAT-TEST-001`) e `22222222-2222-2222-2222-222222222222` (`MAT-TEST-002`); acompanhamentos `33333333-…` (aluno 1) e `44444444-…` (aluno 2).

> [!WARNING]
> **As coleções US02 e US03 estão desatualizadas em relação à segurança atual.** Elas enviam o header `X-User-Id` (ignorado pelo back-end) e **não possuem login/`Authorization`**; como `anyRequest().authenticated()` está ativo, suas requisições recebem `401`. Para executá-las: faça `POST /api/v1/auth/login` (ex.: `psicopedagogo@sigi.ifpb.edu.br`) e configure a aba **Authorization → Bearer Token** na coleção com o `token` retornado. Use um perfil `RESTRICAO_MODERADA`+ para enxergar os campos sensíveis do Estudo de Caso. Além disso, os comandos Newman do `README.md` da US02 usam caminhos sem a subpasta `US02/`.

---

## Licença

Projeto acadêmico e institucional vinculado ao **Instituto Federal de Educação, Ciência e Tecnologia da Paraíba (IFPB)**.
