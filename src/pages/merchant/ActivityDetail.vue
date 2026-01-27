<template>
  <div class="activity-detail">
    <h1>{{ activity?.name || 'Activity Detail' }}</h1>
    <div v-if="loading">Loading...</div>
    <div v-else>
      <div class="section">
        <h2>Bind Templates</h2>
        <div v-if="templates.length === 0">No templates available</div>
        <div v-else>
          <div v-for="template in templates" :key="template.id" class="template-item">
            <input type="checkbox" :value="template.id" v-model="selectedTemplates" />
            <span>{{ template.name }}</span>
          </div>
          <button @click="handleBindTemplates" :disabled="binding">Bind Selected</button>
        </div>
      </div>
      <div class="section">
        <h2>Bind Devices</h2>
        <div v-if="devices.length === 0">No devices available</div>
        <div v-else>
          <div v-for="device in devices" :key="device.id" class="device-item">
            <input type="checkbox" :value="device.id" v-model="selectedDevices" />
            <span>{{ device.name || device.deviceCode }}</span>
          </div>
          <button @click="handleBindDevices" :disabled="binding">Bind Selected</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '../../store/auth'
import { bindTemplatesToActivity, bindDevicesToActivity, getDevices } from '../../api/merchant'
import { getTemplates } from '../../api/admin'

export default {
  name: 'ActivityDetail',
  setup() {
    const route = useRoute()
    const authStore = useAuthStore()
    const activityId = parseInt(route.params.id)
    const activity = ref(null)
    const templates = ref([])
    const devices = ref([])
    const selectedTemplates = ref([])
    const selectedDevices = ref([])
    const loading = ref(false)
    const binding = ref(false)

    const loadTemplates = async () => {
      try {
        const response = await getTemplates()
        if (response.data.success) {
          templates.value = response.data.data
        }
      } catch (e) {
        console.error('Failed to load templates', e)
      }
    }

    const loadDevices = async () => {
      if (!authStore.merchantId) return
      try {
        const response = await getDevices(authStore.merchantId)
        if (response.data.success) {
          devices.value = response.data.data
        }
      } catch (e) {
        console.error('Failed to load devices', e)
      }
    }

    const handleBindTemplates = async () => {
      binding.value = true
      try {
        const response = await bindTemplatesToActivity(activityId, selectedTemplates.value)
        if (response.data.success) {
          alert('Templates bound successfully')
        } else {
          alert('Failed: ' + response.data.message)
        }
      } catch (e) {
        alert('Error: ' + e.message)
      } finally {
        binding.value = false
      }
    }

    const handleBindDevices = async () => {
      binding.value = true
      try {
        const response = await bindDevicesToActivity(activityId, selectedDevices.value)
        if (response.data.success) {
          alert('Devices bound successfully')
        } else {
          alert('Failed: ' + response.data.message)
        }
      } catch (e) {
        alert('Error: ' + e.message)
      } finally {
        binding.value = false
      }
    }

    onMounted(() => {
      loadTemplates()
      loadDevices()
    })

    return {
      activity,
      templates,
      devices,
      selectedTemplates,
      selectedDevices,
      loading,
      binding,
      handleBindTemplates,
      handleBindDevices
    }
  }
}
</script>

<style scoped>
.activity-detail {
  background: white;
  padding: 2rem;
  border-radius: 8px;
}

.section {
  margin-top: 2rem;
  padding: 1.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.template-item,
.device-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

button {
  margin-top: 1rem;
  padding: 0.75rem 1.5rem;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:disabled {
  background: #ccc;
  cursor: not-allowed;
}
</style>
