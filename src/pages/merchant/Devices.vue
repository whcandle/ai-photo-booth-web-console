<template>
  <div class="devices">
    <div class="header">
      <h1>Devices</h1>
      <button @click="showCreateModal = true">Create Device</button>
    </div>
    
    <div v-if="loading" class="loading">Loading...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else class="list">
      <div v-for="device in devices" :key="device.id" class="device-card">
        <h3>{{ device.name || device.deviceCode }}</h3>
        <p>Code: {{ device.deviceCode }}</p>
        <p>Status: {{ device.status }}</p>
      </div>
    </div>

    <div v-if="showCreateModal" class="modal" @click.self="showCreateModal = false">
      <div class="modal-content">
        <h2>Create Device</h2>
        <form @submit.prevent="handleCreate">
          <div class="form-group">
            <label>Device Code</label>
            <input v-model="newDevice.deviceCode" required placeholder="e.g., DEVICE001" />
          </div>
          <div class="form-group">
            <label>Device Name</label>
            <input v-model="newDevice.name" required placeholder="e.g., Test Device" />
          </div>
          <div class="form-actions">
            <button type="submit" :disabled="creating">Create</button>
            <button type="button" @click="showCreateModal = false">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '../../store/auth'
import { getDevices, createDevice } from '../../api/merchant'

export default {
  name: 'Devices',
  setup() {
    const authStore = useAuthStore()
    const devices = ref([])
    const loading = ref(false)
    const error = ref('')
    const showCreateModal = ref(false)
    const creating = ref(false)
    const newDevice = ref({
      deviceCode: '',
      name: ''
    })

    const loadDevices = async () => {
      if (!authStore.merchantId) return
      
      loading.value = true
      error.value = ''
      try {
        const response = await getDevices(authStore.merchantId)
        if (response.data.success) {
          devices.value = response.data.data
        } else {
          error.value = response.data.message
        }
      } catch (e) {
        error.value = e.message
      } finally {
        loading.value = false
      }
    }

    const handleCreate = async () => {
      creating.value = true
      error.value = ''
      try {
        const response = await createDevice({
          merchantId: authStore.merchantId,
          deviceCode: newDevice.value.deviceCode,
          name: newDevice.value.name
        })
        if (response.data.success) {
          showCreateModal.value = false
          newDevice.value = { deviceCode: '', name: '' }
          loadDevices()
        } else {
          error.value = response.data.message
        }
      } catch (e) {
        error.value = e.message || 'Failed to create device'
      } finally {
        creating.value = false
      }
    }

    onMounted(() => {
      loadDevices()
    })

    return {
      devices,
      loading,
      error,
      showCreateModal,
      creating,
      newDevice,
      handleCreate
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

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.header button {
  padding: 0.75rem 1.5rem;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.header button:hover {
  background: #5568d3;
}

.loading, .error {
  padding: 1rem;
  text-align: center;
}

.error {
  color: #e74c3c;
  background: #fee;
  border: 1px solid #e74c3c;
  border-radius: 4px;
}

.device-card {
  padding: 1.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  margin-bottom: 1rem;
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
}

.modal-content h2 {
  margin-top: 0;
  margin-bottom: 1.5rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.form-group input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  box-sizing: border-box;
}

.form-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1.5rem;
}

.form-actions button {
  flex: 1;
  padding: 0.75rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
}

.form-actions button[type="submit"] {
  background: #667eea;
  color: white;
}

.form-actions button[type="submit"]:hover:not(:disabled) {
  background: #5568d3;
}

.form-actions button[type="submit"]:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.form-actions button[type="button"] {
  background: #e0e0e0;
  color: #333;
}

.form-actions button[type="button"]:hover {
  background: #d0d0d0;
}
</style>
