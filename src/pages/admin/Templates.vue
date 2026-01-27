<template>
  <div class="templates">
    <div class="header">
      <h1>Templates</h1>
      <button @click="showCreateModal = true">Create Template</button>
    </div>
    
    <div v-if="loading">Loading...</div>
    <div v-else class="list">
      <div v-for="template in templates" :key="template.id" class="template-card">
        <h3>{{ template.name }}</h3>
        <p>{{ template.description }}</p>
        <p>Code: {{ template.code }}</p>
        <p>Status: {{ template.status }}</p>
        <router-link :to="`/admin/templates/${template.id}`">Edit</router-link>
      </div>
    </div>

    <div v-if="showCreateModal" class="modal" @click.self="showCreateModal = false">
      <div class="modal-content">
        <h2>Create Template</h2>
        <form @submit.prevent="handleCreate">
          <div class="form-group">
            <label>Code</label>
            <input v-model="newTemplate.code" required />
          </div>
          <div class="form-group">
            <label>Name</label>
            <input v-model="newTemplate.name" required />
          </div>
          <div class="form-group">
            <label>Description</label>
            <textarea v-model="newTemplate.description"></textarea>
          </div>
          <div class="form-group">
            <label>Type</label>
            <select v-model="newTemplate.type">
              <option value="IMAGE">IMAGE</option>
              <option value="VIDEO">VIDEO</option>
            </select>
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
import { getTemplates, createTemplate } from '../../api/admin'

export default {
  name: 'Templates',
  setup() {
    const templates = ref([])
    const loading = ref(false)
    const showCreateModal = ref(false)
    const creating = ref(false)
    const newTemplate = ref({
      code: '',
      name: '',
      description: '',
      type: 'IMAGE',
      contentJson: '{}'
    })

    const loadTemplates = async () => {
      loading.value = true
      try {
        const response = await getTemplates()
        if (response.data.success) {
          templates.value = response.data.data
        }
      } catch (e) {
        console.error('Failed to load templates', e)
      } finally {
        loading.value = false
      }
    }

    const handleCreate = async () => {
      creating.value = true
      try {
        const response = await createTemplate(newTemplate.value)
        if (response.data.success) {
          showCreateModal.value = false
          newTemplate.value = { code: '', name: '', description: '', type: 'IMAGE', contentJson: '{}' }
          loadTemplates()
        }
      } catch (e) {
        alert('Error: ' + e.message)
      } finally {
        creating.value = false
      }
    }

    onMounted(() => {
      loadTemplates()
    })

    return {
      templates,
      loading,
      showCreateModal,
      creating,
      newTemplate,
      handleCreate
    }
  }
}
</script>

<style scoped>
.templates {
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

.template-card {
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
.form-group textarea,
.form-group select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
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
