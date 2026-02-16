# AdminLayout Element Plus 验证脚本
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "AdminLayout Element Plus 验证" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$projectRoot = $PSScriptRoot
Set-Location $projectRoot

# 1. 检查依赖
Write-Host "`n[1/5] 检查依赖..." -ForegroundColor Yellow
if (-not (Test-Path "node_modules")) {
    Write-Host "  依赖未安装，正在安装..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  依赖安装失败！" -ForegroundColor Red
        exit 1
    }
    Write-Host "  依赖安装完成" -ForegroundColor Green
} else {
    Write-Host "  依赖已安装" -ForegroundColor Green
}

# 2. 检查 Element Plus
Write-Host "`n[2/5] 检查 Element Plus..." -ForegroundColor Yellow
$elementPlusInstalled = Test-Path "node_modules/element-plus"
if ($elementPlusInstalled) {
    Write-Host "  Element Plus 已安装" -ForegroundColor Green
} else {
    Write-Host "  Element Plus 未安装，正在安装..." -ForegroundColor Yellow
    npm install element-plus
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  Element Plus 安装失败！" -ForegroundColor Red
        exit 1
    }
    Write-Host "  Element Plus 安装完成" -ForegroundColor Green
}

# 3. 检查 AdminLayout.vue
Write-Host "`n[3/5] 检查 AdminLayout.vue..." -ForegroundColor Yellow
$layoutFile = "src/layouts/AdminLayout.vue"
if (Test-Path $layoutFile) {
    $content = Get-Content $layoutFile -Raw
    $hasElContainer = $content -match "el-container"
    $hasElMenu = $content -match "el-menu"
    $hasElHeader = $content -match "el-header"
    $hasElMain = $content -match "el-main"
    
    if ($hasElContainer -and $hasElMenu -and $hasElHeader -and $hasElMain) {
        Write-Host "  AdminLayout.vue 包含所有必需的 Element Plus 组件" -ForegroundColor Green
        Write-Host "    ✓ el-container" -ForegroundColor Gray
        Write-Host "    ✓ el-menu" -ForegroundColor Gray
        Write-Host "    ✓ el-header" -ForegroundColor Gray
        Write-Host "    ✓ el-main" -ForegroundColor Gray
    } else {
        Write-Host "  AdminLayout.vue 缺少必需的 Element Plus 组件！" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "  AdminLayout.vue 不存在！" -ForegroundColor Red
    exit 1
}

# 4. 检查 main.js
Write-Host "`n[4/5] 检查 main.js..." -ForegroundColor Yellow
$mainFile = "src/main.js"
if (Test-Path $mainFile) {
    $content = Get-Content $mainFile -Raw
    $hasElementPlus = $content -match "element-plus"
    if ($hasElementPlus) {
        Write-Host "  main.js 已配置 Element Plus" -ForegroundColor Green
    } else {
        Write-Host "  main.js 未配置 Element Plus！" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "  main.js 不存在！" -ForegroundColor Red
    exit 1
}

# 5. 启动开发服务器提示
Write-Host "`n[5/5] 准备启动开发服务器..." -ForegroundColor Yellow
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "验证清单" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "`n请在浏览器中访问以下页面进行验证：" -ForegroundColor Yellow
Write-Host "  1. 登录页面: http://localhost:5173/login" -ForegroundColor Gray
Write-Host "  2. Admin Dashboard: http://localhost:5173/admin/dashboard" -ForegroundColor Gray
Write-Host "  3. Admin Templates: http://localhost:5173/admin/templates" -ForegroundColor Gray
Write-Host "  4. Admin Merchants: http://localhost:5173/admin/merchants" -ForegroundColor Gray

Write-Host "`n验证要点：" -ForegroundColor Yellow
Write-Host "  ✓ 左侧菜单栏显示 Dashboard/Templates/Merchants" -ForegroundColor Gray
Write-Host "  ✓ 点击菜单项能正常跳转" -ForegroundColor Gray
Write-Host "  ✓ 当前页面菜单项自动高亮（蓝色）" -ForegroundColor Gray
Write-Host "  ✓ 顶栏显示 'Admin Console' 标题" -ForegroundColor Gray
Write-Host "  ✓ 顶栏右侧显示用户名和 Logout 按钮" -ForegroundColor Gray
Write-Host "  ✓ 点击 Logout 能正常退出并跳转登录页" -ForegroundColor Gray
Write-Host "  ✓ 访问 /admin/templates/:id 时 Templates 菜单高亮" -ForegroundColor Gray

Write-Host "`n启动命令：" -ForegroundColor Yellow
Write-Host "  npm run dev" -ForegroundColor Green
Write-Host "`n========================================" -ForegroundColor Cyan

# 询问是否立即启动
$start = Read-Host "`n是否立即启动开发服务器？(Y/N)"
if ($start -eq "Y" -or $start -eq "y") {
    Write-Host "`n正在启动开发服务器..." -ForegroundColor Yellow
    Write-Host "  访问地址将在终端中显示" -ForegroundColor Gray
    Write-Host "  按 Ctrl+C 停止服务器`n" -ForegroundColor Gray
    npm run dev
}
