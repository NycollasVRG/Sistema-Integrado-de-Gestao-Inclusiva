# Coleção de Testes de Integração - SIGI / CLAI (US 03)

Esta pasta contém a coleção completa de testes de API e massa de dados para validação da **US 03: Construção do Plano de Ensino Individualizado (PEI)**, cobrindo também os fluxos do **PEA (Plano de Ensino Adaptado)** que servem de base para os anexos sensíveis do PEI.

## 📁 Estrutura de Arquivos

* `SIGI_PlanejamentoPedagogico.postman_collection.json`: Coleção no formato Postman Collection v2.1 com as pastas `1. PEA` e `2. PEI`, requisições e scripts de asserção automática.
* `SIGI_Environment.postman_environment.json`: Variáveis de ambiente (`baseUrl`, `alunoId`, `acompanhamentoId`, `usuarioId`, etc.).
* `README.md`: Este guia de instruções.
* *(Seed SQL consolidado em [`database/inserts/03_seed_us03_planejamento_pedagogico.sql`](../../database/inserts/03_seed_us03_planejamento_pedagogico.sql)):* Script SQL para carregar alunos e acompanhamentos de teste no PostgreSQL local com os mesmos UUIDs configurados no ambiente.

---

## 🚀 Como Executar os Testes

### 1. Preparar a Massa de Dados no Banco
Antes de iniciar a suíte, certifique-se de que o banco de dados PostgreSQL está em execução e execute o script de carga inicial:

```bash
# Exemplo via psql (a partir de app/backend):
psql -U postgres -d sigi_clai -f database/inserts/03_seed_us03_planejamento_pedagogico.sql
```
*(Ou execute o conteúdo do arquivo `database/inserts/03_seed_us03_planejamento_pedagogico.sql` no seu cliente de banco de dados, como DBeaver, pgAdmin ou IntelliJ Database Tools).*

> **Atenção:** o acompanhamento é a ponte entre o Aluno e o PEI/PEA. Como o sistema ainda não possui endpoint REST para criar `Acompanhamento`, essa linha é inserida diretamente pelo seed.

### 2. Iniciar a Aplicação Spring Boot
Inicie a aplicação localmente:
```bash
./mvnw spring-boot:run
```
A API estará disponível por padrão em `http://localhost:8080`.

### 3. Execução via Postman / Insomnia / Bruno
1. Abra o **Postman** (ou cliente compatível).
2. Clique em **Import** e selecione os dois arquivos:
   - `SIGI_PlanejamentoPedagogico.postman_collection.json`
   - `SIGI_Environment.postman_environment.json`
3. Selecione o ambiente **SIGI - US03 Environment** no canto superior direito.
4. Execute as requisições na ordem numérica (a pasta `1. PEA` roda antes da `2. PEI`) ou clique com o botão direito na pasta e selecione **Run Collection**.

### 4. Execução Automatizada via Terminal (Newman)
Se você tiver o Node.js instalado, pode executar toda a bateria de testes de integração diretamente pelo terminal:

```bash
npx newman run collection/US03/SIGI_PlanejamentoPedagogico.postman_collection.json -e collection/US03/SIGI_Environment.postman_environment.json
```

---

## 🧪 Cobertura dos Cenários de Teste

### Pasta 1 - PEA (base dos anexos sensíveis do PEI)

