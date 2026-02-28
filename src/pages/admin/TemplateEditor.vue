<template>
  <div class="template-editor">
    <h1>Template Editor</h1>
    <div v-if="loading">Loading...</div>
    <div v-else>
      <!-- Version List Section -->
      <div class="versions-section">
        <h2>Template Versions</h2>
        <div v-if="versionsLoading" class="loading">Loading versions...</div>
        <div v-else-if="versions.length === 0" class="empty">No versions yet</div>
        <table v-else class="versions-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Version</th>
              <th>Package URL</th>
              <th>Checksum</th>
              <th>Status</th>
              <th>Created At</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="v in versions" :key="v.id">
              <td>{{ v.id }}</td>
              <td>{{ v.version }}</td>
              <td class="url-cell">{{ v.packageUrl }}</td>
              <td class="checksum-cell">{{ v.checksum || '-' }}</td>
              <td>
                <span :class="['status-badge', v.status.toLowerCase()]">{{ v.status }}</span>
              </td>
              <td>{{ formatDate(v.createdAt) }}</td>
              <td class="actions-cell">
                <button class="btn-edit" @click="openEditModal(v)">Edit</button>
                <button 
                  class="btn-activate" 
                  @click="handleActivate(v)"
                  :disabled="activating"
                  :title="v.status === 'ACTIVE' ? 'Re-activate this version (will set other versions to INACTIVE)' : 'Set this version as ACTIVE'"
                >
                  {{ v.status === 'ACTIVE' ? 'Re-activate' : 'Set Active' }}
                </button>
                <button 
                  class="btn-delete" 
                  @click="handleDelete(v)"
                  :disabled="v.status === 'ACTIVE'"
                  :title="v.status === 'ACTIVE' ? 'Cannot delete ACTIVE version. Please set another version as ACTIVE first.' : ''"
                >
                  Delete
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Add Version Section -->
      <div class="add-version-section">
        <h2>Add Version</h2>
        <form @submit.prevent="handleAddVersion">
          <div class="form-group">
            <label>Version</label>
            <input v-model="version.version" required />
          </div>
          <div class="form-group">
            <label>Package URL</label>
            <input v-model="version.packageUrl" required />
          </div>
          <div class="form-group">
            <label>Checksum</label>
            <input v-model="version.checksum" />
          </div>
          <div class="form-group">
            <label>Manifest JSON</label>
            <textarea v-model="version.manifestJson"></textarea>
          </div>
          <button type="submit" :disabled="adding">Add Version</button>
        </form>
      </div>
    </div>

    <!-- Edit Modal -->
    <div v-if="showEditModal" class="modal-overlay" @click="closeEditModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>Edit Version</h2>
          <button class="btn-close" @click="closeEditModal">&times;</button>
        </div>
        <form @submit.prevent="handleUpdateVersion">
          <div class="form-group">
            <label>Version <span class="readonly-hint">(read-only)</span></label>
            <input v-model="editingVersion.version" disabled />
          </div>
          <div class="form-group">
            <label>Package URL</label>
            <input v-model="editingVersion.packageUrl" required />
          </div>
          <div class="form-group">
            <label>Checksum</label>
            <input v-model="editingVersion.checksum" />
          </div>
          <div class="form-group">
            <label>Manifest JSON</label>
            <textarea v-model="editingVersion.manifestJson" class="json-textarea"></textarea>
            <div v-if="jsonError" class="error-message">{{ jsonError }}</div>
          </div>
          <div class="modal-actions">
            <button type="button" @click="closeEditModal" :disabled="updating">Cancel</button>
            <button type="submit" :disabled="updating">Save</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { 
  getTemplateVersions, 
  createTemplateVersion, 
  updateTemplateVersion, 
  deleteTemplateVersion, 
  activateTemplateVersion 
} from '../../api/admin'

