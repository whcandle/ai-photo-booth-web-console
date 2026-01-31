<template>
  <div class="activities">
    <div class="header">
      <h1>Activities</h1>
      <button @click="showCreateModal = true">Create Activity</button>
    </div>
    
    <!-- 搜索和过滤栏 -->
    <div class="filters">
      <div class="filter-group">
        <label for="search">Search</label>
        <input
          id="search"
          type="text"
          v-model="searchQuery"
          @input="handleSearchInput"
          placeholder="Search by name or description..."
        />
      </div>
      <div class="filter-group">
        <label for="status">Status</label>
        <select id="status" v-model="statusFilter" @change="handleStatusChange">
          <option value="ALL">ALL</option>
          <option value="ACTIVE">ACTIVE</option>
          <option value="INACTIVE">INACTIVE</option>
        </select>
      </div>
    </div>
    
    <div v-if="loading" class="loading">Loading...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else class="list">
      <div v-if="activities.length === 0" class="empty">No activities found</div>
      <div v-for="activity in activities" :key="activity.id" class="activity-card">
        <h3>{{ activity.name }}</h3>
        <p>{{ activity.description }}</p>
        <p>Status: {{ activity.status }}</p>
        <router-link :to="`/merchant/activities/${activity.id}`">View Details</router-link>
      </div>
    </div>

    <!-- 分页控件 -->
    <div v-if="!loading && !error && pagination.totalPages > 0" class="pagination">
      <button 
        @click="goToPage(pagination.page - 1)" 
        :disabled="pagination.page === 0"
        class="pagination-btn"
      >
        Previous
      </button>
      <span class="pagination-info">
        Page {{ pagination.page + 1 }} of {{ pagination.totalPages }} 
        (Total: {{ pagination.totalElements }})
      </span>
      <button 
        @click="goToPage(pagination.page + 1)" 
        :disabled="pagination.page >= pagination.totalPages - 1"
        class="pagination-btn"
      >
        Next
      </button>
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

    // 搜索和过滤状态
    const searchQuery = ref('')
    const statusFilter = ref('ALL')
    const pagination = ref({
      page: 0,
      size: 20,
      totalElements: 0,
      totalPages: 0
    })

    // Debounce 定时器
    let searchDebounceTimer = null

    const loadActivities = async () => {
      if (!authStore.merchantId) return
      
      loading.value = true
      error.value = ''
      try {
        const params = {
          page: pagination.value.page,
          size: pagination.value.size,
          status: statusFilter.value
        }
        if (searchQuery.value.trim()) {
          params.q = searchQuery.value.trim()
        }
        
        const response = await getActivities(authStore.merchantId, params)
        if (response.data.success) {
          const data = response.data.data
          activities.value = data.items || []
          pagination.value = {
            page: data.page || 0,
            size: data.size || 20,
            totalElements: data.totalElements || 0,
            totalPages: data.totalPages || 0
          }
        } else {
          error.value = response.data.message
        }
      } catch (e) {
        error.value = e.message
      } finally {
        loading.value = false
      }
    }

    // 搜索输入处理（带 debounce）
    const handleSearchInput = () => {
      if (searchDebounceTimer) {
        clearTimeout(searchDebounceTimer)
      }
      searchDebounceTimer = setTimeout(() => {
        pagination.value.page = 0 // 重置到第一页
        loadActivities()
      }, 300)
    }

    // 状态过滤改变处理
    const handleStatusChange = () => {
      pagination.value.page = 0 // 重置到第一页
      loadActivities()
    }

    // 分页跳转
    const goToPage = (page) => {
      if (page >= 0 && page < pagination.value.totalPages) {
        pagination.value.page = page
        loadActivities()
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
          // 创建后重置到第一页并刷新
          pagination.value.page = 0
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
      searchQuery,
      statusFilter,
      pagination,
      handleCreate,
      handleSearchInput,
      handleStatusChange,
      goToPage
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

.filters {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: #f5f5f5;
  border-radius: 4px;
}

.filter-group {
  flex: 1;
  max-width: 300px;
}

.filter-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.filter-group input,
.filter-group select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  box-sizing: border-box;
}

.empty {
  text-align: center;
  padding: 2rem;
  color: #666;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-top: 2rem;
  padding: 1rem;
}

.pagination-btn {
  padding: 0.5rem 1rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  cursor: pointer;
}

.pagination-btn:hover:not(:disabled) {
  background: #f5f5f5;
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination-info {
  font-size: 0.9rem;
  color: #666;
}
</style>
