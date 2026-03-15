# Test directo al backend de Render
$body = @{
    customerName = "Test User"
    customerPhone = "1234567890"
    reservationDate = "2026-03-15"
    reservationTime = "19:00"
    partySize = 4
    message = "Test from API"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "https://pachanga-api.onrender.com/api/reservations" -Method POST -ContentType "application/json" -Body $body -TimeoutSec 30
    Write-Host "✅ SUCCESS: Reservation created" -ForegroundColor Green
    Write-Host ($response | ConvertTo-Json)
} catch {
    Write-Host "❌ ERROR: $_" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $reader.BaseStream.Position = 0
        $reader.DiscardBufferedData()
        $errorResponse = $reader.ReadToEnd()
        Write-Host "Response: $errorResponse" -ForegroundColor Yellow
    }
}
