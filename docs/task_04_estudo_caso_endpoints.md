# Plano de Implementação: Task 04 - Endpoints de Estudo de Caso (US 02)

## 1. Visão Geral (Checkpoints)

**O que já foi feito (Checkpoints Anteriores):**
- [x] Task 01: Implementação de Soft Delete (`BaseEntity`).
- [x] Task 02: Implementação das entidades de Domínio (ex: `EstudoDeCaso`, `Aluno`).
- [x] Task 03: Criação dos Repositórios (Spring Data JPA).

**O que será feito nesta Task (Checkpoint Atual - Dividido em Mini-Tasks):**
- [x] **Task 04.1 (Mini-Task)**: Estrutura inicial (Pacotes, DTOs, Mapper em Classe, GlobalExceptionHandler seguindo RFC 9457) e Endpoint POST (Criação de Rascunho/Concluído) com regras TA2.2, TA2.3 e TA2.4.
- [x] **Task 04.2 (Mini-Task)**: Endpoint PUT (Atualização de Estudo de Caso, mudança de status).
- [x] **Task 04.3 (Mini-Task)**: Endpoints GET (Busca por ID e listagem por aluno).

*A ideia de dividir em mini-tasks garante commits mais granulares, focando um verbo HTTP por vez.*

## 2. Arquitetura em Camadas

Seguindo a estrutura baseada na imagem de referência fornecida, organizaremos os novos arquivos nos seguintes pacotes dentro de `com.br.CLAI`:

*   `controller`: Conterá a classe `EstudoDeCasoController` para expor as APIs REST.
*   `dto`
    *   `request`: Classes para receber dados (ex: `EstudoDeCasoRequestDTO`, `EstudoDeCasoUpdateDTO`). Desacoplados do controller conforme solicitado.
    *   `response`: Classes para devolver dados (ex: `EstudoDeCasoResponseDTO`).
*   `service`: Conterá a `EstudoDeCasoService` com a lógica de orquestração.
*   `service.validator`: Conterá a `EstudoDeCasoValidator` para validar as regras específicas (como o TA2.3).
*   `mapper`: Conterá a classe `EstudoDeCasoMapper` responsável por fazer as conversões Entity <-> DTO manualmente.
*   `handler`: Conterá o `GlobalExceptionHandler` para capturar exceções (como a de validação) e formatar o erro seguindo a norma **RFC 9457** (Problem Details for HTTP APIs).

## 3. Detalhamento dos Critérios de Aceite

### Ref. TA2.2: Registrar automaticamente o ID do usuário e a data ao salvar ou atualizar.
**Solução Proposta:**
*   **Datas**: Utilizaremos o **JPA Auditing** do Spring Data. Adicionaremos as anotações `@CreatedDate` e `@LastModifiedDate` em novos campos na `BaseEntity`.
*   **ID do Usuário**: Como não há Spring Security ativo configurado, o ID do usuário responsável pela ação virá no payload (ou em um Header, ex: `X-User-Id`). A `BaseEntity` receberá os campos `criadoPor` e `atualizadoPor`, que serão preenchidos na Service.

### Ref. TA2.3: A API deve retornar erro (400 Bad Request) se o payload for enviado como "Concluído" sem os campos obrigatórios.
**Solução Proposta:**
*   Criaremos o `EstudoDeCasoValidator` dentro do pacote `service.validator`.
*   A classe terá um método `validarConclusao(EstudoDeCasoRequestDTO dto)` que verificará se `dto.getStatus() == CONCLUIDO` (ou `ENCERRADO` conforme o enum atual).
*   Se faltarem os campos obrigatórios (ex: `diagnosticoInicial`, `indicadores`), o Validator lançará uma exceção customizada (ex: `ValidacaoException`).
*   O `GlobalExceptionHandler` (no pacote `handler`) irá capturar a `ValidacaoException` e retornar o status `400 Bad Request` com o formato JSON **ProblemDetail** exigido pela RFC 9457.

### Ref. TA2.4: Regra de negócio na service para bloquear criação de novo Estudo se já existir um ativo.
**Solução Proposta:**
*   Na interface `EstudoDeCasoRepository`, adicionaremos o método `boolean existsByAlunoIdAndStatus(UUID alunoId, StatusEstudoCaso status);`.
*   Na `EstudoDeCasoService`, no método de criação, faremos a checagem `if (repository.existsByAlunoIdAndStatus(alunoId, StatusEstudoCaso.ATIVO))`. Se for verdadeiro, lançaremos uma `RegraDeNegocioException` (que será tratada via ProblemDetail para retornar `400 Bad Request` ou `409 Conflict`).

## 4. Ordem de Implementação e Commits

1.  **Commit 1 (Mini-Task 04.1)**: Criação de pacote, auditoria na BaseEntity, DTOs base, Service (POST), Validator, Mapper (classe), Error Handler (RFC 9457) e Controller (POST).
2.  **Commit 2 (Mini-Task 04.2)**: Service (PUT), Validações de Update e Controller (PUT).
3.  **Commit 3 (Mini-Task 04.3)**: DTOs de leitura detalhada (se necessário), Service (GET) e Controller (GET).
