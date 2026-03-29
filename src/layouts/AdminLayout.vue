<template>
  <el-container class="admin-layout">
    <!-- 左侧菜单 -->
    <el-aside :width="collapsed ? '64px' : '250px'" class="sidebar" :class="{ collapsed }">
      <div class="logo">{{ collapsed ? 'APB' : 'AI Photo Booth' }}</div>
      <el-menu
        :default-active="activeMenu"
        :collapse="collapsed"
        :collapse-transition="false"
        router
        class="admin-menu"
        background-color="#2c3e50"
        text-color="#fff"
        active-text-color="#409EFF"
      >
        <el-menu-item index="/admin/dashboard">
          <el-icon><House /></el-icon>
          <template #title><span>{{ t('menu.dashboard') }}</span></template>
        </el-menu-item>
        <el-sub-menu index="admin-merchant-mgmt">
          <template #title>
            <el-icon><OfficeBuilding /></el-icon>
            <span v-if="!collapsed">{{ t('menu.merchantGroup') }}</span>
          </template>
          <el-menu-item index="/admin/merchants">{{ t('menu.merchantList') }}</el-menu-item>
          <el-menu-item index="/admin/merchants/owners">{{ t('menu.merchantOwners') }}</el-menu-item>
          <el-menu-item index="/admin/merchants/staff">{{ t('menu.merchantStaff') }}</el-menu-item>
        </el-sub-menu>
        <el-sub-menu index="admin-operations">
          <template #title>
            <el-icon><Monitor /></el-icon>
            <span v-if="!collapsed">{{ t('menu.operationGroup') }}</span>
          </template>
          <el-menu-item index="/admin/merchants/activities">{{ t('menu.merchantActivitySupervision') }}</el-menu-item>
          <el-menu-item index="/admin/devices">{{ t('menu.merchantDeviceOwnership') }}</el-menu-item>
        </el-sub-menu>
        <el-sub-menu index="admin-finance">
          <template #title>
            <el-icon><Wallet /></el-icon>
            <span v-if="!collapsed">{{ t('menu.financeGroup') }}</span>
          </template>
          <el-menu-item index="/admin/system/membership-plans">{{ t('menu.membershipPlans') }}</el-menu-item>
          <el-menu-item index="/admin/system/pricing-rules">{{ t('menu.pricingRules') }}</el-menu-item>
          <el-menu-item index="/admin/merchants/subscriptions">{{ t('menu.merchantSubscriptions') }}</el-menu-item>
          <el-menu-item index="/admin/merchants/payments">{{ t('menu.merchantPayments') }}</el-menu-item>
        </el-sub-menu>
        <el-sub-menu index="admin-resources">
          <template #title>
            <el-icon><FolderOpened /></el-icon>
            <span v-if="!collapsed">{{ t('menu.resourceGroup') }}</span>
          </template>
          <el-menu-item index="/admin/template-types">{{ t('menu.templateTypes') }}</el-menu-item>
          <el-menu-item index="/admin/templates">{{ t('menu.templates') }}</el-menu-item>
          <el-menu-item index="/admin/designer">{{ t('menu.templateDesigner') }}</el-menu-item>
          <el-menu-item index="/admin/providers">{{ t('menu.providers') }}</el-menu-item>
          <el-menu-item index="/admin/routing-policies">{{ t('menu.routingPolicies') }}</el-menu-item>
        </el-sub-menu>
        <el-sub-menu index="admin-system">
          <template #title>
            <el-icon><Setting /></el-icon>
            <span v-if="!collapsed">{{ t('menu.systemGroup') }}</span>
          </template>
          <el-menu-item index="/admin/system/users">{{ t('menu.userManagement') }}</el-menu-item>
          <el-menu-item index="/admin/system/roles">{{ t('menu.roleManagement') }}</el-menu-item>
          <el-menu-item index="/admin/system/menus">{{ t('menu.menuPermissionManagement') }}</el-menu-item>
        </el-sub-menu>
      </el-menu>
    </el-aside>

    <!-- 主内容区 -->
    <el-container>
      <!-- 顶部栏 -->
      <el-header class="header">
        <div class="header-content">
          <div class="header-title-wrap">
            <el-tooltip :content="collapsed ? t('common.expand') : t('common.collapse')" placement="bottom">
              <el-button text class="collapse-btn" @click="toggleSidebar">
                <el-icon>
                  <Expand v-if="collapsed" />
                  <Fold v-else />
                </el-icon>
              </el-button>
            </el-tooltip>
            <div class="header-title">{{ t('layout.adminConsole') }}</div>
          </div>
          <div class="header-actions">
            <el-select
              v-model="locale"
              size="small"
              style="width: 130px"
              @change="onLocaleChange"
            >
              <el-option value="zh-CN" :label="t('common.chinese')" />
              <el-option value="en-US" :label="t('common.english')" />
            </el-select>
            <span class="user-name">{{ displayName }}</span>
            <el-button type="danger" size="small" @click="handleLogout">
              {{ t('layout.logout') }}
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
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../store/auth'
import { useI18n } from 'vue-i18n'
import { setLocale } from '../i18n'
import { Expand, Fold, FolderOpened, House, Monitor, OfficeBuilding, Setting, Wallet } from '@element-plus/icons-vue'

