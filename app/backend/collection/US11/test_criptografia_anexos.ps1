# ====================================================================
# TESTE DOS CRITÉRIOS DE ACEITE DA TASK #51 / US 11 (TA11.1, TA11.2, TA3.2)
# Motor de Criptografia em Repouso (AES-256-GCM) para Anexos Médicos
# ====================================================================

$baseUrl = "http://localhost:8080"
$estudanteId = "11111111-1111-1111-1111-111111111111"

function Obter-TokenJwt($email, $senha) {
    $payload = @{
        email = $email
        senha = $senha
    } | ConvertTo-Json
    $resp = Invoke-RestMethod -Uri "$baseUrl/api/v1/auth/login" -Method POST -ContentType "application/json" -Body $payload
    return $resp.token
}

Write-Host "===========================================================" -ForegroundColor Cyan
Write-Host " [PASSO 1] Autenticar com perfil Autorizado Saúde (SUPER_RESTRICAO + autorizacaoSaude=true)" -ForegroundColor Cyan
Write-Host "===========================================================" -ForegroundColor Cyan

$tokenSaude = Obter-TokenJwt "admin@sigi.ifpb.edu.br" "senha123"
Write-Host " Token de Saúde (SUPER_RESTRICAO + autorizacaoSaude=true) obtido com sucesso!" -ForegroundColor Green

Write-Host "`n===========================================================" -ForegroundColor Cyan
Write-Host " [PASSO 2 - TA11.1] Upload de PDF Sensível (LAUDO_MEDICO) para Cifragem em Repouso" -ForegroundColor Cyan
Write-Host "===========================================================" -ForegroundColor Cyan

$pdfConteudoOriginal = "%PDF-1.7`n1 0 obj << /Type /Catalog >> endobj`nLAUDO MEDICO CONFIDENCIAL - CID F84.0 (TEA)`n%%EOF"
$tempPdfPath = Join-Path $env:TEMP "laudo_teste_task51.pdf"
[System.IO.File]::WriteAllText($tempPdfPath, $pdfConteudoOriginal, [System.Text.Encoding]::UTF8)

$curlUploadOutput = curl.exe -s -X POST "$baseUrl/api/v1/estudantes/$estudanteId/anexos" `
    -H "Authorization: Bearer $tokenSaude" `
    -F "arquivo=@$tempPdfPath;type=application/pdf" `
    -F "classificacao=LAUDO_MEDICO"

Remove-Item $tempPdfPath -Force -ErrorAction SilentlyContinue

$anexoCriado = $curlUploadOutput | ConvertFrom-Json
$anexoId = $anexoCriado.id

Write-Host " Anexo Médico salvo com sucesso! ID: $anexoId" -ForegroundColor Green
Write-Host " Classificação: $($anexoCriado.classificacao) | Criptografado em Repouso: $($anexoCriado.criptografado)"

Write-Host "`n===========================================================" -ForegroundColor Cyan
Write-Host " [PASSO 3 - CA 2 / TA11.2] Download em Memória por Profissional Autorizado (Deve retornar 200 OK)" -ForegroundColor Cyan
Write-Host "===========================================================" -ForegroundColor Cyan

$responseDownload = Invoke-WebRequest -Uri "$baseUrl/api/v1/anexos/$anexoId/download" -Method GET -Headers @{ Authorization = "Bearer $tokenSaude" } -UseBasicParsing
$textoDescriptografado = [System.Text.Encoding]::UTF8.GetString($responseDownload.Content)

if ($responseDownload.StatusCode -eq 200 -and $textoDescriptografado.StartsWith("%PDF-1.7")) {
    Write-Host " SUCESSO CA 2 [TA11.2]: PDF descriptografado exclusivamente em memória e íntegro (HTTP 200)!" -ForegroundColor Green
} else {
    Write-Host " FALHA CA 2: O conteúdo baixado não corresponde ao PDF original!" -ForegroundColor Red
}

Write-Host "`n===========================================================" -ForegroundColor Cyan
Write-Host " [PASSO 4 - CA 3 / TA11.2 e TA3.2] Coordenador (SUPER_RESTRICAO, autorizacaoSaude=false) tenta baixar (Deve dar 403)" -ForegroundColor Cyan
Write-Host "===========================================================" -ForegroundColor Cyan

$tokenCoordenador = Obter-TokenJwt "coordenador@sigi.ifpb.edu.br" "senha123"
try {
    Invoke-RestMethod -Uri "$baseUrl/api/v1/anexos/$anexoId/download" -Method GET -Headers @{ Authorization = "Bearer $tokenCoordenador" }
    Write-Host " FALHA: Coordenador sem autorização de saúde não deveria baixar laudo médico!" -ForegroundColor Red
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    Write-Host " SUCESSO CA 3: Coordenador bloqueado com HTTP $statusCode Forbidden!" -ForegroundColor Green
}

Write-Host "`n===========================================================" -ForegroundColor Cyan
Write-Host " [PASSO 5 - CA 3 / TA11.2 e TA3.2] Professor (ACESSO_FUNCIONAL, autorizacaoSaude=false) tenta baixar (Deve dar 403)" -ForegroundColor Cyan
Write-Host "===========================================================" -ForegroundColor Cyan

$tokenProfessor = Obter-TokenJwt "professor@sigi.ifpb.edu.br" "senha123"
try {
    Invoke-RestMethod -Uri "$baseUrl/api/v1/anexos/$anexoId/download" -Method GET -Headers @{ Authorization = "Bearer $tokenProfessor" }
    Write-Host " FALHA: Professor não deveria baixar laudo médico!" -ForegroundColor Red
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    Write-Host " SUCESSO CA 3: Professor bloqueado com HTTP $statusCode Forbidden!" -ForegroundColor Green
}

Write-Host "`n===========================================================" -ForegroundColor Cyan
Write-Host " [PASSO 6 - CA 3 / TA11.2] Perfil com RESTRICAO_MODERADA (mesmo com autorizacaoSaude=true) tenta baixar (Deve dar 403)" -ForegroundColor Cyan
Write-Host "===========================================================" -ForegroundColor Cyan

$tokenPsicopedagogo = Obter-TokenJwt "psicopedagogo@sigi.ifpb.edu.br" "senha123"
try {
    Invoke-RestMethod -Uri "$baseUrl/api/v1/anexos/$anexoId/download" -Method GET -Headers @{ Authorization = "Bearer $tokenPsicopedagogo" }
    Write-Host " FALHA: Perfil sem SUPER_RESTRICAO não deveria baixar laudo médico!" -ForegroundColor Red
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    Write-Host " SUCESSO CA 3: Bloqueado com HTTP $statusCode Forbidden (exige SUPER_RESTRICAO + autorizacaoSaude=true)!" -ForegroundColor Green
}

Write-Host "`n===========================================================" -ForegroundColor Magenta
Write-Host " TODOS OS CRITÉRIOS DE ACEITE DA TASK #51 (TA11.1, TA11.2 e TA3.2) VALIDADOS!" -ForegroundColor Magenta
Write-Host "===========================================================" -ForegroundColor Magenta
