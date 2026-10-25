# US 11 - Autenticação JWT, Perfis RBAC, Revogação de Sessão (Task #50) e Criptografia AES-256 em Repouso (Task #51)

Este diretório contém a massa de dados (seed) e os scripts de teste automatizado para validação dos Critérios de Aceite da **US 11** (**TA11.1, TA11.2, TA11.4 e TA3.2**).

---

## 👥 Matriz de Usuários de Teste

| Nome | E-mail | Senha | Role | Nível de Restrição | Autorização Saúde | Acesso a Laudos Sensíveis (TA11.2) |
| :--- | :--- | :--- | :--- | :--- | :---: | :---: |
| **Administrador (Saúde)** | `admin@sigi.ifpb.edu.br` | `senha123` | `ADMIN` | `SUPER_RESTRICAO` | Sim (`true`) | ✅ **200 OK** (Descriptografa em RAM) |
| **Aluno Apoiador** | `aluno.apoiador@sigi.ifpb.edu.br` | `senha123` | `ALUNO_APOIADOR` | `ACESSO_FUNCIONAL` | Não (`false`) | ❌ **403 Forbidden** |
| **Coordenador** | `coordenador@sigi.ifpb.edu.br` | `senha123` | `COORDENADOR` | `SUPER_RESTRICAO` | Não (`false`) | ❌ **403 Forbidden** |
| **Psicopedagogo** | `psicopedagogo@sigi.ifpb.edu.br` | `senha123` | `CLAI_PSICOPEDAGOGO` | `RESTRICAO_MODERADA` | Sim (`true`) | ❌ **403 Forbidden** *(Não é SUPER_RESTRICAO)* |
| **Professor** | `professor@sigi.ifpb.edu.br` | `senha123` | `PROFESSOR` | `ACESSO_FUNCIONAL` | Não (`false`) | ❌ **403 Forbidden** |

---

## 🚀 Endpoints Implementados

| Método | Rota | Perfil Requerido | Descrição |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/login` | Público | Autentica e emite o token JWT com claims de RBAC, nível de restrição e `tokenVersion`. |
| `GET` | `/api/v1/auth/me` | Autenticado | Retorna os dados do usuário e authorities ativas no `SecurityContextHolder`. |
| `PATCH` | `/api/v1/admin/usuarios/{id}/revogar-acesso` | `ADMIN` | **TA11.4**: Invalida imediatamente qualquer JWT anterior (`token_version++`) e desativa o vínculo (`acesso_ativo=false`). |
| `POST` | `/api/v1/estudantes/{id}/anexos` | Autenticado | **TA11.1**: Recebe `MultipartFile` e `classificacao`. Cifra automaticamente com `AES/GCM/NoPadding` (256 bits) anexos `LAUDO_MEDICO` e `DIAGNOSTICO_NEUROPSICOLOGICO`. |
| `GET` | `/api/v1/estudantes/{id}/anexos` | Autenticado | Lista os metadados dos anexos do estudante (sem expor caminho físico ou IV). |
| `GET` | `/api/v1/anexos/{anexoId}/download` | `SUPER_RESTRICAO` + `autorizacaoSaude=true` *(para laudos)* | **TA11.2 / TA3.2**: Valida permissão estrita de saúde, descriptografa exclusivamente em memória e retorna o arquivo original. |

---

## 🧪 Como Executar os Scripts de Validação

### 1. Validação da Task #51 (Criptografia AES-256-GCM e Controle de Acesso de Saúde)
```powershell
powershell -File app/backend/collection/US11/test_criptografia_anexos.ps1
```

### 2. Validação da Task #50 (Autenticação, RBAC e Revogação de Sessão)
```powershell
powershell -File app/backend/collection/US11/test_revogacao_sessao.ps1
```

---

## 📮 Como Usar a Coleção no Postman

1. No Postman, clique em **Import**.
2. Selecione os dois arquivos deste diretório:
   - `SIGI_US11_Autenticacao_RBAC.postman_collection.json`
   - `SIGI_US11_Environment.postman_environment.json`
3. No canto superior direito do Postman, selecione o ambiente **SIGI - US11 Environment**.
4. Você pode executar requisição por requisição ou clicar nos três pontinhos da coleção e selecionar **Run collection** para rodar a suíte inteira de forma automatizada.


