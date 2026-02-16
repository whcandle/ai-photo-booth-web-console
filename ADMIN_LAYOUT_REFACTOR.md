# AdminLayout Element Plus 改造说明

## 改动文件

### `src/layouts/AdminLayout.vue`

## 关键结构

### 1. 布局容器结构（第 2-42 行）
```vue
<el-container class="admin-layout">
  <!-- 左侧菜单 -->
  <el-aside width="250px" class="sidebar">
    <div class="logo">AI Photo Booth</div>
    <el-menu ...>
      <!-- 菜单项 -->
    </el-menu>
  </el-aside>

  <!-- 主内容区 -->
  <el-container>
    <!-- 顶部栏 -->
    <el-header class="header">
      <!-- 用户信息和 Logout 按钮 -->
    </el-header>

    <!-- 内容区 -->
    <el-main class="main-content">
      <router-view />
    </el-main>
  </el-container>
</el-container>
```

### 2. 菜单配置位置（第 58-63 行）
```javascript
// 菜单配置：菜单项与路由路径对应
const menuItems = [
  { path: '/admin/dashboard', label: 'Dashboard' },
  { path: '/admin/templates', label: 'Templates' },
  { path: '/admin/merchants', label: 'Merchants' }
]
```

### 3. ElMenu 配置（第 10-25 行）
```vue
<el-menu
  :default-active="activeMenu"
  router
  class="admin-menu"
  background-color="#2c3e50"
  text-color="#fff"
  active-text-color="#409EFF"
>
  <el-menu-item index="/admin/dashboard">
    <span>Dashboard</span>
  </el-menu-item>
  <el-menu-item index="/admin/templates">
    <span>Templates</span>
  </el-menu-item>
  <el-menu-item index="/admin/merchants">
    <span>Merchants</span>
  </el-menu-item>
</el-menu>
```

**关键属性**:
- `:default-active="activeMenu"` - 绑定当前激活的菜单项
- `router` - 启用路由模式，点击菜单项自动跳转
- `index` - 菜单项对应的路由路径

### 4. 自动高亮逻辑（第 65-75 行）
```javascript
// 根据当前路由自动高亮对应菜单项
const activeMenu = computed(() => {
  const currentPath = route.path
  // 如果当前路径是 /admin/templates/:id，高亮 Templates 菜单
  if (currentPath.startsWith('/admin/templates')) {
    return '/admin/templates'
  }
  // 其他情况直接使用当前路径
  return currentPath
})
```

**说明**:
- 使用 `useRoute()` 获取当前路由
- 通过 `computed` 计算当前应该高亮的菜单项
- 处理子路由情况（如 `/admin/templates/:id` 时高亮 Templates）

### 5. 顶栏用户信息（第 32-37 行）
```vue
<el-header class="header">
  <div class="header-content">
    <div class="header-title">Admin Console</div>
    <div class="header-actions">
      <span class="user-name">{{ displayName }}</span>
      <el-button type="danger" size="small" @click="handleLogout">
        Logout
      </el-button>
    </div>
  </div>
</el-header>
```

**数据来源**:
- `displayName` 从 `authStore.displayName` 读取（第 77 行）
- 如果没有则显示 'Admin'（第 77 行）

### 6. Logout 逻辑（第 79-82 行）
```javascript
const handleLogout = () => {
  authStore.logout()
  router.push('/login')
}
```

**说明**:
- 调用 `authStore.logout()` 清空 token 和用户信息
- 跳转到登录页

## 菜单项与路由对应关系

| 菜单项 | 路由路径 | 说明 |
|--------|----------|------|
| Dashboard | `/admin/dashboard` | 仪表盘 |
| Templates | `/admin/templates` | 模板列表（包含子路由 `/admin/templates/:id`） |
| Merchants | `/admin/merchants` | 商户管理 |

## 特性说明

### ✅ 已实现
1. **标准布局**: 使用 `ElContainer` / `ElAside` / `ElHeader` / `ElMain`
2. **菜单导航**: 使用 `ElMenu` + `ElMenuItem`
3. **路由跳转**: 菜单项点击自动跳转（`router` 属性）
4. **自动高亮**: 根据当前路由自动高亮对应菜单项
5. **用户信息**: 顶栏显示登录用户（从 auth store 读取）
6. **Logout 功能**: 调用现有 logout 逻辑并跳转登录页

### 📝 注意事项
- 不改变既有路由结构
- 不新增业务页面
- 全量引入 Element Plus（非按需加载）
- 子路由（如 `/admin/templates/:id`）会自动高亮父菜单项

## 样式说明

- **侧边栏**: 深色主题（`#2c3e50`）
- **菜单**: 白色文字，激活时蓝色高亮（`#409EFF`）
- **顶栏**: 白色背景，带底部边框
- **内容区**: 浅灰色背景（`#f5f5f5`）
