Write-Host "Stopping Veridyn Services..."
$ports = @(3000, 5000, 8000)
foreach ($port in $ports) {
    $connections = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($connections) {
        foreach ($conn in $connections) {
            try {
                Stop-Process -Id $conn.OwningProcess -Force -ErrorAction SilentlyContinue
                Write-Host "Stopped process $($conn.OwningProcess) listening on port $port"
            } catch {
                Write-Host "Failed to stop process on port $port"
            }
        }
    } else {
        Write-Host "No process listening on port $port"
    }
}
Write-Host "Veridyn services shutdown complete."
