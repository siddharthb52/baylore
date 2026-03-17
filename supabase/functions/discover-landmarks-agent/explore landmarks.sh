$body = Get-Content test-agent-payload.json -Raw

Invoke-RestMethod -Uri "https://aocqfveoztmwntoexkpj.supabase.co/functions/v1/discover-landmarks-agent" `
  -Method Post `
  -Headers @{
    "Authorization" = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvY3FmdmVvenRtd250b2V4a3BqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk0MjMyNDQsImV4cCI6MjA2NDk5OTI0NH0.BdDJP40QF5yg0maBakYRxbV4skbwd_lDzye57QIs8PE"
    "Content-Type" = "application/json"
  } `
  -Body $body