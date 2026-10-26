# Documentação Técnica: Matriz de Autorização Granular (Task #52 - US 11 / TA11.3 / TA3.2)

Este documento descreve a arquitetura e os critérios de validação da **Task #52**, responsável por implementar a autorização granular nos níveis `SUPER_RESTRICAO`, `RESTRICAO_MODERADA` e `ACESSO_FUNCIONAL` no backend do Sistema Integrado de Gestão Inclusiva (SIGI).

---

## 1. Visão Geral

- **Requisito Principal (TA11.3):** Aplicar filtragem seletiva de dados sensíveis (`historicoFamiliar` e `historicoSocioemocional`) nos endpoints de **Estudo de Caso (US 02)** e **Prontuário Unificado (US 09)**.
- **Reforço de Segurança (TA3.2):** Proteção da rota de anexos sensíveis do **PEI (US 03)** via Spring Security / Method Security (`@PreAuthorize`), substituindo cabeçalhos mockados por verificação real do contexto de autenticação JWT.

---

## 2. Matriz de Autorização

| Nível / Role | Estudo de Caso (US 02) | Prontuário Unificado (US 09) | Rota Direta Socioemocional | PEI Anexos Sensíveis (US 03) |
|---|---|---|---|---|
| **`ACESSO_FUNCIONAL`<br/>(`PROFESSOR`, `ALUNO_APOIADOR`)** | `200 OK`<br/>Campos sensíveis **omitidos** no JSON | `200 OK`<br/>Campos sensíveis **omitidos** no JSON | **`403 Forbidden`**<br/>(RFC 9457 ProblemDetail) | **`403 Forbidden`**<br/>(RFC 9457 ProblemDetail) |
| **`RESTRICAO_MODERADA`<br/>(`CLAI_PSICOPEDAGOGO`)** | `200 OK`<br/>Campos sensíveis **presentes** | `200 OK`<br/>Campos sensíveis **presentes** | **`200 OK`**<br/>Acesso integral liberado | **`200 OK`**<br/>Acesso liberado aos PEAs |
| **`SUPER_RESTRICAO`<br/>(`COORDENADOR`, `ADMIN`)** | `200 OK`<br/>Campos sensíveis **presentes** | `200 OK`<br/>Campos sensíveis **presentes** | **`200 OK`**<br/>Acesso integral liberado | **`200 OK`**<br/>Acesso liberado aos PEAs |

---

## 3. Arquitetura em Camadas e Componentes

### 3.1 `RbacGuard` (`com.br.CLAI.security.RbacGuard`)
Componente Spring `@Component("rbacGuard")` que inspeciona o `SecurityContextHolder`:
- `temRestricaoModeradaOuSuperior()`: avalia se o usuário logado possui nível moderado ou superior ou roles equivalentes.
- `temSuperRestricao()`: restrito a `SUPER_RESTRICAO` e `ROLE_ADMIN`.
- `temApenasAcessoFuncional()`: restrito a `ACESSO_FUNCIONAL` (`PROFESSOR`, `ALUNO_APOIADOR`).
- `podeAcessarDadosSensiveis()`: atalho semântico para mappers e serviços.

### 3.2 Omissão de Campos no JSON via `@JsonInclude(NON_NULL)`
Nos DTOs de resposta (`EstudoDeCasoResponseDTO` e `ProntuarioResponseDTO`):
```java
@JsonInclude(JsonInclude.Include.NON_NULL)
public record EstudoDeCasoResponseDTO(
    ...
    String historicoFamiliar,
    String historicoSocioemocional,
    ...
)
```
Quando o usuário é um `PROFESSOR`, o mapper e o service deixam essas variáveis como `null`. Devido ao `@JsonInclude(NON_NULL)`, o serializador do Jackson **não renderiza as chaves no JSON**, cumprindo com rigor a LGPD e o princípio de privilégio mínimo.

### 3.3 Rotas Protegidas com `@PreAuthorize`
- `GET /api/v1/estudantes/{estudanteId}/historico-socioemocional`:
  Anotado com `@PreAuthorize("@rbacGuard.temRestricaoModeradaOuSuperior()")`.
- `GET /api/peis/{id}/anexos-sensiveis`:
  Anotado com `@PreAuthorize("@rbacGuard.temRestricaoModeradaOuSuperior()")`.

Tentativas de acesso não autorizado são interceptadas e convertidas pelo `GlobalExceptionHandler` em:
```json
{
  "type": "https://api.sigi.com/errors/acesso-negado",
  "title": "Acesso Negado",
  "status": 403,
  "detail": "Seu perfil não possui permissão para acessar este recurso.",
  "timestamp": "2026-10-25T21:40:00Z"
}
```

---

## 4. Endpoints Disponibilizados / Atualizados

```http
GET /api/estudos-de-caso/{id}
GET /api/v1/estudantes/{id}/prontuario
GET /api/v1/estudantes/{id}/historico-socioemocional
GET /api/peis/{id}/anexos-sensiveis
```

---

## 5. Suíte de Testes Automatizados

1. `MethodSecurityRbacTest`: 9 testes validando o avaliador `RbacGuard` e a interceptação AOP do `@PreAuthorize`.
2. `ProjecaoSensivelJsonIntegrationTest`: 5 testes com JWT validando a omissão condicional nos endpoints consolidados.
3. `MatrizAutorizacaoGranularIntegrationTest`: 5 testes de integração ponta a ponta validando formalmente os critérios **CA 1**, **CA 1.2**, **CA 2** e **TA3.2**.

Totalizando **29 testes de segurança da aplicação aprovados com 100% de sucesso**.
