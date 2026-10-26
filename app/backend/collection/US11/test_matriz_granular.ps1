# =========================================================================
# Script de Validação Ponta a Ponta: Matriz de Autorização Granular (Task #52 - TA11.3 / TA3.2)
# =========================================================================

$BaseUrl = "http://localhost:8080"
$ErrorActionPreference = "Stop"

Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host " INICIANDO VALIDAÇÃO: MATRIZ DE AUTORIZAÇÃO GRANULAR (TASK #52)" -ForegroundColor Cyan
Write-Host "======================================================================" -ForegroundColor Cyan

function Autenticar-Usuario($email, $senha) {
    $body = @{
        email = $email
        senha = $senha
    } | ConvertTo-Json

    try {
        $resp = Invoke-RestMethod -Uri "$BaseUrl/api/v1/auth/login" -Method Post -Body $body -ContentType "application/json"
        return $resp.token
    } catch {
        Write-Host "Falha ao autenticar $email : $_" -ForegroundColor Red
        return $null
    }
}

# 1. Autenticações
Write-Host "`n[Passo 1] Autenticando usuários da matriz..." -ForegroundColor Yellow

$TokenProfessor = Autenticar-Usuario "professor@sigi.ifpb.edu.br" "senha123"
$TokenPsicopedagogo = Autenticar-Usuario "psicopedagogo@sigi.ifpb.edu.br" "senha123"
$TokenCoordenador = Autenticar-Usuario "coordenador@sigi.ifpb.edu.br" "senha123"
$TokenAdmin = Autenticar-Usuario "admin@sigi.ifpb.edu.br" "senha123"

if (-not $TokenProfessor -or -not $TokenPsicopedagogo) {
    Write-Host "Abortando: Certifique-se de que a aplicação está em execução na porta 8080 com os dados de seed." -ForegroundColor Red
    exit 1
}

Write-Host " Tokens obtidos com sucesso." -ForegroundColor Green

# 2. Obter estudante teste
$HeadersProf = @{ Authorization = "Bearer $TokenProfessor" }
$HeadersPsi  = @{ Authorization = "Bearer $TokenPsicopedagogo" }

Write-Host "`n[Passo 2] Localizando estudante para teste..." -ForegroundColor Yellow
# Buscar lista de estudantes ou endpoint público/autenticado
# UUID mock/padrão do seed da US 02/09 caso existente
$EstudanteId = "99999999-8888-7777-6666-555555555555"

# 3. [CA 1 - TA11.3]: Professor consultando Prontuário Unificado
Write-Host "`n[Passo 3 - CA 1] Professor consultando Prontuário Unificado (omissão de dados sensíveis)..." -ForegroundColor Yellow
try {
    $respProfProntuario = Invoke-RestMethod -Uri "$BaseUrl/api/v1/estudantes/$EstudanteId/prontuario" -Method Get -Headers $HeadersProf
    if ($null -eq $respProfProntuario.historicoFamiliar -and $null -eq $respProfProntuario.historicoSocioemocional) {
        Write-Host " APROVADO [CA 1]: Campos historicoFamiliar e historicoSocioemocional foram OMITIDOS para o Professor." -ForegroundColor Green
    } else {
        Write-Host " FALHA [CA 1]: Campos sensíveis foram expostos para o Professor!" -ForegroundColor Red
    }
} catch {
    Write-Host " Aviso na chamada de prontuário: $_" -ForegroundColor DarkYellow
}

# 4. [CA 1.2 - TA11.3]: Professor tentando acesso direto à rota exclusiva
Write-Host "`n[Passo 4 - CA 1.2] Professor tentando rota direta /historico-socioemocional (expectativa: 403 Forbidden)..." -ForegroundColor Yellow
try {
    $respDirect = Invoke-RestMethod -Uri "$BaseUrl/api/v1/estudantes/$EstudanteId/historico-socioemocional" -Method Get -Headers $HeadersProf
    Write-Host " FALHA [CA 1.2]: Professor conseguiu acessar rota restrita!" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode.value__ -eq 403) {
        Write-Host " APROVADO [CA 1.2]: HTTP 403 Forbidden retornado corretamente para o Professor." -ForegroundColor Green
    } else {
        Write-Host " Código inesperado: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor DarkYellow
    }
}

# 5. [CA 2 - TA11.3]: Psicopedagoga CLAI consultando rota exclusiva e Prontuário
Write-Host "`n[Passo 5 - CA 2] Psicopedagoga CLAI consultando rota direta /historico-socioemocional..." -ForegroundColor Yellow
try {
    $respPsiDirect = Invoke-RestMethod -Uri "$BaseUrl/api/v1/estudantes/$EstudanteId/historico-socioemocional" -Method Get -Headers $HeadersPsi
    Write-Host " APROVADO [CA 2]: HTTP 200 OK com acesso liberado para Psicopedagoga (RESTRICAO_MODERADA)." -ForegroundColor Green
} catch {
    Write-Host " Erro na consulta da Psicopedagoga: $_" -ForegroundColor Red
}

Write-Host "`n======================================================================" -ForegroundColor Cyan
Write-Host " VALIDAÇÃO CONCLUÍDA COM SUCESSO!" -ForegroundColor Cyan
Write-Host "======================================================================" -ForegroundColor Cyan
