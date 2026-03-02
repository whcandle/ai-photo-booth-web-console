<template>
  <el-container class="admin-layout">
    <!-- 左侧菜单 -->
    <el-aside width="250px" class="sidebar">
      <div class="logo">AI Photo Booth</div>
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
        <el-menu-item index="/admin/designer">
          <span>Template Designer</span>
        </el-menu-item>
        <el-menu-item index="/admin/merchants">
          <span>Merchants</span>
        </el-menu-item>
        <el-menu-item index="/admin/providers">
          <span>Providers</span>
        </el-menu-item>
        <el-menu-item index="/admin/routing-policies">
          <span>Routing Policies</span>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <!-- 主内容区 -->
    <el-container>
      <!-- 顶部栏 -->
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

      <!-- 内容区 -->
      <el-main class="main-content">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../store/auth'

export default {
  name: 'AdminLayout',
  setup() {
    const route = useRoute()
    const router = useRouter()
    const authStore = useAuthStore()
    
    // 菜单配置：菜单项与路由路径对应
    const menuItems = [
      { path: '/admin/dashboard', label: 'Dashboard' },
      { path: '/admin/templates', label: 'Templates' },
      { path: '/admin/designer', label: 'Template Designer' },
      { path: '/admin/merchants', label: 'Merchants' },
      { path: '/admin/providers', label: 'Providers' },
      { path: '/admin/routing-policies', label: 'Routing Policies' }
    ]
    
    // 根据当前路由自动高亮对应菜单项
    const activeMenu = computed(() => {
      const currentPath = route.path
      // 如果当前路径是 /admin/templates/:id，高亮 Templates 菜单
      if (currentPath.startsWith('/admin/templates')) {
        return '/admin/templates'
      }
      // 如果当前路径是 /admin/designer，高亮 Template Designer 菜单
      if (currentPath.startsWith('/admin/designer')) {
        return '/admin/designer'
      }
      // 如果当前路径是 /admin/providers/:id，高亮 Providers 菜单
      if (currentPath.startsWith('/admin/providers')) {
        return '/admin/providers'
      }
      // 如果当前路径是 /admin/routing-policies，高亮 Routing Policies 菜单
      if (currentPath.startsWith('/admin/routing-policies')) {
        return '/admin/routing-policies'
      }
      // 其他情况直接使用当前路径
      return currentPath
    })
    
    const displayName = computed(() => authStore.displayName || 'Admin')
    
    const handleLogout = () => {
      authStore.logout()
      router.push('/login')
    }
    
    return {
      menuItems,
      activeMenu,
      displayName,
      handleLogout
    }
  }
}
</script>

<style scoped>
.admin-layout {
  min-height: 100vh;
}

.sidebar {
  background-color: #2c3e50;
  color: white;
}

.logo {
  height: 60px;
  line-height: 60px;
  text-align: center;
  font-size: 1.5rem;
  font-weight: bold;
  color: white;
  border-bottom: 1px solid #34495e;
}

.admin-menu {
  border-right: none;
  height: calc(100vh - 60px);
}

.header {
  background-color: #fff;
  border-bottom: 1px solid #e4e7ed;
  padding: 0;
  height: 60px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 100%;
  padding: 0 20px;
}

.header-title {
  font-size: 1.2rem;
  font-weight: 600;
  color: #303133;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 15px;
}

.user-name {
  color: #606266;
  font-size: 14px;
}

.main-content {
  background-color: #f5f5f5;
  padding: 20px;
}
</style>
