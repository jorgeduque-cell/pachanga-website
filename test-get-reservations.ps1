# Verificar si las reservas existen en el backend
Invoke-RestMethod -Uri "https://pachanga-api.onrender.com/api/reservations" -Headers @{Authorization="Bearer test"} | ConvertTo-Json -Depth 3
