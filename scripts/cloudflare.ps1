param(
    [ValidateSet('dev', 'check', 'deploy', 'login', 'whoami')]
    [string]$Action = 'dev'
)

$ErrorActionPreference = 'Stop'
$workspace = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$drive = 'X:'
$mapping = & subst | Where-Object { $_ -match '^X:\\' }
if ($mapping -and -not $mapping.EndsWith($workspace)) {
    throw "A unidade X: ja aponta para outro local: $mapping"
}
$createdMapping = -not $mapping
if ($createdMapping) {
    & subst $drive $workspace
    if ($LASTEXITCODE -ne 0) { throw 'Falha ao criar a unidade temporaria X:' }
}

try {
    $tools = 'X:\.cloudflare-dev\tools'
    $uv = Join-Path $tools 'bin\uv.exe'
    if (-not (Test-Path $uv)) {
        Push-Location 'X:\'
        try {
            python -m pip install --target $tools uv
            if ($LASTEXITCODE -ne 0) { throw 'Falha ao instalar uv' }
        } finally { Pop-Location }
    }
    $env:UV_PYTHON_INSTALL_DIR = 'X:\.cloudflare-dev\.uv-python'
    $env:UV_CACHE_DIR = 'X:\.cloudflare-dev\.uv-cache'
    $env:PATH = (Join-Path $tools 'bin') + [IO.Path]::PathSeparator + $env:PATH

    if ($Action -in @('dev', 'check', 'deploy')) {
        Push-Location 'X:\frontend'
        try {
            if (-not (Test-Path 'node_modules')) {
                npm.cmd ci
                if ($LASTEXITCODE -ne 0) { throw 'Falha ao instalar dependencias do front-end' }
            }
            npm.cmd run build
            if ($LASTEXITCODE -ne 0) { throw 'Falha no build do front-end' }
        } finally { Pop-Location }
    }

    $stage = 'X:\.cloudflare-dev\stage'
    $stageRoot = (Resolve-Path 'X:\.cloudflare-dev').Path
    foreach ($generated in @((Join-Path $stage 'src\app'), (Join-Path $stage 'public'))) {
        if (Test-Path $generated) {
            $resolved = (Resolve-Path $generated).Path
            if (-not $resolved.StartsWith($stageRoot + [IO.Path]::DirectorySeparatorChar)) {
                throw "Caminho gerado fora da pasta de trabalho: $resolved"
            }
            Remove-Item -LiteralPath $resolved -Recurse -Force
        }
    }
    New-Item -ItemType Directory -Path (Join-Path $stage 'src') -Force | Out-Null
    Copy-Item -LiteralPath 'X:\cloudflare\worker.py' -Destination (Join-Path $stage 'src\worker.py') -Force
    Copy-Item -LiteralPath 'X:\backend\app' -Destination (Join-Path $stage 'src\app') -Recurse -Force
    Copy-Item -LiteralPath 'X:\cloudflare\wrangler.jsonc' -Destination (Join-Path $stage 'wrangler.jsonc') -Force
    Copy-Item -LiteralPath 'X:\cloudflare\pyproject.toml' -Destination (Join-Path $stage 'pyproject.toml') -Force
    if ($Action -in @('dev', 'check', 'deploy')) {
        Copy-Item -LiteralPath 'X:\frontend\dist' -Destination (Join-Path $stage 'public') -Recurse -Force
    }

    Push-Location $stage
    try {
        switch ($Action) {
            'dev' { & $uv run pywrangler dev --local --port 8787 --log-level error }
            'check' {
                $log = 'X:\.cloudflare-dev\check.log'
                $previousPreference = $ErrorActionPreference
                $ErrorActionPreference = 'Continue'
                try {
                    & $uv run pywrangler deploy --dry-run --outdir 'X:\.cloudflare-dev\check-bundle' 2>&1 | Out-File -LiteralPath $log -Encoding UTF8
                    $checkCode = $LASTEXITCODE
                } finally { $ErrorActionPreference = $previousPreference }
                Get-Content -LiteralPath $log -Tail 12
                if ($checkCode -ne 0) { throw "Empacotamento Cloudflare falhou (codigo $checkCode)" }
            }
            'deploy' { & $uv run pywrangler deploy }
            'login' { & $uv run pywrangler login --device --browser=false }
            'whoami' { & $uv run pywrangler whoami }
        }
        if ($LASTEXITCODE -ne 0) { throw "Cloudflare $Action falhou (codigo $LASTEXITCODE)" }
    } finally { Pop-Location }
} finally {
    if ($createdMapping) { & subst $drive /D }
}
