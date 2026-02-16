# Element Plus 增量引入完成

## 改动文件列表

### 1. `package.json`
**位置**: 第 11-16 行  
**改动**: 在 `dependencies` 中添加 `element-plus`

```json
"dependencies": {
  "axios": "^1.13.2",
  "element-plus": "^2.8.8",  // 新增
  "pinia": "^2.2.6",
  "vue": "^3.5.24",
  "vue-router": "^4.4.5"
}
```

### 2. `src/main.js`
**位置**: 第 1-10 行  
**改动**: 全量引入 ElementPlus 和样式

```javascript
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'           // 新增
import 'element-plus/dist/index.css'             // 新增
import App from './App.vue'
import router from './router'

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.use(ElementPlus)                             // 新增
app.mount('#app')
```

### 3. `src/pages/admin/Merchants.vue`
**位置**: 第 2-6 行（template 部分）  
**改动**: 添加 Element Plus 验证按钮

```vue
<template>
  <div class="merchants">
    <h1>Merchants</h1>
    <p>Merchant management coming soon...</p>
    <!-- Element Plus 验证 -->
    <el-button type="primary">Element Plus 按钮验证</el-button>  <!-- 新增 -->
  </div>
</template>
```

## 关键代码片段位置

### 1. ElementPlus 导入和注册
**文件**: `src/main.js`  
**行号**: 第 3-4 行（导入），第 9 行（注册）

```javascript
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
// ...
app.use(ElementPlus)
```

### 2. 验证组件使用
**文件**: `src/pages/admin/Merchants.vue`  
**行号**: 第 6 行

```vue
<el-button type="primary">Element Plus 按钮验证</el-button>
```

## 验证步骤

1. **安装依赖**:
   ```bash
   cd D:\workspace\ai-photo-booth-web-console
   npm install
   ```

2. **启动开发服务器**:
   ```bash
   npm run dev
   ```

3. **验证组件**:
   - 访问 `/admin/merchants` 页面
   - 应该能看到一个蓝色的 "Element Plus 按钮验证" 按钮
   - 如果按钮正常显示，说明 Element Plus 已成功引入

## 说明

- ✅ 全量引入（非按需加载）
- ✅ 不修改现有页面结构
- ✅ 仅在 Merchants 页面添加验证按钮
- ✅ 不引入其他 UI 库
- ✅ 不重构现有代码
