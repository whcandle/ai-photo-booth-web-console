<template>
  <div class="template-editor">
    <h1>Template Editor</h1>
    <div v-if="loading">Loading...</div>
    <div v-else>
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
</template>

<script>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { createTemplateVersion } from '../../api/admin'

export default {
  name: 'TemplateEditor',
  setup() {
    const route = useRoute()
    const templateId = parseInt(route.params.id)
    const loading = ref(false)
    const adding = ref(false)
    const version = ref({
      version: '',
      packageUrl: '',
      checksum: '',
      manifestJson: '{}'
    })

    const handleAddVersion = async () => {
      adding.value = true
      try {
        const response = await createTemplateVersion(templateId, version.value)
        if (response.data.success) {
          alert('Version added successfully')
          version.value = { version: '', packageUrl: '', checksum: '', manifestJson: '{}' }
        } else {
          alert('Failed: ' + response.data.message)
        }
      } catch (e) {
        alert('Error: ' + e.message)
      } finally {
        adding.value = false
      }
    }

    return {
      loading,
      adding,
      version,
      handleAddVersion
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
}

button {
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
