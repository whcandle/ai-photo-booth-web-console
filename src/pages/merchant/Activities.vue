<template>
  <div class="activities">
    <div class="header">
      <h1>Activities</h1>
      <button @click="showCreateModal = true">Create Activity</button>
    </div>
    
    <div v-if="loading" class="loading">Loading...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else class="list">
      <div v-for="activity in activities" :key="activity.id" class="activity-card">
        <h3>{{ activity.name }}</h3>
        <p>{{ activity.description }}</p>
        <p>Status: {{ activity.status }}</p>
        <router-link :to="`/merchant/activities/${activity.id}`">View Details</router-link>
      </div>
    </div>

    <div v-if="showCreateModal" class="modal" @click.self="showCreateModal = false">
      <div class="modal-content">
        <h2>Create Activity</h2>
        <form @submit.prevent="handleCreate">
          <div class="form-group">
            <label>Name <span class="required">*</span></label>
            <input v-model="newActivity.name" required />
          </div>
          <div class="form-group">
            <label>Description</label>
            <textarea v-model="newActivity.description"></textarea>
          </div>
          <div class="form-group">
            <label>Start Time</label>
            <input 
              type="datetime-local" 
              v-model="newActivity.startAt" 
            />
            <small class="form-hint">Optional: Leave empty if no start time needed</small>
          </div>
          <div class="form-group">
            <label>End Time</label>
            <input 
              type="datetime-local" 
              v-model="newActivity.endAt" 
            />
            <small class="form-hint">Optional: Leave empty if no end time needed</small>
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
import { getActivities, createActivity } from '../../api/merchant'

export default {
  name: 'Activities',
  setup() {
    const authStore = useAuthStore()
    const activities = ref([])
    const loading = ref(false)
    const error = ref('')
    const showCreateModal = ref(false)
    const creating = ref(false)
    const newActivity = ref({
      name: '',
      description: '',
      startAt: '',
      endAt: ''
    })

    const loadActivities = async () => {
      if (!authStore.merchantId) return
      
      loading.value = true
      error.value = ''
      try {
        const response = await getActivities(authStore.merchantId)
        if (response.data.success) {
          activities.value = response.data.data
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
      try {
        // 将 datetime-local 格式转换为 ISO 字符串，如果为空则传 null
        const startAt = newActivity.value.startAt 
          ? new Date(newActivity.value.startAt).toISOString() 
          : null
        const endAt = newActivity.value.endAt 
          ? new Date(newActivity.value.endAt).toISOString() 
          : null

        const response = await createActivity({
          merchantId: authStore.merchantId,
          name: newActivity.value.name,
          description: newActivity.value.description,
          startAt: startAt,
          endAt: endAt
        })
        if (response.data.success) {
          showCreateModal.value = false
          newActivity.value = { name: '', description: '', startAt: '', endAt: '' }
          loadActivities()
        } else {
          error.value = response.data.message
        }
      } catch (e) {
        error.value = e.message
      } finally {
        creating.value = false
      }
    }

    onMounted(() => {
      loadActivities()
    })

    return {
      activities,
      loading,
      error,
      showCreateModal,
      creating,
      newActivity,
      handleCreate
    }
  }
}
</script>

<style scoped>
.activities {
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

.activity-card {
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
}

.modal-content {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  box-sizing: border-box;
}

.form-group input[type="datetime-local"] {
  font-family: inherit;
}

.required {
  color: #e74c3c;
}

.form-hint {
  display: block;
  margin-top: 0.25rem;
  font-size: 0.85rem;
  color: #666;
  font-style: italic;
}

.form-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}

.form-actions button {
  flex: 1;
  padding: 0.75rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
</style>
