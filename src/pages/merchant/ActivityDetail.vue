<template>
  <div class="activity-detail">
    <div v-if="loading" class="loading">Loading activity...</div>
    <div v-else-if="activity">
      <div class="activity-header">
        <h1>{{ activity.name }}</h1>
        <div class="activity-info">
          <div class="info-item">
            <span class="info-label">活动编号:</span>
            <span class="info-value">#{{ activity.id }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">状态:</span>
            <span class="info-value status-badge" :class="'status-' + activity.status.toLowerCase()">
              {{ activity.status }}
            </span>
          </div>
          <div v-if="activity.description" class="info-item">
            <span class="info-label">描述:</span>
            <span class="info-value">{{ activity.description }}</span>
          </div>
          <div v-if="activity.startAt" class="info-item">
            <span class="info-label">开始时间:</span>
            <span class="info-value">{{ formatDateTime(activity.startAt) }}</span>
          </div>
          <div v-if="activity.endAt" class="info-item">
            <span class="info-label">结束时间:</span>
            <span class="info-value">{{ formatDateTime(activity.endAt) }}</span>
          </div>
        </div>
      </div>
    </div>
    <div v-else class="error">Activity not found</div>
    <div v-if="!loading && activity">
      <div class="section">
        <h2>Bind Template Versions</h2>
        <div v-if="boundVersionsLoading" class="loading-hint">Loading bound versions...</div>
        <div v-if="templateVersionsLoading">Loading template versions...</div>
        <div v-else-if="templateVersions.length === 0">No template versions available</div>
        <div v-else>
          <div class="selection-info">
            <span>Selected: {{ selectedTemplateVersions.length }} / {{ templateVersions.length }}</span>
          </div>
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
          <div class="bind-actions">
            <button @click="handleBindTemplateVersions" :disabled="binding || boundVersionsLoading">
              {{ binding ? 'Binding...' : 'Bind Selected Versions' }}
            </button>
            <button 
              v-if="selectedTemplateVersions.length > 0" 
              @click="selectedTemplateVersions = []" 
              :disabled="binding || boundVersionsLoading"
              class="btn-secondary"
            >
              Clear Selection
            </button>
          </div>
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
  getActivityTemplateVersions,
  getActivityDevices,
  getActivity
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
    const boundDevicesLoading = ref(false)

    const loadActivity = async () => {
      loading.value = true
      try {
        const response = await getActivity(activityId)
        if (response.data.success) {
          activity.value = response.data.data
        } else {
          console.error('Failed to load activity:', response.data.message)
        }
      } catch (e) {
        console.error('Error loading activity', e)
      } finally {
        loading.value = false
      }
    }

    const formatDateTime = (dateTime) => {
      if (!dateTime) return ''
      const date = new Date(dateTime)
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    }

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
    // 调用 GET /api/v1/merchant/activities/{id}/template-versions 获取详细信息列表
    const loadBoundTemplateVersions = async () => {
      boundVersionsLoading.value = true
      try {
        const response = await getActivityTemplateVersions(activityId)
        if (response.data.success) {
          const boundVersions = response.data.data || []
          // 从详细信息列表中提取 templateVersionId，并设置为当前选中
          const ids = boundVersions.map(item => item.templateVersionId).filter(id => id != null)
          selectedTemplateVersions.value = Array.from(new Set(ids))
        } else {
          console.error('Failed to load bound template versions:', response.data.message)
          selectedTemplateVersions.value = []
        }
      } catch (e) {
        console.error('Error loading bound template versions', e)
        selectedTemplateVersions.value = []
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

    // 加载当前活动已绑定的设备，用于回显勾选状态
    const loadBoundDevices = async () => {
      boundDevicesLoading.value = true
      try {
        const response = await getActivityDevices(activityId)
        if (response.data.success) {
          const ids = response.data.data || []
          // 去重并设置为当前选中
          selectedDevices.value = Array.from(new Set(ids))
        } else {
          console.error('Failed to load bound devices:', response.data.message)
        }
      } catch (e) {
        console.error('Error loading bound devices', e)
      } finally {
        boundDevicesLoading.value = false
      }
    }

    const handleBindTemplateVersions = async () => {
      // 全量覆盖语义：提交当前勾选的全量 templateVersionIds（包括空数组）
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
      if (selectedDevices.value.length === 0) {
        alert('Please select at least one device')
        return
      }
      const uniqueIds = Array.from(new Set(selectedDevices.value))
      binding.value = true
      try {
        const response = await bindDevicesToActivity(activityId, uniqueIds)
        if (response.data.success) {
          alert('Devices bound successfully')
          // 重新加载已绑定状态，保持 UI 与后端一致
          await loadBoundDevices()
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
      await loadActivity()
      await loadTemplateVersions()
      await loadBoundTemplateVersions()
      await loadDevices()
      await loadBoundDevices()
    })

    return {
      activity,
      templateVersions,
      templateVersionsLoading,
      boundVersionsLoading,
      boundDevicesLoading,
      devices,
      selectedTemplateVersions,
      selectedDevices,
      loading,
      binding,
      formatDateTime,
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

.loading, .error {
  padding: 2rem;
  text-align: center;
  color: #666;
}

.error {
  color: #e74c3c;
}

.activity-header {
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 2px solid #eee;
}

.activity-header h1 {
  margin: 0 0 1rem 0;
  font-size: 1.75rem;
  color: #333;
}

.activity-info {
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.info-label {
  font-weight: 500;
  color: #666;
  font-size: 0.9rem;
}

.info-value {
  color: #333;
  font-size: 0.95rem;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 500;
}

.status-badge.status-active {
  background: #d4edda;
  color: #155724;
}

.status-badge.status-inactive {
  background: #f8d7da;
  color: #721c24;
}

.status-badge.status-draft {
  background: #fff3cd;
  color: #856404;
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

.selection-info {
  margin-bottom: 1rem;
  padding: 0.5rem;
  background: #f5f5f5;
  border-radius: 4px;
  font-size: 0.9rem;
  color: #666;
}

.bind-actions {
  margin-top: 1rem;
  display: flex;
  gap: 0.75rem;
}

button {
  padding: 0.75rem 1.5rem;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.95rem;
}

button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.btn-secondary {
  background: #6c757d;
}

.btn-secondary:hover:not(:disabled) {
  background: #5a6268;
}

.loading-hint {
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
  color: #666;
  font-style: italic;
}
</style>
