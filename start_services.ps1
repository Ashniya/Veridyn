Write-Host "Starting Veridyn Services..."

# 1. Start Python ML Service
$mlProcess = Start-Process -FilePath "python" -ArgumentList "ml_api.py" -WorkingDirectory "$PSScriptRoot\Veridyn.ML" -PassThru -WindowStyle Hidden
Write-Host "Started Veridyn ML Service (PID: $($mlProcess.Id)) on http://127.0.0.1:8000"

# 2. Start .NET API Backend
$apiProcess = Start-Process -FilePath "dotnet" -ArgumentList "run --project Veridyn.API.csproj --no-build" -WorkingDirectory "$PSScriptRoot\Veridyn.API" -PassThru -WindowStyle Hidden
Write-Host "Started Veridyn API Backend (PID: $($apiProcess.Id)) on http://localhost:5000"

# 3. Start Frontend Client Dev Server
$clientProcess = Start-Process -FilePath "cmd.exe" -ArgumentList "/c npm run dev" -WorkingDirectory "$PSScriptRoot\Veridyn.Client" -PassThru -WindowStyle Hidden
Write-Host "Started Veridyn Client Dev Server (PID: $($clientProcess.Id)) on http://localhost:3000"

Start-Sleep -Seconds 5

Write-Host "`nActive connections on service ports:"
Get-NetTCPConnection -LocalPort 3000, 5000, 8000 -ErrorAction SilentlyContinue | Select-Object LocalAddress, LocalPort, State, OwningProcess | Format-Table -AutoSize
