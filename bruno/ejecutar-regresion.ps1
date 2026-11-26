param(
    [string]$DirectorioReportes = (
        Join-Path $env:TEMP (
            "parq41-regresion-" +
            (Get-Date -Format "yyyyMMdd-HHmmss")
        )
    )
)

$ErrorActionPreference = "Stop"

$raizBruno = $PSScriptRoot
$raizRepo = Split-Path $raizBruno -Parent
$basePruebas = "parqueadero_parq41_regresion_test"
$baseUrl = "http://localhost:3001"

$DirectorioReportes = [System.IO.Path]::GetFullPath(
    $DirectorioReportes
)

$ubicacionAnterior = Get-Location

try {
    Set-Location $raizRepo

    Write-Host "===== VERIFICACION DE SEGURIDAD ====="

    $usuarioDb = [string](
        docker compose exec -T db printenv POSTGRES_USER
    )

    if ($LASTEXITCODE -ne 0) {
        throw "No se pudo consultar el usuario de PostgreSQL"
    }

    $usuarioDb = $usuarioDb.Trim()

    $sql = @"
SELECT json_build_object(
    'base', current_database(),
    'sedeId', (SELECT id FROM sedes LIMIT 1),
    'sedes', (SELECT COUNT(*) FROM sedes),
    'carriles', (SELECT COUNT(*) FROM carriles),
    'usuarios', (SELECT COUNT(*) FROM usuarios),
    'espacios', (SELECT COUNT(*) FROM espacios),
    'disponibles', (
        SELECT COUNT(*) FROM espacios
        WHERE estado = 'DISPONIBLE'
    ),
    'tarifas', (SELECT COUNT(*) FROM tarifas),
    'vehiculos', (SELECT COUNT(*) FROM vehiculos),
    'cobros', (SELECT COUNT(*) FROM cobros),
    'pagos', (SELECT COUNT(*) FROM pagos),
    'permanencias', (SELECT COUNT(*) FROM permanencias),
    'alertas', (SELECT COUNT(*) FROM alertas),
    'detecciones', (SELECT COUNT(*) FROM detecciones),
    'eventos', (SELECT COUNT(*) FROM eventos_acceso),
    'auditorias', (SELECT COUNT(*) FROM auditoria)
);
"@

    $estadoJson = docker compose exec -T db psql `
        -U "$usuarioDb" `
        -d "$basePruebas" `
        -v ON_ERROR_STOP=1 `
        -tAc "$sql"

    if ($LASTEXITCODE -ne 0) {
        throw "No se pudo verificar la base aislada"
    }

    $estado = ($estadoJson -join "`n") |
        ConvertFrom-Json

    $salud = Invoke-RestMethod `
        -Uri "$baseUrl/health"

    $sede = Invoke-RestMethod `
        -Uri "$baseUrl/api/sedes/actual"

    if (
        $estado.base -ne $basePruebas -or
        $salud.status -ne "ok" -or
        $salud.database -ne "ok" -or
        $sede.id -ne $estado.sedeId
    ) {
        throw "El backend no corresponde a la base aislada"
    }

    if (
        $estado.sedes -ne 1 -or
        $estado.carriles -ne 2 -or
        $estado.usuarios -ne 2 -or
        $estado.espacios -ne 15 -or
        $estado.disponibles -ne 15 -or
        $estado.tarifas -ne 4 -or
        $estado.vehiculos -ne 0 -or
        $estado.cobros -ne 0 -or
        $estado.pagos -ne 0 -or
        $estado.permanencias -ne 0 -or
        $estado.alertas -ne 0 -or
        $estado.detecciones -ne 0 -or
        $estado.eventos -ne 0 -or
        $estado.auditorias -ne 0
    ) {
        throw "La base no esta en su estado inicial"
    }

    Write-Host "Base aislada y estado inicial verificados" `
        -ForegroundColor Green

    Set-Location $raizBruno

    $manifiesto = Get-Content `
        ".\regresion.json" -Raw |
        ConvertFrom-Json

    $secuencia = @(
        foreach ($bloque in $manifiesto.bloques) {
            $bloque.solicitudes
        }
    )

    $unicas = @(
        $secuencia | Sort-Object -Unique
    )

    if (
        $manifiesto.bloques.Count -ne 11 -or
        $secuencia.Count -ne 221 -or
        $unicas.Count -ne 180
    ) {
        throw "Manifiesto de regresion incorrecto"
    }

    foreach ($archivo in $unicas) {
        if (-not (Test-Path $archivo -PathType Leaf)) {
            throw "Solicitud inexistente: $archivo"
        }
    }

    foreach ($bloque in $manifiesto.bloques) {
        if ([int]$bloque.pruebasEsperadas -le 0) {
            throw "Faltan pruebas esperadas: $($bloque.id)"
        }
    }

    $adminSeguro = Read-Host `
        "Contrasena del administrador de pruebas" `
        -AsSecureString

    $operadorSeguro = Read-Host `
        "Contrasena del operador de pruebas" `
        -AsSecureString

    $adminPassword = (
        [System.Net.NetworkCredential]::new(
            "", $adminSeguro
        )
    ).Password

    $operadorPassword = (
        [System.Net.NetworkCredential]::new(
            "", $operadorSeguro
        )
    ).Password

    New-Item `
        -ItemType Directory `
        -Path $DirectorioReportes `
        -Force | Out-Null

    $resultados = @()
    $inicio = Get-Date

    foreach ($bloque in $manifiesto.bloques) {

        Write-Host "`n===== BLOQUE $($bloque.id) =====" `
            -ForegroundColor Cyan

        $solicitudes = @($bloque.solicitudes)

        $rutaReporte = Join-Path `
            $DirectorioReportes `
            "regresion-$($bloque.id).json"

        npx --yes --package=@usebruno/cli@4.4.0 `
            bru run @solicitudes `
            --env Local `
            --env-var "baseUrl=$baseUrl" `
            --env-var "adminPassword=$adminPassword" `
            --env-var "operadorPassword=$operadorPassword" `
            --bail `
            --reporter-skip-all-headers `
            --reporter-skip-body `
            --reporter-json "$rutaReporte"

        $codigo = $LASTEXITCODE

        if (-not (Test-Path $rutaReporte)) {
            throw "Bruno no genero el reporte $($bloque.id)"
        }

        $reporte = @(
            Get-Content $rutaReporte -Raw |
                ConvertFrom-Json
        )

        if ($reporte.Count -ne 1) {
            throw "Formato inesperado de reporte"
        }

        $resumen = $reporte[0].summary

        $aprobado = (
            $codigo -eq 0 -and
            $resumen.totalRequests -eq $solicitudes.Count -and
            @($reporte[0].results).Count -eq $solicitudes.Count -and
            $resumen.passedRequests -eq $solicitudes.Count -and
            $resumen.failedRequests -eq 0 -and
            $resumen.errorRequests -eq 0 -and
            $resumen.skippedRequests -eq 0 -and
            $resumen.skippedByBail -eq 0 -and
            $resumen.totalTests -eq $bloque.pruebasEsperadas -and
            $resumen.passedTests -eq $bloque.pruebasEsperadas -and
            $resumen.failedTests -eq 0 -and
            $resumen.failedAssertions -eq 0 -and
            $resumen.failedPreRequestTests -eq 0 -and
            $resumen.failedPostResponseTests -eq 0
        )

        $resultados += [PSCustomObject]@{
            Bloque = $bloque.id
            SolicitudesEsperadas = $solicitudes.Count
            SolicitudesAprobadas = $resumen.passedRequests
            PruebasEsperadas = $bloque.pruebasEsperadas
            PruebasAprobadas = $resumen.passedTests
            CodigoSalida = $codigo
            Aprobado = $aprobado
        }

        [System.IO.File]::WriteAllText(
            (Join-Path $DirectorioReportes "resumen.json"),
            (ConvertTo-Json -InputObject @($resultados) -Depth 10),
            [System.Text.UTF8Encoding]::new($false)
        )

        if (-not $aprobado) {
            $resultados | Format-Table -AutoSize

            throw "Regresion detenida en bloque $($bloque.id)"
        }

        Write-Host "Bloque $($bloque.id) aprobado" `
            -ForegroundColor Green
    }

    $duracion = (Get-Date) - $inicio

    Write-Host "`n===== RESULTADO FINAL ====="

    $resultados | Format-Table -AutoSize

    Write-Host "Bloques aprobados: $($resultados.Count)/11"

    Write-Host "Solicitudes aprobadas: $(
        ($resultados |
            Measure-Object SolicitudesAprobadas -Sum).Sum
    )"

    Write-Host "Pruebas aprobadas: $(
        ($resultados |
            Measure-Object PruebasAprobadas -Sum).Sum
    )"

    Write-Host "Duracion: $(
        [Math]::Round($duracion.TotalSeconds, 2)
    ) segundos"

    Write-Host "Reportes: $DirectorioReportes"

    Write-Host "REGRESION COMPLETA APROBADA" `
        -ForegroundColor Green
}
finally {
    Remove-Variable adminPassword, operadorPassword, `
        adminSeguro, operadorSeguro `
        -ErrorAction SilentlyContinue

    Set-Location $ubicacionAnterior
}