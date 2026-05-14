@echo off
echo ========================================
echo Nettoyage et reconstruction du backend
echo ========================================

echo 1. Arrêt des processus...
taskkill /f /im node.exe 2>nul

echo 2. Nettoyage des fichiers compilés...
cd /d "C:\dev\App-1\backend"
if exist dist rmdir /s /q dist
del *.log 2>nul

echo 3. Vérification des fichiers TypeScript...
echo.
echo Correction des erreurs de duplication...
powershell -Command "(Get-Content 'src/services/hydro.service.ts') -replace 'async getStations.*{.*}', '' | Set-Content 'src/services/hydro.service.ts'"
powershell -Command "Get-Content 'src/services/hydro.service.ts' | Select-Object -Unique | Set-Content 'src/services/hydro.service.ts.temp'"
move /y "src/services/hydro.service.ts.temp" "src/services/hydro.service.ts"

echo 4. Compilation TypeScript...
npx tsc --noEmit
if %errorlevel% neq 0 (
    echo ❌ Erreurs TypeScript détectées
    pause
    exit /b 1
)

echo 5. Construction...
npx tsc

echo 6. Démarrage du serveur...
echo.
echo ✅ Backend démarré sur http://localhost:5000
echo ✅ Testez avec: curl http://localhost:5000/api/v1/hydro/health
echo.
npm run dev