# Quick verification script for AdminLayout
$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "AdminLayout Element Plus Quick Check" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

Set-Location $PSScriptRoot

# Check dependencies
Write-Host "`n[1/4] Checking dependencies..." -ForegroundColor Yellow
if (-not (Test-Path "node_modules")) {
    Write-Host "  Installing dependencies..." -ForegroundColor Yellow
    npm install
} else {
    Write-Host "  Dependencies OK" -ForegroundColor Green
}

# Check Element Plus
Write-Host "`n[2/4] Checking Element Plus..." -ForegroundColor Yellow
$elementPlusInstalled = Test-Path "node_modules/element-plus"
if ($elementPlusInstalled) {
    Write-Host "  Element Plus OK" -ForegroundColor Green
} else {
    Write-Host "  Installing Element Plus..." -ForegroundColor Yellow
    npm install element-plus
}

# Check AdminLayout.vue
Write-Host "`n[3/4] Checking AdminLayout.vue..." -ForegroundColor Yellow
$layoutFile = "src/layouts/AdminLayout.vue"
if (Test-Path $layoutFile) {
    $content = Get-Content $layoutFile -Raw -Encoding UTF8
    $checks = @{
        "el-container" = $content -match "el-container"
        "el-menu" = $content -match "el-menu"
        "el-header" = $content -match "el-header"
        "el-main" = $content -match "el-main"
        "router" = $content -match 'router'
        "activeMenu" = $content -match "activeMenu"
    }
    
    $allPass = $checks.Values | Where-Object { $_ -eq $false } | Measure-Object | Select-Object -ExpandProperty Count
    
    if ($allPass -eq 0) {
        Write-Host "  All Element Plus components found:" -ForegroundColor Green
        $checks.Keys | ForEach-Object { Write-Host "    [OK] $_" -ForegroundColor Gray }
    } else {
        Write-Host "  Missing components!" -ForegroundColor Red
        $checks.GetEnumerator() | Where-Object { $_.Value -eq $false } | ForEach-Object { 
            Write-Host "    [FAIL] $($_.Key)" -ForegroundColor Red 
        }
        exit 1
    }
} else {
    Write-Host "  AdminLayout.vue not found!" -ForegroundColor Red
    exit 1
}

# Check main.js
Write-Host "`n[4/4] Checking main.js..." -ForegroundColor Yellow
$mainFile = "src/main.js"
if (Test-Path $mainFile) {
    $content = Get-Content $mainFile -Raw -Encoding UTF8
    if ($content -match "element-plus") {
        Write-Host "  Element Plus configured in main.js" -ForegroundColor Green
    } else {
        Write-Host "  Element Plus not configured in main.js!" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "  main.js not found!" -ForegroundColor Red
    exit 1
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Verification Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "`nNext steps:" -ForegroundColor Yellow
Write-Host "  1. Run: npm run dev" -ForegroundColor Gray
Write-Host "  2. Open: http://localhost:5173/login" -ForegroundColor Gray
Write-Host "  3. Login and navigate to /admin/dashboard" -ForegroundColor Gray
Write-Host "  4. Verify:" -ForegroundColor Gray
Write-Host "     - Left menu shows Dashboard/Templates/Merchants" -ForegroundColor Gray
Write-Host "     - Menu items are clickable and navigate" -ForegroundColor Gray
Write-Host "     - Active menu item is highlighted (blue)" -ForegroundColor Gray
Write-Host "     - Top bar shows user name and Logout button" -ForegroundColor Gray
Write-Host "========================================" -ForegroundColor Cyan
