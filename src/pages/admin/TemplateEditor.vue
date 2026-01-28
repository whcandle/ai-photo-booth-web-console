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
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { getTemplateVersions, createTemplateVersion } from '../../api/admin'

export default {
  name: 'TemplateEditor',
  setup() {
    const route = useRoute()
    const templateId = parseInt(route.params.id)
    const loading = ref(false)
    const adding = ref(false)
    const versionsLoading = ref(false)
    const versions = ref([])
    const version = ref({
      version: '',
      packageUrl: '',
      checksum: '',
      manifestJson: '{}'
    })

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

    onMounted(() => {
      loadVersions()
    })

    return {
      loading,
      adding,
      versionsLoading,
      versions,
      version,
      handleAddVersion,
      formatDate
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
</style>
