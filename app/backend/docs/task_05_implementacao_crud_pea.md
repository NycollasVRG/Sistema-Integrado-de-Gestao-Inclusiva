# Plano de Implementação: CRUD de PEA (US 03)

## 1. Visão Geral (Checkpoints)

**O que já foi feito (Checkpoints Anteriores):**
- [x] Configuração de Soft Delete na `BaseEntity`.
- [x] Criação das entidades de domínio necessárias, incluindo `Pea` e `Acompanhamento`.
- [x] Configuração do acesso ao banco com Spring Data JPA.
- [x] Estrutura de auditoria disponível na `BaseEntity` com `criadoEm`, `atualizadoEm`, `criadoPor` e `atualizadoPor`.

**O que foi feito nesta Task (Checkpoint Atual - Dividido em Mini-Tasks):**
- [x] **Mini-Task 1**: Criação dos DTOs de request e response do PEA.
- [x] **Mini-Task 2**: Criação do `PeaMapper` para conversão entre Entity e DTO.
- [x] **Mini-Task 3**: Implementação do `PeaRepository`.
- [x] **Mini-Task 4**: Implementação do `PeaService` com regras de criação, consulta, atualização e inativação.
- [x] **Mini-Task 5**: Implementação do `PeaController` com endpoints REST.
- [x] **Mini-Task 6**: Inclusão de validações no `PeaRequestDTO`.
- [x] **Mini-Task 7**: Validação do Soft Delete e testes manuais pelo Thunder Client.

*A divisão em mini-tasks permite manter commits menores e separar melhor as responsabilidades da implementação.*

## 2. Arquitetura em Camadas

A implementação foi organizada seguindo a estrutura já utilizada no projeto dentro de `com.br.CLAI`:

* `controller`: Contém a classe `PeaController`, responsável por expor os endpoints REST.
* `dto`
  * `request`: Contém `PeaRequestDTO` e `PeaUpdateDTO`, usados para receber dados da API.
  * `response`: Contém `PeaResponseDTO`, usado para devolver os dados do PEA.
* `service`: Contém `PeaService`, responsável pelas regras de negócio e pela orquestração das operações.
* `mapper`: Contém `PeaMapper`, responsável pelas conversões Entity <-> DTO.
* `repository`: Contém `PeaRepository`, responsável pelo acesso aos dados através do Spring Data JPA.

### Arquivos criados ou alterados

- `src/main/java/com/br/CLAI/repository/PeaRepository.java`
- `src/main/java/com/br/CLAI/dto/request/PeaRequestDTO.java`
- `src/main/java/com/br/CLAI/dto/request/PeaUpdateDTO.java`
- `src/main/java/com/br/CLAI/dto/response/PeaResponseDTO.java`
- `src/main/java/com/br/CLAI/mapper/PeaMapper.java`
- `src/main/java/com/br/CLAI/service/PeaService.java`
- `src/main/java/com/br/CLAI/controller/PeaController.java`

## 3. Detalhamento da Implementação

### Validação do `acompanhamentoId`

O PEA obrigatoriamente precisa estar associado a um acompanhamento.

**Solução Implementada:**

```java
@NotNull(message = "O ID do acompanhamento é obrigatório")
private UUID acompanhamentoId;
```

Com isso, uma requisição de criação sem `acompanhamentoId` válido é rejeitada pela validação da API.

### Validação dos campos pedagógicos

Os campos principais do PEA receberam validações com `@NotBlank`.

**Solução Implementada:**

```java
@NotBlank(message = "O objetivo geral é obrigatório")
private String objetivoGeral;

@NotBlank(message = "A metodologia é obrigatória")
private String metodologia;

@NotBlank(message = "A avaliação é obrigatória")
private String avaliacao;
```

Essas validações impedem o envio de valores `null`, strings vazias ou preenchidas somente com espaços.

O campo `disciplinaId` permaneceu opcional, pois a entidade `Pea` não o define como obrigatório.

### Ref. TA3.4: Inativação utilizando Soft Delete

A exclusão do PEA não deve apagar fisicamente o registro do banco.

**Solução Implementada:**
* A entidade `Pea` herda de `BaseEntity`.
* A `BaseEntity` possui `@SoftDelete`.
* O método de inativação utiliza a operação de delete do repositório.
* O Hibernate transforma a exclusão em uma atualização lógica, marcando o registro como `deleted = true`.
* Consultas normais deixam de retornar automaticamente registros inativados.

Durante os testes, foi confirmado no PostgreSQL que o registro permanecia fisicamente na tabela após o DELETE, porém com o campo:

```text
deleted = true
```

### Endpoints implementados

Foram disponibilizadas as operações principais do CRUD:

```http
POST /api/peas
GET /api/peas
GET /api/peas/{id}
PUT /api/peas/{id}
DELETE /api/peas/{id}
```

A criação utiliza o header:

```text
X-User-Id
```

para registrar o usuário responsável pela operação.

## 4. Testes Realizados

Foram realizados testes manuais através do Thunder Client e verificações no PostgreSQL.

- [x] `GET /api/peas` retornando `200 OK`.
- [x] `POST /api/peas` retornando `201 Created`.
- [x] `PUT /api/peas/{id}` atualizando corretamente o registro.
- [x] `DELETE /api/peas/{id}` retornando `204 No Content`.
- [x] Verificação do campo `deleted` diretamente no banco.
- [x] Confirmação de que registros inativados deixam de aparecer nas consultas normais.
- [x] Testes das validações obrigatórias do `PeaRequestDTO`.

## 5. Ordem de Implementação e Commits

1. **Commit 1**: Estrutura do CRUD de PEA.
   - `PeaRepository`
   - `PeaRequestDTO`
   - `PeaUpdateDTO`
   - `PeaResponseDTO`
   - `PeaMapper`

   ```text
   feat: adiciona estrutura do CRUD de PEA
   ```

2. **Commit 2**: Implementação das regras de negócio e do Soft Delete.

   ```text
   feat: implementa regras e soft delete do PEA
   ```

3. **Commit 3**: Implementação dos endpoints REST.

   ```text
   feat: adiciona endpoints REST do PEA
   ```

4. **Ajuste posterior**: Inclusão de validações no DTO de criação.

   ```text
   fix: adiciona validacoes ao PeaRequestDTO
   ```

## 6. Resultado da Implementação

O fluxo final do CRUD ficou organizado da seguinte maneira:

```text
PeaController
      ↓
PeaService
      ↓
PeaRepository
      ↓
PostgreSQL
```

Os DTOs e o Mapper mantêm o desacoplamento entre a API e a entidade JPA.

A implementação também ficou preparada para reutilização por outras funcionalidades do sistema, como a API agregadora da Linha do Tempo.
