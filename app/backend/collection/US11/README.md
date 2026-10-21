# US 11 - Autenticação JWT, Perfis RBAC e Revogação Instantânea de Sessão (Task #50)

Este diretório contém a massa de dados (seed) e o script de teste automatizado para validação dos Critérios de Aceite da **US 11** (em especial **TA11.4** e fundações para restrição de prontuário sensível).

---

## 👥 Matriz de Usuários de Teste

| Nome | E-mail | Senha | Role | Nível de Restrição | Autorização Saúde |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **Administrador** | `admin@sigi.ifpb.edu.br` | `senha123` | `ADMIN` | `SUPER_RESTRICAO` | Sim (`true`) |
| **Aluno Apoiador** | `aluno.apoiador@sigi.ifpb.edu.br` | `senha123` | `ALUNO_APOIADOR` | `ACESSO_FUNCIONAL` | Não (`false`) |
| **Coordenador** | `coordenador@sigi.ifpb.edu.br` | `senha123` | `COORDENADOR` | `SUPER_RESTRICAO` | Não (`false`) |
| **Psicopedagogo/Saúde** | `psicopedagogo@sigi.ifpb.edu.br` | `senha123` | `CLAI_PSICOPEDAGOGO` | `RESTRICAO_MODERADA` | Sim (`true`) |
| **Professor** | `professor@sigi.ifpb.edu.br` | `senha123` | `PROFESSOR` | `ACESSO_FUNCIONAL` | Não (`false`) |

---

## 🚀 Endpoints Implementados

| Método | Rota | Perfil Requerido | Descrição |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/login` | Público | Autentica e emite o token JWT com claims de RBAC, nível de restrição e `tokenVersion`. |
| `GET` | `/api/v1/auth/me` | Autenticado | Retorna os dados do usuário e authorities ativas no `SecurityContextHolder`. |
| `PATCH` | `/api/v1/admin/usuarios/{id}/revogar-acesso` | `ADMIN` | **TA11.4**: Invalida imediatamente qualquer JWT anterior (`token_version++`) e desativa o vínculo (`acesso_ativo=false`). |

---

## 🧪 Como Executar o Script de Validação

No PowerShell, na raiz do repositório:
```powershell
powershell -File app/backend/collection/US11/test_revogacao_sessao.ps1
```

O script executa os 7 passos cobrindo:
1. Emissão de JWT para perfil `ALUNO_APOIADOR`.
2. Acesso a recurso autenticado.
3. Tentativa de violação RBAC (aluno tentando acessar rota de admin -> `403 Forbidden`).
4. Autenticação do `ADMIN`.
5. Acionamento da revogação instantânea de sessão pelo `ADMIN`.
6. Validação do bloqueio imediato do token antigo (`401 Unauthorized`).
7. Tentativa de novo login do usuário revogado bloqueada (`401 Unauthorized`).

---

## 📮 Como Usar a Coleção no Postman

1. No Postman, clique em **Import**.
2. Selecione os dois arquivos deste diretório:
   - `SIGI_US11_Autenticacao_RBAC.postman_collection.json`
   - `SIGI_US11_Environment.postman_environment.json`
3. No canto superior direito do Postman, selecione o ambiente **SIGI - US11 Environment**.
4. Você pode executar requisição por requisição ou clicar nos três pontinhos da coleção e selecionar **Run collection** para rodar a suíte inteira de forma automatizada (os tokens `{{tokenAluno}}` e `{{tokenAdmin}}` são salvos automaticamente entre as requisições pelos scripts de teste).

