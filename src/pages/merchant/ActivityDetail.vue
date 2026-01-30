<template>
  <div class="activity-detail">
    <h1>{{ activity?.name || 'Activity Detail' }}</h1>
    <div v-if="loading">Loading...</div>
    <div v-else>
      <div class="section">
        <h2>Bind Template Versions</h2>
        <div v-if="templateVersionsLoading">Loading template versions...</div>
        <div v-else-if="templateVersions.length === 0">No template versions available</div>
        <div v-else>
          <div v-for="tv in templateVersions" :key="tv.templateVersionId" class="template-version-item">
            <input 
              type="checkbox" 
              :value="tv.templateVersionId" 
              v-model="selectedTemplateVersions" 
            />
            <span class="version-label">
              <strong>{{ tv.templateName }}</strong> - v{{ tv.versionSemver }}
            </span>
            <span v-if="tv.coverUrl" class="cover-preview">
              <img :src="tv.coverUrl" alt="Cover" class="cover-image" />
            </span>
          </div>
          <button @click="handleBindTemplateVersions" :disabled="binding">
            Bind Selected Versions
          </button>
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
import { 
  bindTemplatesToActivity, 
  bindDevicesToActivity, 
  getDevices,
  getTemplateVersions,
  bindTemplateVersionsToActivity,
  getActivityTemplateVersions
} from '../../api/merchant'

export default {
  name: 'ActivityDetail',
  setup() {
    const route = useRoute()
    const authStore = useAuthStore()
    const activityId = parseInt(route.params.id)
    const activity = ref(null)
    const templateVersions = ref([])
    const devices = ref([])
    const selectedTemplateVersions = ref([])
    const selectedDevices = ref([])
    const loading = ref(false)
    const binding = ref(false)
    const templateVersionsLoading = ref(false)
    const boundVersionsLoading = ref(false)

    const loadTemplateVersions = async () => {
      templateVersionsLoading.value = true
      try {
        const response = await getTemplateVersions()
        if (response.data.success) {
          templateVersions.value = response.data.data || []
        } else {
          console.error('Failed to load template versions:', response.data.message)
        }
      } catch (e) {
        console.error('Error loading template versions', e)
      } finally {
        templateVersionsLoading.value = false
      }
    }

    // 加载当前活动已绑定的版本，用于回显勾选状态
    const loadBoundTemplateVersions = async () => {
      boundVersionsLoading.value = true
      try {
        const response = await getActivityTemplateVersions(activityId)
        if (response.data.success) {
          const ids = response.data.data || []
          // 去重并设置为当前选中
          selectedTemplateVersions.value = Array.from(new Set(ids))
        } else {
          console.error('Failed to load bound template versions:', response.data.message)
        }
      } catch (e) {
        console.error('Error loading bound template versions', e)
      } finally {
        boundVersionsLoading.value = false
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

    const handleBindTemplateVersions = async () => {
      if (selectedTemplateVersions.value.length === 0) {
        alert('Please select at least one template version')
        return
      }
      const uniqueIds = Array.from(new Set(selectedTemplateVersions.value))
      binding.value = true
      try {
        const response = await bindTemplateVersionsToActivity(activityId, uniqueIds)
        if (response.data.success) {
          alert('Template versions bound successfully')
          // 重新加载已绑定状态，保持 UI 与后端一致
          await loadBoundTemplateVersions()
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

    onMounted(async () => {
      await loadTemplateVersions()
      await loadBoundTemplateVersions()
      await loadDevices()
    })

    return {
      activity,
      templateVersions,
      templateVersionsLoading,
      boundVersionsLoading,
      devices,
      selectedTemplateVersions,
      selectedDevices,
      loading,
      binding,
      handleBindTemplateVersions,
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

.template-version-item,
.device-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
  padding: 0.5rem;
  border: 1px solid #eee;
  border-radius: 4px;
}

.template-version-item:hover {
  background-color: #f9f9f9;
}

.version-label {
  flex: 1;
}

.cover-preview {
  display: flex;
  align-items: center;
}

.cover-image {
  width: 40px;
  height: 40px;
  object-fit: cover;
  border-radius: 4px;
  border: 1px solid #ddd;
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