export default {
  name: 'TemplateEditor',
  setup() {
    const route = useRoute()
    const templateId = parseInt(route.params.id)
    const loading = ref(false)
    const adding = ref(false)
    const updating = ref(false)
    const deleting = ref(false)
    const activating = ref(false)
    const versionsLoading = ref(false)
    const versions = ref([])
    const version = ref({
      version: '',
      packageUrl: '',
      checksum: '',
      manifestJson: '{}'
    })
    const showEditModal = ref(false)
    const editingVersion = ref({
      id: null,
      version: '',
      packageUrl: '',
      checksum: '',
      manifestJson: '{}'
    })
    const jsonError = ref('')

    const loadVersions = async () => {
      versionsLoading.value = true
      try {
        const response = await getTemplateVersions(templateId)
        if (response.data.success) {
          versions.value = response.data.data || []
        } else {
          console.error('Failed to load versions:', response.data.message)
        }
      } catch (e) {
        console.error('Error loading versions:', e)
      } finally {
        versionsLoading.value = false
      }
    }

    const handleAddVersion = async () => {
      adding.value = true
      try {
        const response = await createTemplateVersion(templateId, version.value)
        if (response.data.success) {
          alert('Version added successfully')
          version.value = { version: '', packageUrl: '', checksum: '', manifestJson: '{}' }
          // Refresh versions list after successful creation
          await loadVersions()
        } else {
          alert('Failed: ' + response.data.message)
        }
      } catch (e) {
        alert('Error: ' + e.message)
      } finally {
        adding.value = false
      }
    }

    const formatDate = (dateString) => {
      if (!dateString) return '-'
      const date = new Date(dateString)
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    }

    const openEditModal = (v) => {
      editingVersion.value = {
        id: v.id,
        version: v.version,
        packageUrl: v.packageUrl || '',
        checksum: v.checksum || '',
        manifestJson: v.manifestJson || '{}'
      }
      jsonError.value = ''
      showEditModal.value = true
    }

    const closeEditModal = () => {
      showEditModal.value = false
      editingVersion.value = {
        id: null,
        version: '',
        packageUrl: '',
        checksum: '',
        manifestJson: '{}'
      }
      jsonError.value = ''
    }

    const validateJson = (jsonString) => {
      if (!jsonString || jsonString.trim() === '') {
        return true // 空字符串视为有效
      }
      try {
        JSON.parse(jsonString)
        return true
      } catch (e) {
        return false
      }
    }

    const handleUpdateVersion = async () => {
      // 验证 JSON 格式
      if (editingVersion.value.manifestJson && !validateJson(editingVersion.value.manifestJson)) {
        jsonError.value = 'Invalid JSON format'
        return
      }
      jsonError.value = ''

      updating.value = true
      try {
        const response = await updateTemplateVersion(
          templateId, 
          editingVersion.value.id, 
          {
            packageUrl: editingVersion.value.packageUrl,
            checksum: editingVersion.value.checksum,
            manifestJson: editingVersion.value.manifestJson
          }
        )
        if (response.data.success) {
          alert('Version updated successfully')
          closeEditModal()
          await loadVersions()
        } else {
          alert('Failed: ' + response.data.message)
        }
      } catch (e) {
        alert('Error: ' + (e.response?.data?.message || e.message))
      } finally {
        updating.value = false
      }
    }

    const handleDelete = async (v) => {
      if (v.status === 'ACTIVE') {
        alert('Cannot delete ACTIVE version. Please set another version as ACTIVE first.')
        return
      }

      if (!confirm(`Are you sure you want to delete version ${v.version}?`)) {
        return
      }

      deleting.value = true
      try {
        const response = await deleteTemplateVersion(templateId, v.id)
        if (response.data.success || response.status === 200) {
          alert('Version deleted successfully')
          await loadVersions()
        } else {
          alert('Failed: ' + response.data.message)
        }
      } catch (e) {
        const errorMessage = e.response?.data?.message || e.message
        if (e.response?.status === 409 || errorMessage.includes('ACTIVE')) {
          alert('Cannot delete ACTIVE version. Please set another version as ACTIVE first.')
        } else {
          alert('Error: ' + errorMessage)
        }
      } finally {
        deleting.value = false
      }
    }

    const handleActivate = async (v) => {
      const confirmMessage = v.status === 'ACTIVE' 
        ? `Re-activate version ${v.version}? This will set all other versions to INACTIVE.`
        : `Set version ${v.version} as ACTIVE? This will set all other versions to INACTIVE.`
      
      if (!confirm(confirmMessage)) {
        return
      }

      activating.value = true
      try {
        const response = await activateTemplateVersion(templateId, v.id)
        if (response.data.success) {
          alert('Version activated successfully')
          await loadVersions()
        } else {
          alert('Failed: ' + response.data.message)
        }
      } catch (e) {
        alert('Error: ' + (e.response?.data?.message || e.message))
      } finally {
        activating.value = false
      }
    }

    onMounted(() => {
      loadVersions()
    })

    return {
      loading,
      adding,
      updating,
      deleting,
      activating,
      versionsLoading,
      versions,
      version,
      showEditModal,
      editingVersion,
      jsonError,
      handleAddVersion,
      formatDate,
      openEditModal,
      closeEditModal,
      handleUpdateVersion,
      handleDelete,
      handleActivate
    }
  }
}
</script>

