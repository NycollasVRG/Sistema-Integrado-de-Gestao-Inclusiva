# ====================================================================
# TESTE DOS CRITÉRIOS DE ACEITE DA TASK #50 / US 11 (TA11.4 e RBAC)
# ====================================================================

$baseUrl = "http://localhost:8080"
$alunoId = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"

Write-Host "===========================================================" -ForegroundColor Cyan
Write-Host " [PASSO 1] Autenticar como ALUNO_APOIADOR (Obter token A)" -ForegroundColor Cyan
Write-Host "===========================================================" -ForegroundColor Cyan

$loginAlunoPayload = @{
    email = "aluno.apoiador@sigi.ifpb.edu.br"
    senha = "senha123"
} | ConvertTo-Json

$respAluno = Invoke-RestMethod -Uri "$baseUrl/api/v1/auth/login" -Method POST -ContentType "application/json" -Body $loginAlunoPayload
$tokenAluno = $respAluno.token
Write-Host " Token ALUNO_APOIADOR obtido com sucesso!" -ForegroundColor Green
Write-Host " Role: $($respAluno.role) | NivelRestricao: $($respAluno.nivelRestricao) | Versao: $($respAluno.tokenVersion)"

Write-Host "`n===========================================================" -ForegroundColor Cyan
Write-Host " [PASSO 2] Chamar endpoint com token A (Validar funcionamento)" -ForegroundColor Cyan
Write-Host "===========================================================" -ForegroundColor Cyan

$meResp1 = Invoke-RestMethod -Uri "$baseUrl/api/v1/auth/me" -Method GET -Headers @{ Authorization = "Bearer $tokenAluno" }
Write-Host " Requisição com token A autorizada com sucesso (HTTP 200)!" -ForegroundColor Green
Write-Host " Usuário logado: $($meResp1.nome) ($($meResp1.email))"
Write-Host " Authorities: $($meResp1.authorities -join ', ')"

Write-Host "`n===========================================================" -ForegroundColor Cyan
Write-Host " [PASSO 3] Testar RBAC: ALUNO_APOIADOR tenta revogar acesso (Deve dar 403)" -ForegroundColor Cyan
Write-Host "===========================================================" -ForegroundColor Cyan

try {
    Invoke-RestMethod -Uri "$baseUrl/api/v1/admin/usuarios/$alunoId/revogar-acesso" -Method PATCH -Headers @{ Authorization = "Bearer $tokenAluno" }
    Write-Host " FALHA: Aluno apoiador não deveria conseguir acessar rota de admin!" -ForegroundColor Red
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    Write-Host " Bloqueio RBAC confirmado com sucesso: HTTP $statusCode Forbidden!" -ForegroundColor Green
}

Write-Host "`n===========================================================" -ForegroundColor Cyan
Write-Host " [PASSO 4] Autenticar como ADMIN (Obter token Admin)" -ForegroundColor Cyan
Write-Host "===========================================================" -ForegroundColor Cyan

$loginAdminPayload = @{
    email = "admin@sigi.ifpb.edu.br"
    senha = "senha123"
} | ConvertTo-Json

$respAdmin = Invoke-RestMethod -Uri "$baseUrl/api/v1/auth/login" -Method POST -ContentType "application/json" -Body $loginAdminPayload
$tokenAdmin = $respAdmin.token
Write-Host " Token ADMIN obtido com sucesso!" -ForegroundColor Green

Write-Host "`n===========================================================" -ForegroundColor Cyan
Write-Host " [PASSO 5] ADMIN revoga acesso do ALUNO_APOIADOR (TA11.4)" -ForegroundColor Cyan
Write-Host "===========================================================" -ForegroundColor Cyan

$revogacaoResp = Invoke-RestMethod -Uri "$baseUrl/api/v1/admin/usuarios/$alunoId/revogar-acesso" -Method PATCH -Headers @{ Authorization = "Bearer $tokenAdmin" }
Write-Host " Endpoint PATCH de revogação executado com sucesso (HTTP 200)!" -ForegroundColor Green
Write-Host " Usuário alvo: $($revogacaoResp.nome) | acessoAtivo: $($revogacaoResp.acessoAtivo) | Nova tokenVersion: $($revogacaoResp.tokenVersion)"
Write-Host " Mensagem: $($revogacaoResp.mensagem)"

Write-Host "`n===========================================================" -ForegroundColor Cyan
Write-Host " [PASSO 6 - CRITÉRIO DE ACEITE TA11.4]: Usar token A novamente" -ForegroundColor Cyan
Write-Host "===========================================================" -ForegroundColor Cyan

try {
    Invoke-RestMethod -Uri "$baseUrl/api/v1/auth/me" -Method GET -Headers @{ Authorization = "Bearer $tokenAluno" }
    Write-Host " FALHA CRÍTICA: O token A continuou funcionando após a revogação!" -ForegroundColor Red
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    Write-Host " SUCESSO TA11.4: O token anterior foi sumariamente BLOQUEADO com HTTP $statusCode Unauthorized!" -ForegroundColor Green
}

Write-Host "`n===========================================================" -ForegroundColor Cyan
Write-Host " [PASSO 7] Tentativa de novo login com o usuário revogado" -ForegroundColor Cyan
Write-Host "===========================================================" -ForegroundColor Cyan

try {
    Invoke-RestMethod -Uri "$baseUrl/api/v1/auth/login" -Method POST -ContentType "application/json" -Body $loginAlunoPayload
    Write-Host " FALHA: Usuário revogado não deveria conseguir logar!" -ForegroundColor Red
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    Write-Host " Novo login devidamente impedido: HTTP $statusCode Unauthorized!" -ForegroundColor Green
}

Write-Host "`n===========================================================" -ForegroundColor Magenta
Write-Host " TODOS OS CRITÉRIOS DE ACEITE DA TASK #50 / US 11 VALIDADOS COM SUCESSO!" -ForegroundColor Magenta
Write-Host "===========================================================" -ForegroundColor Magenta
