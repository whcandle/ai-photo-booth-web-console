<template>
  <div class="templates">
    <div class="header">
      <h1>Templates</h1>
      <div class="header-actions">
        <label class="show-deleted-toggle">
          <input type="checkbox" v-model="showDeleted" @change="loadTemplates" />
          <span>Show deleted</span>
        </label>
        <button @click="showCreateModal = true">Create Template</button>
      </div>
    </div>
    
    <div v-if="loading">Loading...</div>
    <div v-else class="list">
      <div 
        v-for="template in templates" 
        :key="template.id" 
        :class="['template-card', { 'deleted': template.deletedAt }]"
      >
        <h3>{{ template.name }}</h3>
        <p>{{ template.description }}</p>
        <p>Code: {{ template.code }}</p>
        <p>Status: {{ template.status }}</p>
        <div v-if="template.deletedAt" class="deleted-badge">DELETED</div>
        <div class="card-actions">
          <router-link 
            v-if="!template.deletedAt" 
            :to="`/admin/templates/${template.id}`"
            class="btn-edit"
          >
            Edit
          </router-link>
          <button 
            v-if="template.deletedAt" 
            @click="handleRestore(template)"
            :disabled="restoring"
            class="btn-restore"
          >
            Restore
          </button>
          <button 
            v-if="!template.deletedAt" 
            @click="handleDelete(template)"
            :disabled="deleting"
            class="btn-delete"
          >
            Delete
          </button>
        </div>
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
          <div class="form-group">
            <label>Designer Type</label>
            <select v-model="newTemplate.designerType">
              <option value="GENERIC_V1">GENERIC_V1</option>
              <option value="ID_PHOTO_V1">ID_PHOTO_V1</option>
              <option value="STYLE_PORTRAIT_V1">STYLE_PORTRAIT_V1</option>
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
import { getTemplates, createTemplate, deleteTemplate, restoreTemplate } from '../../api/admin'

export default {
  name: 'Templates',
  setup() {
    const templates = ref([])
    const loading = ref(false)
    const showCreateModal = ref(false)
    const creating = ref(false)
    const deleting = ref(false)
    const restoring = ref(false)
    const showDeleted = ref(false)
    const newTemplate = ref({
      code: '',
      name: '',
      description: '',
      type: 'IMAGE',
      designerType: 'GENERIC_V1',
      contentJson: '{}'
    })

    const loadTemplates = async () => {
      loading.value = true
      try {
        const response = await getTemplates(showDeleted.value)
        if (response.data.success) {
          templates.value = response.data.data
        }
      } catch (e) {
        console.error('Failed to load templates', e)
      } finally {
        loading.value = false
      }
    }

    const handleDelete = async (template) => {
      if (!confirm(`Are you sure you want to delete template "${template.name}"?`)) {
        return
      }

      deleting.value = true
      try {
        const response = await deleteTemplate(template.id)
        if (response.data.success || response.status === 200) {
          // Show success message (you can use a toast library here)
          alert('Template deleted successfully')
          // Refresh list
          await loadTemplates()
        } else {
          alert('Failed: ' + response.data.message)
        }
      } catch (e) {
        const errorMessage = e.response?.data?.message || e.message
        alert('Error: ' + errorMessage)
      } finally {
        deleting.value = false
      }
    }

    const handleRestore = async (template) => {
      if (!confirm(`Restore template "${template.name}"?`)) {
        return
      }

      restoring.value = true
      try {
        const response = await restoreTemplate(template.id)
        if (response.data.success || response.status === 200) {
          alert('Template restored successfully')
          // Refresh list
          await loadTemplates()
        } else {
          alert('Failed: ' + response.data.message)
        }
      } catch (e) {
        const errorMessage = e.response?.data?.message || e.message
        alert('Error: ' + errorMessage)
      } finally {
        restoring.value = false
      }
    }

    const handleCreate = async () => {
      creating.value = true
      try {
        const response = await createTemplate(newTemplate.value)
        if (response.data.success) {
          showCreateModal.value = false
          newTemplate.value = { code: '', name: '', description: '', type: 'IMAGE', designerType: 'GENERIC_V1', contentJson: '{}' }
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
      deleting,
      restoring,
      showDeleted,
      newTemplate,
      loadTemplates,
      handleCreate,
      handleDelete,
      handleRestore
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

.header-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.show-deleted-toggle {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.show-deleted-toggle input[type="checkbox"] {
  cursor: pointer;
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
  position: relative;
}

.template-card.deleted {
  opacity: 0.6;
  background-color: #f5f5f5;
}

.deleted-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  background-color: #dc3545;
  color: white;
  border-radius: 12px;
  font-size: 0.85em;
  font-weight: 500;
  margin-top: 0.5rem;
}

.card-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
  align-items: center;
}

.btn-edit {
  padding: 0.5rem 1rem;
  background: #667eea;
  color: white;
  text-decoration: none;
  border-radius: 4px;
  font-size: 0.9em;
  display: inline-block;
}

.btn-edit:hover {
  background: #5568d3;
}

.btn-delete {
  padding: 0.5rem 1rem;
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9em;
}

.btn-delete:hover:not(:disabled) {
  background: #c82333;
}

.btn-delete:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.btn-restore {
  padding: 0.5rem 1rem;
  background: #28a745;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9em;
}

.btn-restore:hover:not(:disabled) {
  background: #218838;
}

.btn-restore:disabled {
  background: #ccc;
  cursor: not-allowed;
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
