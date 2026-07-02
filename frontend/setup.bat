@echo off
echo ========================================
echo Installation Frontend Hydro Dashboard
echo ========================================

cd /d "C:\dev\App-1\frontend"

echo 1. Suppression anciennes dépendances...
rmdir /s /q node_modules 2>nul
del package-lock.json 2>nul

echo 2. Installation des dépendances...
npm install

echo 3. Vérification de l'installation...
echo.
echo Dependances installees:
npm list @vitejs/plugin-react vite react react-dom

echo.
echo 4. Demarrage du serveur de developpement...
echo.
npm run dev