import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../store/auth'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../pages/LoginPage.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/merchant',
    component: () => import('../layouts/MerchantLayout.vue'),
    meta: { requiresAuth: true, roles: ['MERCHANT_OWNER', 'MERCHANT_STAFF', 'ADMIN'] },
    children: [
      {
        path: 'dashboard',
        name: 'MerchantDashboard',
        component: () => import('../pages/merchant/Dashboard.vue')
      },
      {
        path: 'activities',
        name: 'MerchantActivities',
        component: () => import('../pages/merchant/Activities.vue')
      },
      {
        path: 'activities/:id',
        name: 'ActivityDetail',
        component: () => import('../pages/merchant/ActivityDetail.vue')
      },
      {
        path: 'devices',
        name: 'MerchantDevices',
        component: () => import('../pages/merchant/Devices.vue')
      }
    ]
  },
  {
    path: '/admin',
    component: () => import('../layouts/AdminLayout.vue'),
    meta: { requiresAuth: true, roles: ['ADMIN'] },
    children: [
      {
        path: 'dashboard',
        name: 'AdminDashboard',
        component: () => import('../pages/admin/Dashboard.vue')
      },
      {
        path: 'template-types',
        name: 'AdminTemplateTypes',
        component: () => import('../pages/admin/TemplateTypes.vue')
      },
      {
        path: 'templates',
        name: 'AdminTemplates',
        component: () => import('../pages/admin/Templates.vue')
      },
      {
        path: 'templates/:id',
        name: 'TemplateEditor',
        component: () => import('../pages/admin/TemplateEditor.vue')
      },
      {
        path: 'designer',
        name: 'AdminDesigner',
        component: () => import('../pages/admin/Designer.vue')
      },
      {
        path: 'designer/:designerType/:templateId/:versionId',
        name: 'AdminDesignerEditor',
        component: () => import('../pages/admin/DesignerEditor.vue')
      },
      {
        path: 'merchants/owners',
        name: 'AdminMerchantOwners',
        component: () => import('../pages/admin/MerchantScopedUsers.vue'),
        meta: { fixedRole: 'MERCHANT_OWNER', pageTitleKey: 'page.merchantOwners' }
      },
      {
        path: 'merchants/staff',
        name: 'AdminMerchantStaff',
        component: () => import('../pages/admin/MerchantScopedUsers.vue'),
        meta: { fixedRole: 'MERCHANT_STAFF', pageTitleKey: 'page.merchantStaff' }
      },
      {
        path: 'merchants/activities',
        name: 'AdminMerchantActivities',
        component: () => import('../pages/admin/MerchantActivitiesAdmin.vue')
      },
      {
        path: 'merchants/subscriptions',
        name: 'AdminMerchantSubscriptions',
        component: () => import('../pages/admin/MerchantSubscriptionsAdmin.vue')
      },
      {
        path: 'merchants/:id/activities',
        name: 'AdminMerchantActivitiesByMerchant',
        component: () => import('../pages/admin/MerchantActivitiesPage.vue')
      },
      {
        path: 'merchants/:id/subscriptions',
        name: 'AdminMerchantSubscriptionsByMerchant',
        component: () => import('../pages/admin/MerchantSubscriptionsPage.vue')
      },
      {
        path: 'merchants/:id/points',
        name: 'AdminMerchantPointsByMerchant',
        component: () => import('../pages/admin/MerchantPointsPage.vue')
      },
      {
        path: 'merchants/:id/payments',
        name: 'AdminMerchantPaymentsByMerchant',
        component: () => import('../pages/admin/MerchantPaymentsPage.vue')
      },
      {
        path: 'merchants/payments',
        name: 'AdminMerchantPayments',
        component: () => import('../pages/admin/MerchantPaymentsAdmin.vue')
      },
      {
        path: 'merchants',
        name: 'AdminMerchants',
        component: () => import('../pages/admin/Merchants.vue')
      },
      {
        path: 'providers',
        name: 'AdminProviders',
        component: () => import('../pages/admin/Providers.vue')
      },
      {
        path: 'providers/:id',
        name: 'AdminProviderDetail',
        component: () => import('../pages/admin/ProviderDetail.vue')
      },
      {
        path: 'routing-policies',
        name: 'AdminRoutingPolicies',
        component: () => import('../pages/admin/RoutingPolicies.vue')
      },
      {
        path: 'devices',
        name: 'AdminMerchantDevices',
        component: () => import('../pages/admin/MerchantDevicesAdmin.vue')
      },
      {
        path: 'system/users',
        name: 'AdminSystemUsers',
        component: () => import('../pages/admin/system/UserManagement.vue')
      },
      {
        path: 'system/roles',
        name: 'AdminSystemRoles',
        component: () => import('../pages/admin/system/RoleManagement.vue')
      },
      {
        path: 'system/menus',
        name: 'AdminSystemMenus',
        component: () => import('../pages/admin/system/MenuManagement.vue')
      },
      {
        path: 'system/pricing-rules',
        name: 'AdminSystemPricingRules',
        component: () => import('../pages/admin/system/PricingRules.vue')
      },
      {
        path: 'system/membership-plans',
        name: 'AdminSystemMembershipPlans',
        component: () => import('../pages/admin/system/MembershipPlans.vue')
      }
    ]
  },
  {
    path: '/',
    redirect: '/login'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/login')
  } else if (to.meta.roles && !to.meta.roles.includes(authStore.role)) {
    // 权限不足，重定向到对应角色的首页
    if (authStore.role === 'ADMIN') {
      next('/admin/dashboard')
    } else if (authStore.role?.startsWith('MERCHANT')) {
      next('/merchant/dashboard')
    } else {
      next('/login')
    }
  } else {
    next()
  }
})

export default router
