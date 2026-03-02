<template>
  <div class="designer">
    <div class="header">
      <h1>Template Designer</h1>
    </div>
    
    <div v-if="loading" class="loading">Loading...</div>
    <div v-else class="designer-container">
      <!-- 左侧：Templates 列表 -->
      <div class="templates-panel">
        <h2>Templates</h2>
        <div class="templates-list">
          <div
            v-for="template in templates"
            :key="template.id"
            :class="['template-item', { 'active': selectedTemplateId === template.id }]"
            @click="selectTemplate(template)"
          >
            <div class="template-code">{{ template.code }}</div>
            <div class="template-name">{{ template.name }}</div>
            <div class="template-designer-type">{{ template.designerType }}</div>
          </div>
        </div>
      </div>

      <!-- 右侧：Versions 列表 -->
      <div class="versions-panel">
        <h2 v-if="selectedTemplate">Versions - {{ selectedTemplate.name }}</h2>
        <h2 v-else>Select a template to view versions</h2>
        
        <div v-if="versionsLoading" class="loading">Loading versions...</div>
        <div v-else-if="!selectedTemplate" class="empty-state">
          Please select a template from the left panel
        </div>
        <div v-else-if="versions.length === 0" class="empty-state">
          No versions found for this template
        </div>
        <div v-else class="versions-list">
          <div
            v-for="version in versions"
            :key="version.id"
            class="version-item"
            @click="openVersion(version)"
          >
            <div class="version-info">
              <div class="version-version">{{ version.version }}</div>
              <div class="version-status" :class="version.status.toLowerCase()">
                {{ version.status }}
              </div>
            </div>
            <div class="version-actions">
              <button class="btn-open" @click.stop="openVersion(version)">
                Open
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getTemplates, getTemplateVersions } from '../../api/admin'

export default {
  name: 'Designer',
  setup() {
    const router = useRouter()
    const templates = ref([])
    const versions = ref([])
    const loading = ref(false)
    const versionsLoading = ref(false)
    const selectedTemplateId = ref(null)
    const selectedTemplate = ref(null)

    const loadTemplates = async () => {
      loading.value = true
      try {
        const response = await getTemplates(false)
        if (response.data.success) {
          templates.value = response.data.data || []
        }
      } catch (e) {
        console.error('Failed to load templates', e)
      } finally {
        loading.value = false
      }
    }

    const selectTemplate = async (template) => {
      selectedTemplateId.value = template.id
      selectedTemplate.value = template
      await loadVersions(template.id)
    }

    const loadVersions = async (templateId) => {
      versionsLoading.value = true
      try {
        const response = await getTemplateVersions(templateId)
        if (response.data.success) {
          versions.value = response.data.data || []
        }
      } catch (e) {
        console.error('Failed to load versions', e)
        versions.value = []
      } finally {
        versionsLoading.value = false
      }
    }

    const openVersion = (version) => {
      if (!selectedTemplate.value) return
      const designerType = selectedTemplate.value.designerType || 'GENERIC_V1'
      router.push(`/admin/designer/${designerType}/${selectedTemplate.value.id}/${version.id}`)
    }

    onMounted(() => {
      loadTemplates()
    })

    return {
      templates,
      versions,
      loading,
      versionsLoading,
      selectedTemplateId,
      selectedTemplate,
      selectTemplate,
      openVersion
    }
  }
}
</script>

<style scoped>
.designer {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  height: calc(100vh - 140px);
  display: flex;
  flex-direction: column;
}

.header {
  margin-bottom: 1.5rem;
}

.header h1 {
  margin: 0;
  font-size: 1.5rem;
  color: #303133;
}

.designer-container {
  display: flex;
  gap: 2rem;
  flex: 1;
  overflow: hidden;
}

.templates-panel {
  width: 300px;
  border-right: 1px solid #e4e7ed;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.templates-panel h2 {
  margin: 0 0 1rem 0;
  font-size: 1.1rem;
  color: #606266;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #e4e7ed;
}

.templates-list {
  flex: 1;
  overflow-y: auto;
}

.template-item {
  padding: 1rem;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background-color 0.2s;
}

.template-item:hover {
  background-color: #f5f7fa;
}

.template-item.active {
  background-color: #ecf5ff;
  border-left: 3px solid #409eff;
}

.template-code {
  font-weight: 600;
  color: #303133;
  margin-bottom: 0.25rem;
}

.template-name {
  color: #606266;
  font-size: 0.9rem;
  margin-bottom: 0.25rem;
}

.template-designer-type {
  color: #909399;
  font-size: 0.85rem;
  text-transform: uppercase;
}

.versions-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.versions-panel h2 {
  margin: 0 0 1rem 0;
  font-size: 1.1rem;
  color: #606266;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #e4e7ed;
}

.versions-list {
  flex: 1;
  overflow-y: auto;
}

.version-item {
  padding: 1rem;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  margin-bottom: 0.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  transition: all 0.2s;
}

.version-item:hover {
  border-color: #409eff;
  box-shadow: 0 2px 4px rgba(64, 158, 255, 0.1);
}

.version-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.version-version {
  font-weight: 600;
  color: #303133;
}

.version-status {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 500;
}

.version-status.active {
  background-color: #d4edda;
  color: #155724;
}

.version-status.inactive {
  background-color: #fff3cd;
  color: #856404;
}

.version-status.rollback {
  background-color: #f8d7da;
  color: #721c24;
}

.btn-open {
  padding: 0.5rem 1rem;
  background: #409eff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
}

.btn-open:hover {
  background: #66b1ff;
}

.empty-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #909399;
  font-size: 0.9rem;
}

.loading {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #909399;
}
</style>