<style scoped>
.template-editor {
  background: white;
  padding: 2rem;
  border-radius: 8px;
}

.versions-section {
  margin-bottom: 3rem;
}

.versions-section h2 {
  margin-bottom: 1rem;
}

.loading,
.empty {
  padding: 1rem;
  text-align: center;
  color: #666;
}

.versions-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 1rem;
}

.versions-table th,
.versions-table td {
  padding: 0.75rem;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.versions-table th {
  background-color: #f5f5f5;
  font-weight: 600;
}

.url-cell {
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.checksum-cell {
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: monospace;
  font-size: 0.9em;
}

.status-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.85em;
  font-weight: 500;
}

.status-badge.active {
  background-color: #d4edda;
  color: #155724;
}

.status-badge.inactive {
  background-color: #fff3cd;
  color: #856404;
}

.status-badge.rollback {
  background-color: #f8d7da;
  color: #721c24;
}

.add-version-section {
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid #eee;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1em;
}

.form-group textarea {
  min-height: 100px;
  font-family: monospace;
}

button {
  padding: 0.75rem 1.5rem;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1em;
  font-weight: 500;
}

button:hover:not(:disabled) {
  background: #5568d3;
}

button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.actions-cell {
  white-space: nowrap;
}

.actions-cell button {
  margin-right: 0.5rem;
  padding: 0.5rem 1rem;
  font-size: 0.9em;
}

.btn-edit {
  background: #667eea;
}

.btn-edit:hover:not(:disabled) {
  background: #5568d3;
}

.btn-activate {
  background: #28a745;
}

.btn-activate:hover:not(:disabled) {
  background: #218838;
}

.btn-delete {
  background: #dc3545;
}

.btn-delete:hover:not(:disabled) {
  background: #c82333;
}

.btn-delete:disabled {
  background: #ccc;
  opacity: 0.6;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 8px;
  padding: 0;
  max-width: 600px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #eee;
}

.modal-header h2 {
  margin: 0;
}

.btn-close {
  background: none;
  border: none;
  font-size: 2rem;
  cursor: pointer;
  color: #666;
  padding: 0;
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

.btn-close:hover {
  color: #000;
}

.modal-content form {
  padding: 1.5rem;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid #eee;
}

.modal-actions button {
  min-width: 100px;
}

.readonly-hint {
  color: #666;
  font-size: 0.85em;
  font-weight: normal;
}

.json-textarea {
  font-family: 'Courier New', monospace;
  font-size: 0.9em;
}

.error-message {
  color: #dc3545;
  font-size: 0.85em;
  margin-top: 0.25rem;
}
</style>