export default {
  name: 'AdminLayout',
  components: {
    Expand,
    Fold,
    FolderOpened,
    House,
    Monitor,
    OfficeBuilding,
    Setting,
    Wallet
  },
  setup() {
    const SIDEBAR_COLLAPSED_KEY = 'sidebar_collapsed'
    const route = useRoute()
    const router = useRouter()
    const authStore = useAuthStore()
    const { t, locale } = useI18n()
    const collapsed = ref(localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === '1')
    
    // 根据当前路由自动高亮对应菜单项
    const activeMenu = computed(() => {
      const currentPath = route.path
      // 如果当前路径是 /admin/templates/:id，高亮 Templates 菜单
      if (currentPath.startsWith('/admin/template-types')) {
        return '/admin/template-types'
      }
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
      if (currentPath.startsWith('/admin/merchants/owners')) {
        return '/admin/merchants/owners'
      }
      if (currentPath.startsWith('/admin/merchants/staff')) {
        return '/admin/merchants/staff'
      }
      if (currentPath.startsWith('/admin/merchants/activities')) {
        return '/admin/merchants/activities'
      }
      if (/^\/admin\/merchants\/\d+\/activities/.test(currentPath)) {
        return '/admin/merchants/activities'
      }
      if (currentPath.startsWith('/admin/devices')) {
        return '/admin/devices'
      }
      if (currentPath.startsWith('/admin/merchants/payments')) {
        return '/admin/merchants/payments'
      }
      if (currentPath.startsWith('/admin/merchants/subscriptions')) {
        return '/admin/merchants/subscriptions'
      }
      if (/^\/admin\/merchants\/\d+\/subscriptions/.test(currentPath)) {
        return '/admin/merchants/subscriptions'
      }
      if (/^\/admin\/merchants\/\d+\/payments/.test(currentPath)) {
        return '/admin/merchants/payments'
      }
      if (currentPath.startsWith('/admin/merchants')) {
        return '/admin/merchants'
      }
      if (currentPath.startsWith('/admin/system/pricing-rules')) {
        return '/admin/system/pricing-rules'
      }
      if (currentPath.startsWith('/admin/system/users')) {
        return '/admin/system/users'
      }
      if (currentPath.startsWith('/admin/system/roles')) {
        return '/admin/system/roles'
      }
      if (currentPath.startsWith('/admin/system/menus')) {
        return '/admin/system/menus'
      }
      if (currentPath.startsWith('/admin/system/membership-plans')) {
        return '/admin/system/membership-plans'
      }
      // 其他情况直接使用当前路径
      return currentPath
    })
    
    const displayName = computed(() => authStore.displayName || 'Admin')
    
    const handleLogout = () => {
      authStore.logout()
      router.push('/login')
    }

    const onLocaleChange = (value) => {
      setLocale(value)
    }

    const toggleSidebar = () => {
      collapsed.value = !collapsed.value
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, collapsed.value ? '1' : '0')
    }
    
    onMounted(() => {
      if (authStore.role === 'ADMIN') {
        authStore.fetchPermissions()
      }
    })

    return {
      activeMenu,
      displayName,
      handleLogout,
      t,
      locale,
      onLocaleChange,
      collapsed,
      toggleSidebar
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
  transition: width 0.2s ease;
  overflow: hidden;
}

.logo {
  height: 60px;
  line-height: 60px;
  text-align: center;
  font-size: 1.5rem;
  font-weight: bold;
  color: white;
  border-bottom: 1px solid #34495e;
  white-space: nowrap;
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

.header-title-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
}

.collapse-btn {
  color: #303133;
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