| # | Método | Endpoint | Cenário | Status Esperado | Critério de Aceite |
|---|--------|----------|---------|-----------------|--------------------|
| 1.1 | `POST` | `/api/peas` | Criar PEA com Sucesso (alunoId derivado do acompanhamento) | `201 Created` | Fluxo Básico / Vínculo institucional |
| 1.2 | `POST` | `/api/peas` | Criar 2º PEA do mesmo Acompanhamento | `201 Created` | Preparação dos anexos / TA3.2 |
| 1.3 | `POST` | `/api/peas` | Criar sem Objetivo Geral | `400 Bad Request` | Validação / RFC 9457 |
| 1.4 | `POST` | `/api/peas` | Criar para Acompanhamento Inexistente | `404 Not Found` | RFC 9457 ProblemDetail |
| 1.5 | `GET` | `/api/peas/aluno/{alunoId}` | Listar PEAs por Aluno | `200 OK` | Histórico do Aluno |
| 1.6 | `GET` | `/api/peas/acompanhamento/{id}` | Listar PEAs por Acompanhamento | `200 OK` | Consulta por Acompanhamento |
| 1.7 | `GET` | `/api/peas/{id}` | Buscar PEA por ID Existente | `200 OK` | Consulta Individual |
| 1.8 | `GET` | `/api/peas/{id}` | Buscar PEA por ID Inexistente | `404 Not Found` | RFC 9457 ProblemDetail |
| 1.9 | `PUT` | `/api/peas/{id}` | Atualizar PEA com Sucesso | `200 OK` | Atualização / Auditoria |
| 1.10 | `PUT` | `/api/peas/{id}` | Atualizar PEA Inexistente | `404 Not Found` | RFC 9457 ProblemDetail |
| 1.11 | `DELETE` | `/api/peas/{id}` | Excluir PEA (Soft Delete) | `204 No Content` | Soft Delete |
| 1.12 | `GET` | `/api/peas/{id}` | Validar que PEA excluído dá 404 | `404 Not Found` | Validação Soft Delete |

### Pasta 2 - PEI (testes de aceite da US 03)

| # | Método | Endpoint | Cenário | Status Esperado | Critério de Aceite |
|---|--------|----------|---------|-----------------|--------------------|
| 2.1 | `POST` | `/api/peis` | Criar PEI com Sucesso | `201 Created` | **TA3.1** / Vínculo automático |
| 2.2 | `GET` | `/api/peis/{id}` | Dados institucionais carregados automaticamente | `200 OK` | **TA3.1** |
| 2.3 | `POST` | `/api/peis` | Criar sem Habilidades e Interesses | `400 Bad Request` | Validação / RFC 9457 |
| 2.4 | `POST` | `/api/peis` | Criar sem Propostas de Adaptação | `400 Bad Request` | Validação / RFC 9457 |
| 2.5 | `POST` | `/api/peis` | Criar sem Acompanhamento (obrigatório) | `400 Bad Request` | Validação / RFC 9457 |
| 2.6 | `POST` | `/api/peis` | Criar para Acompanhamento Inexistente | `404 Not Found` | RFC 9457 ProblemDetail |
| 2.7 | `GET` | `/api/peis/aluno/{alunoId}` | Listar PEIs por Aluno Existente | `200 OK` | Consulta |
| 2.8 | `GET` | `/api/peis/aluno/{aluno2Id}` | Listar PEIs por Aluno sem Registros (isolamento) | `200 OK` (vazio) | Isolamento de dados |
| 2.9 | `GET` | `/api/peis/acompanhamento/{id}` | Listar PEIs por Acompanhamento | `200 OK` | Consulta |
| 2.10 | `GET` | `/api/peis/{id}` | Buscar PEI por ID Inexistente | `404 Not Found` | RFC 9457 ProblemDetail |
| 2.11 | `PUT` | `/api/peis/{id}` | Atualizar PEI com Sucesso | `200 OK` | Atualização / Auditoria |
| 2.12 | `PUT` | `/api/peis/{id}` | Atualizar PEI Inexistente | `404 Not Found` | RFC 9457 ProblemDetail |
| 2.13 | `GET` | `/api/peis/{id}/anexos-sensiveis` | Anexos sem header de perfil | `200 OK` | **TA3.2** / Leitura liberada |
| 2.14 | `GET` | `/api/peis/{id}/anexos-sensiveis` | Anexos com perfil `Coordenador` | `200 OK` | **TA3.2** / Leitura liberada |
| 2.15 | `GET` | `/api/peis/{id}/anexos-sensiveis` | Anexos com perfil `Professor` | **`403 Forbidden`** | **TA3.2** / Acesso Negado |
| 2.16 | `DELETE` | `/api/peis/{id}` | Inativar PEI (Soft Delete) | `204 No Content` | **TA3.4** |
| 2.17 | `GET` | `/api/peis/{id}` | Validar que PEI excluído dá 404 | `404 Not Found` | **TA3.4** |
| 2.18 | `GET` | `/api/peas/aluno/{alunoId}` | Validar ausência de exclusão em cascata | `200 OK` | **TA3.4** |
| 2.19 | `DELETE` | `/api/peis/{id}` | Excluir PEI Inexistente | `404 Not Found` | RFC 9457 ProblemDetail |

