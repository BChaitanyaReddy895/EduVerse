# Start both backend and frontend for development (Windows PowerShell)
# Run from project root

# Start backend
Start-Process -NoNewWindow -FilePath 'C:/Users/chait/AppData/Local/Programs/Python/Python313/python.exe' -ArgumentList 'scca_server.py'
Write-Output 'Started backend (scca_server.py)'

# Start frontend (Vite)
if (Test-Path package.json) {
  Write-Output 'Starting frontend: npm run dev'
  Start-Process -NoNewWindow -FilePath 'npm' -ArgumentList 'run', 'dev'
} else {
  Write-Output 'package.json not found; install frontend dependencies first.'
}
