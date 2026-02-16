# AdminLayout Element Plus 验证指南

## 快速验证步骤

### 方法 1：使用验证脚本（推荐）

```powershell
cd D:\workspace\ai-photo-booth-web-console
.\verify_layout.ps1
```

脚本会自动：
1. 检查并安装依赖
2. 验证文件结构
3. 提供验证清单
4. 可选启动开发服务器

### 方法 2：手动验证

#### 1. 安装依赖（如未安装）
```powershell
cd D:\workspace\ai-photo-booth-web-console
npm install
```

#### 2. 启动开发服务器
```powershell
npm run dev
```

#### 3. 访问页面验证

打开浏览器访问：
- **登录页**: http://localhost:5173/login
- **Admin Dashboard**: http://localhost:5173/admin/dashboard
- **Admin Templates**: http://localhost:5173/admin/templates
- **Admin Merchants**: http://localhost:5173/admin/merchants

## 验证清单

### ✅ 布局结构验证

- [ ] **左侧菜单栏**
  - [ ] 显示 "AI Photo Booth" Logo
  - [ ] 菜单项：Dashboard、Templates、Merchants
  - [ ] 菜单背景色为深色（#2c3e50）
  - [ ] 菜单文字为白色

- [ ] **顶部栏**
  - [ ] 显示 "Admin Console" 标题
  - [ ] 右侧显示用户名（从 auth store 读取）
  - [ ] 显示红色 "Logout" 按钮

- [ ] **内容区**
  - [ ] 背景色为浅灰色（#f5f5f5）
  - [ ] 正确显示路由页面内容

### ✅ 功能验证

- [ ] **菜单导航**
  - [ ] 点击 "Dashboard" 跳转到 `/admin/dashboard`
  - [ ] 点击 "Templates" 跳转到 `/admin/templates`
  - [ ] 点击 "Merchants" 跳转到 `/admin/merchants`

- [ ] **菜单高亮**
  - [ ] 访问 `/admin/dashboard` 时，Dashboard 菜单高亮（蓝色）
  - [ ] 访问 `/admin/templates` 时，Templates 菜单高亮
  - [ ] 访问 `/admin/merchants` 时，Merchants 菜单高亮
  - [ ] 访问 `/admin/templates/:id` 时，Templates 菜单仍然高亮

- [ ] **用户信息**
  - [ ] 顶栏显示当前登录用户名（或 "Admin"）
  - [ ] 用户名从 `authStore.displayName` 读取

- [ ] **Logout 功能**
  - [ ] 点击 Logout 按钮
  - [ ] 调用 `authStore.logout()` 清空 token
  - [ ] 自动跳转到 `/login` 页面

### ✅ 样式验证

- [ ] **Element Plus 样式**
  - [ ] 菜单项有悬停效果
  - [ ] 激活菜单项有蓝色高亮
  - [ ] 按钮样式符合 Element Plus 规范
  - [ ] 整体布局美观，无样式错乱

- [ ] **响应式**
  - [ ] 布局在不同屏幕尺寸下正常显示
  - [ ] 菜单栏宽度固定 250px

## 常见问题排查

### 问题 1：Element Plus 组件不显示
**原因**: Element Plus 未正确引入
**解决**: 
1. 检查 `src/main.js` 是否包含：
   ```javascript
   import ElementPlus from 'element-plus'
   import 'element-plus/dist/index.css'
   app.use(ElementPlus)
   ```
2. 运行 `npm install element-plus`

### 问题 2：菜单点击不跳转
**原因**: ElMenu 未启用 router 模式
**解决**: 检查 `AdminLayout.vue` 中 `<el-menu>` 是否有 `router` 属性

### 问题 3：菜单不高亮
**原因**: `activeMenu` 计算属性未正确绑定
**解决**: 检查 `:default-active="activeMenu"` 是否正确绑定

### 问题 4：用户名为空
**原因**: auth store 中 displayName 为空
**解决**: 
1. 检查登录后是否正确设置 `displayName`
2. 检查 localStorage 中是否有 `displayName`
3. 默认会显示 "Admin"

### 问题 5：Logout 不工作
**原因**: authStore.logout() 未正确实现
**解决**: 检查 `src/store/auth.js` 中的 `logout` 方法

## 浏览器控制台检查

打开浏览器开发者工具（F12），检查：

1. **无错误信息**
   - Console 中无红色错误
   - Network 中无 404 资源加载失败

2. **Element Plus 样式加载**
   - Network 中能看到 `element-plus/dist/index.css` 加载成功

3. **路由跳转**
   - 点击菜单时，Console 中无路由相关错误

## 验证通过标准

✅ 所有布局结构验证项通过
✅ 所有功能验证项通过
✅ 浏览器控制台无错误
✅ 样式显示正常

如果以上所有项都通过，说明 AdminLayout Element Plus 改造成功！