### Fora do escopo

| Teste de Aceite | Motivo |
|---|---|
| **TA3.3** (notificação ao Coordenador por RAI bimestral com regressão) | Depende de funcionalidades de Sprints futuras (módulo de RAI/notificações), conforme critério de aceite da US 03. |
| **TA3.1 completo** (Matrícula, Turma e Curso no formulário) | O banco atual não possui entidades de Turma/Curso e a API não expõe endpoint de Aluno; a coleção valida o que existe hoje (o `alunoId` é resolvido automaticamente pelo vínculo `Aluno → Acompanhamento → PEI`). Ver seção abaixo. |

---

## ⚠️ Limitação do TA3.1 (pendências de modelagem)

O critério pede que o formulário do PEI carregue **Matrícula, Turma e Curso** automaticamente. O estado atual do sistema cobre apenas o vínculo do aluno:

* `PeiResponseDTO` retorna `alunoId` e `acompanhamentoId`, derivados pelo mapper a partir do registro de `Acompanhamento` — o cliente envia apenas o `acompanhamentoId` (cenários 2.1 e 2.2).
* **Matrícula**: existe na tabela `sigi.aluno`, mas não é retornada por nenhum endpoint (não há `AlunoController`).
* **Turma e Curso**: não existem como entidades no banco atual (`create_tables.sql`).

Para concluir o TA3.1 integralmente será necessário: modelar tabelas de `turma`/`curso`, criar endpoint de consulta de aluno e enriquecer a resposta do PEI com os três campos institucionais.

---

## 🔍 Validação Manual do TA3.4 (Soft Delete e Cascata)

O teste automatizado 2.16/2.17/2.18 cobre o comportamento via API. Para conferir diretamente no banco após a execução:

```sql
-- 1. O PEI excluído continua fisicamente na tabela, marcado como inativo:
SELECT id, deleted, atualizado_em, atualizado_por
FROM sigi.pei
WHERE id = '<peiId>';

-- Esperado: 1 linha retornada com deleted = TRUE

-- 2. Nenhuma tabela relacionada foi apagada em cascata:
SELECT COUNT(*) FROM sigi.aluno     WHERE deleted = FALSE;  -- alunos preservados
SELECT COUNT(*) FROM sigi.acompanhamento WHERE deleted = FALSE;  -- acompanhamentos preservados
SELECT COUNT(*) FROM sigi.pea       WHERE deleted = FALSE;  -- PEAs preservados

-- 3. A exclusão NÃO é física:
SELECT COUNT(*) FROM sigi.pei WHERE id = '<peiId>';
-- Esperado: 1 (o registro existe, apenas com deleted = TRUE)
```

Substitua `<peiId>` pelo valor da variável de ambiente `peiId` (visível na aba *Environment* do Postman após a execução).

---

## 📌 Variáveis de Ambiente

| Variável | Origem | Descrição |
|---|---|---|
| `baseUrl` | Fixa | `http://localhost:8080` |
| `alunoId` | Fixa (seed) | Aluno do fluxo completo (`11111111-...`) |
| `aluno2Id` | Fixa (seed) | Aluno sem PEI, usado no isolamento (`22222222-...`) |
| `acompanhamentoId` | Fixa (seed) | Acompanhamento do aluno 1 (`33333333-...`) |
| `acompanhamento2Id` | Fixa (seed) | Acompanhamento do aluno 2 (`44444444-...`) |
| `usuarioId` | Fixa | Usuário auditor enviado no header `X-User-Id` |
| `idInexistente` | Fixa | UUID nulo para cenários de 404 |
| `peaId` / `peaId2` | Runtime | Salvos pelos cenários 1.1 e 1.2 |
| `peiId` | Runtime | Salvo pelo cenário 2.1 |
