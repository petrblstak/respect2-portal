# Update cmp-portal-core library from local build
# 
# Usage:
#   From PowerShell: .\scripts\update-library.ps1
#   Or add to package.json scripts: "update-lib": "powershell -File ./scripts/update-library.ps1"
#   Then run: npm run update-lib

$ErrorActionPreference = "Stop"

Write-Host "`n=== Updating cmp-portal-core library ===" -ForegroundColor Cyan

# Path to library project (relative to this app's root)
$libraryPath = "..\\_portal-libs-v25"
$libraryDistPath = "$libraryPath\\dist\\cmp-portal-core"
$appLibraryPath = "node_modules\\cmp-portal-core"

# Check if library dist exists
if (-not (Test-Path $libraryDistPath)) {
    Write-Host "`nError: Library dist folder not found at: $libraryDistPath" -ForegroundColor Red
    Write-Host "Please build the library first:" -ForegroundColor Yellow
    Write-Host "  cd $libraryPath" -ForegroundColor Yellow
    Write-Host "  npm run build" -ForegroundColor Yellow
    exit 1
}

# Remove old library from node_modules
Write-Host "`n1. Removing old library from node_modules..." -ForegroundColor Yellow
if (Test-Path $appLibraryPath) {
    Remove-Item -Recurse -Force $appLibraryPath
    Write-Host "   Old library removed" -ForegroundColor Green
} else {
    Write-Host "   No existing library found (first install)" -ForegroundColor Gray
}

# Copy fresh library build
Write-Host "`n2. Copying fresh library build..." -ForegroundColor Yellow
Copy-Item -Recurse -Force $libraryDistPath $appLibraryPath
Write-Host "   Library copied successfully" -ForegroundColor Green

# Delete Angular cache to ensure fresh library is picked up
Write-Host "`n3. Clearing Angular build cache..." -ForegroundColor Yellow
$angularCachePath = ".angular\\cache"
if (Test-Path $angularCachePath) {
    Remove-Item -Recurse -Force $angularCachePath
    Write-Host "   Angular cache cleared" -ForegroundColor Green
} else {
    Write-Host "   No cache found (already clean)" -ForegroundColor Gray
}

Write-Host "`n=== Update complete! ===" -ForegroundColor Green
Write-Host "You can now run: ng serve" -ForegroundColor Cyan
Write-Host ""
