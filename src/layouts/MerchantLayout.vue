<template>
  <div class="layout">
    <aside class="sidebar">
      <div class="logo">AI Photo Booth</div>
      <nav>
        <router-link to="/merchant/dashboard">Dashboard</router-link>
        <router-link to="/merchant/activities">Activities</router-link>
        <router-link to="/merchant/devices">Devices</router-link>
      </nav>
      <div class="user-info">
        <span>{{ displayName }}</span>
        <button @click="handleLogout">Logout</button>
      </div>
    </aside>
    <main class="content">
      <router-view />
    </main>
  </div>
</template>

<script>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../store/auth'

export default {
  name: 'MerchantLayout',
  setup() {
    const router = useRouter()
    const authStore = useAuthStore()
    
    const displayName = computed(() => authStore.displayName || 'Merchant')
    
    const handleLogout = () => {
      authStore.logout()
      router.push('/login')
    }
    
    return {
      displayName,
      handleLogout
    }
  }
}
</script>

<style scoped>
.layout {
  display: flex;
  min-height: 100vh;
}

.sidebar {
  width: 250px;
  background: #2c3e50;
  color: white;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
}

.logo {
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 2rem;
}

nav {
  flex: 1;
}

nav a {
  display: block;
  padding: 0.75rem 1rem;
  color: white;
  text-decoration: none;
  border-radius: 4px;
  margin-bottom: 0.5rem;
}

nav a:hover,
nav a.router-link-active {
  background: #34495e;
}

.user-info {
  margin-top: auto;
  padding-top: 1rem;
  border-top: 1px solid #34495e;
}

.user-info button {
  margin-top: 0.5rem;
  width: 100%;
  padding: 0.5rem;
  background: #e74c3c;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.content {
  flex: 1;
  padding: 2rem;
  background: #f5f5f5;
}
</style>
