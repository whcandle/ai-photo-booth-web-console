<template>
  <div class="devices">
    <h1>Devices</h1>
    <div v-if="loading">Loading...</div>
    <div v-else>
      <div v-for="device in devices" :key="device.id" class="device-card">
        <h3>{{ device.name || device.deviceCode }}</h3>
        <p>Code: {{ device.deviceCode }}</p>
        <p>Status: {{ device.status }}</p>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '../../store/auth'
import { getDevices } from '../../api/merchant'

export default {
  name: 'Devices',
  setup() {
    const authStore = useAuthStore()
    const devices = ref([])
    const loading = ref(false)

    const loadDevices = async () => {
      if (!authStore.merchantId) return
      loading.value = true
      try {
        const response = await getDevices(authStore.merchantId)
        if (response.data.success) {
          devices.value = response.data.data
        }
      } catch (e) {
        console.error('Failed to load devices', e)
      } finally {
        loading.value = false
      }
    }

    onMounted(() => {
      loadDevices()
    })

    return {
      devices,
      loading
    }
  }
}
</script>

<style scoped>
.devices {
  background: white;
  padding: 2rem;
  border-radius: 8px;
}

.device-card {
  padding: 1.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  margin-bottom: 1rem;
}
</style>
