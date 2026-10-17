# Coleção de Testes de Integração - SIGI / CLAI (US 02)

Esta pasta contém a coleção completa de testes de API e massa de dados para validação da **US 02: Endpoints de Estudo de Caso**.

## 📁 Estrutura de Arquivos

* `SIGI_EstudoDeCaso.postman_collection.json`: Coleção no formato Postman Collection v2.1 com requisições e scripts de asserção automática.
* `SIGI_Environment.postman_environment.json`: Variáveis de ambiente (`baseUrl`, `alunoId`, `indicadorId1`, `usuarioId`, etc.).
* `seed_test_data.sql`: Script SQL para carregar alunos e indicadores de teste no PostgreSQL local com os mesmos UUIDs configurados no ambiente.
* `README.md`: Este guia de instruções.

---

## 🚀 Como Executar os Testes

### 1. Preparar a Massa de Dados no Banco
Antes de iniciar a suíte, certifique-se de que o banco de dados PostgreSQL está em execução e execute o script de carga inicial:

```bash
# Exemplo via psql:
psql -U postgres -d sigi_clai -f collection/seed_test_data.sql
```
*(Ou execute o conteúdo do arquivo `collection/seed_test_data.sql` no seu cliente de banco de dados, como DBeaver, pgAdmin ou IntelliJ Database Tools).*

### 2. Iniciar a Aplicação Spring Boot
Inicie a aplicação localmente:
```bash
./mvnw spring-boot:run
```
A API estará disponível por padrão em `http://localhost:8080`.

### 3. Execução via Postman / Insomnia / Bruno
1. Abra o **Postman** (ou cliente compatível).
2. Clique em **Import** e selecione os dois arquivos:
   - `SIGI_EstudoDeCaso.postman_collection.json`
   - `SIGI_Environment.postman_environment.json`
3. Selecione o ambiente **SIGI - Localhost Environment** no canto superior direito.
4. Execute as requisições manualmente ou clique com o botão direito na pasta e selecione **Run Collection**.

### 4. Execução Automatizada via Terminal (Newman)
Se você tiver o Node.js instalado, pode executar toda a bateria de testes de integração diretamente pelo terminal:

```bash
npx newman run collection/SIGI_EstudoDeCaso.postman_collection.json -e collection/SIGI_Environment.postman_environment.json
```

---

## 🧪 Cobertura dos Cenários de Teste

| # | Método | Endpoint | Cenário | Status Esperado | Critério de Aceite |
|---|--------|----------|---------|-----------------|--------------------|
| 1.1 | `POST` | `/api/estudos-de-caso` | Criar Rascunho com Sucesso | `201 Created` | Fluxo Básico / TA2.2 |
| 1.2 | `POST` | `/api/estudos-de-caso` | Criar Concluído com Sucesso | `201 Created` | Fluxo Básico / TA2.2 |
| 1.3 | `POST` | `/api/estudos-de-caso` | Concluído sem campos obrigatórios | `400 Bad Request` | **TA2.3** / RFC 9457 |
| 1.4 | `POST` | `/api/estudos-de-caso` | Criar 1º Estudo ATIVO | `201 Created` | Fluxo Básico |
| 1.5 | `POST` | `/api/estudos-de-caso` | Criar 2º Estudo ATIVO para mesmo aluno | `400 Bad Request` | **TA2.4** / Regra de Negócio |
| 1.6 | `POST` | `/api/estudos-de-caso` | Criar para Aluno Inexistente | `400 Bad Request` | Validação |
| 2.1 | `GET` | `/api/estudos-de-caso/{id}` | Buscar Estudo por ID Existente | `200 OK` | Consulta Individual |
| 2.2 | `GET` | `/api/estudos-de-caso/{id}` | Buscar Estudo por ID Inexistente | `404 Not Found` | RFC 9457 ProblemDetail |
| 2.3 | `GET` | `/api/estudos-de-caso/aluno/{alunoId}` | Listar Estudos por Aluno | `200 OK` | Histórico do Aluno |
| 2.4 | `GET` | `/api/estudos-de-caso/aluno/{alunoId}` | Listar por Aluno Inexistente | `404 Not Found` | RFC 9457 ProblemDetail |
| 3.1 | `PUT` | `/api/estudos-de-caso/{id}` | Concluir Rascunho com Sucesso | `200 OK` | Conclusão / TA2.2 |
| 3.2 | `PUT` | `/api/estudos-de-caso/{id}` | Concluir sem Diagnóstico | `400 Bad Request` | **TA2.3** / RFC 9457 |
| 3.3 | `PUT` | `/api/estudos-de-caso/{id}` | Atualizar Estudo Inexistente | `404 Not Found` | RFC 9457 ProblemDetail |
| 4.1 | `DELETE` | `/api/estudos-de-caso/{id}` | Descartar Rascunho | `204 No Content` | Soft Delete / TA2.2 |
| 4.2 | `DELETE` | `/api/estudos-de-caso/{id}` | Bloquear Exclusão de Concluído | `400 Bad Request` | Regra de Negócio / RFC 9457 |
| 4.3 | `DELETE` | `/api/estudos-de-caso/{id}` | Excluir Estudo Inexistente | `404 Not Found` | RFC 9457 ProblemDetail |
| 4.4 | `GET` | `/api/estudos-de-caso/{id}` | Validar que excluído dá 404 | `404 Not Found` | Validação Soft Delete |
