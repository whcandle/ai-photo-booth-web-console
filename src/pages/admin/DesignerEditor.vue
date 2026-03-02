<template>
  <div class="designer-editor">
    <div class="header">
      <div class="breadcrumb">
        <router-link to="/admin/designer">Designer</router-link>
        <span class="separator">/</span>
        <span>{{ designerType }}</span>
        <span class="separator">/</span>
        <span>{{ templateCode }}</span>
        <span class="separator">/</span>
        <span>{{ version }}</span>
      </div>
      <div class="header-main">
        <h1>Template Designer Editor</h1>
        <div class="header-actions">
          <button class="btn" @click="handleSave" :disabled="saving || !draftId">Save</button>
          <button class="btn" @click="handlePreview" :disabled="previewing || !draftId">Preview</button>
          <button class="btn primary" @click="handlePublish" :disabled="publishing || !draftId">Publish</button>
        </div>
      </div>
    </div>

    <div v-if="loading" class="loading">Loading...</div>
    <div v-else class="editor-content">
      <div class="info-panel">
        <h3>Template Information</h3>
        <div class="info-item">
          <label>Template Code:</label>
          <span>{{ templateCode }}</span>
        </div>
        <div class="info-item">
          <label>Designer Type:</label>
          <span>{{ designerType }}</span>
        </div>
        <div class="info-item">
          <label>Version:</label>
          <span>{{ version }}</span>
        </div>
        <div class="info-item">
          <label>Status:</label>
          <span :class="['status-badge', versionStatus?.toLowerCase()]">{{ versionStatus }}</span>
        </div>
        <div class="info-item" v-if="draftId">
          <label>Draft ID:</label>
          <span>{{ draftId }}</span>
        </div>

        <!-- ID_PHOTO_V1: segmentation 设置 -->
        <template v-if="designerType === 'ID_PHOTO_V1'">
          <h3 class="section-title">Segmentation Settings</h3>
          <div class="info-item">
            <label>
              <input type="checkbox" v-model="formState.segmentation.enabled" />
              Enable Segmentation
            </label>
          </div>
          <div class="info-item">
            <label>Prefer Providers (comma separated)</label>
            <input
              type="text"
              v-model="segmentationPreferInput"
              placeholder="removebg, rembg"
            />
          </div>
          <div class="info-item">
            <label>Timeout (ms)</label>
            <input
              type="number"
              min="1000"
              step="500"
              v-model.number="formState.segmentation.timeoutMs"
            />
          </div>
          <div class="info-item">
            <label>Feather (px)</label>
            <input
              type="number"
              min="0"
              max="40"
              v-model.number="formState.segmentation.featherPx"
            />
          </div>
        </template>

        <!-- STYLE_PORTRAIT_V1: AI Variants 设置 -->
        <template v-if="designerType === 'STYLE_PORTRAIT_V1'">
          <h3 class="section-title">AI Variants</h3>
          <div class="variants-list">
            <div
              v-for="(variant, index) in formState.ai.variants"
              :key="index"
              class="variant-item"
            >
              <div class="variant-header">
                <strong>#{{ index + 1 }}</strong>
                <div class="variant-actions">
                  <button class="btn small" @click="moveVariantUp(index)" :disabled="index === 0">↑</button>
                  <button class="btn small" @click="moveVariantDown(index)" :disabled="index === formState.ai.variants.length - 1">↓</button>
                  <button class="btn small" @click="removeVariant(index)">✕</button>
                </div>
              </div>
              <div class="info-item">
                <label>Name</label>
                <input type="text" v-model="variant.name" />
              </div>
              <div class="info-item">
                <label>Prompt</label>
                <textarea v-model="variant.prompt" rows="2" />
              </div>
              <div class="info-item">
                <label>Style Image</label>
                <input
                  type="text"
                  v-model="variant.styleImage"
                  placeholder="assets/styles/style1.png"
                />
                <input
                  type="file"
                  accept="image/*"
                  @change="(e) => handleStyleImageUpload(index, e)"
                />
              </div>
              <div class="info-item">
                <label>Size</label>
                <input
                  type="text"
                  v-model="variant.parameters.size"
                  placeholder="1024x1024"
                />
              </div>
              <div class="info-item">
                <label>Watermark</label>
                <input
                  type="text"
                  v-model="variant.parameters.watermark"
                  placeholder="none"
                />
              </div>
              <div class="info-item">
                <label>
                  <input
                    type="checkbox"
                    v-model="variant.parameters.enable_interleave"
                  />
                  Enable Interleave
                </label>
              </div>
              <div class="info-item">
                <label>n (images per variant)</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  v-model.number="variant.parameters.n"
                />
              </div>
            </div>
          </div>
          <button class="btn small" @click="addVariant">Add Variant</button>
        </template>
      </div>

      <div class="editor-panel">
        <h3>Canvas</h3>
        <div class="canvas-toolbar">
          <button class="btn small" @click="addRect">Add Rect</button>
          <button class="btn small" @click="resetCanvas">Reset</button>
        </div>
        <div class="canvas-wrapper" ref="canvasWrapRef">
          <canvas ref="canvasEl"></canvas>
        </div>
      </div>
    </div>
  </div>

  <!-- Preview Modal -->
  <div v-if="previewModalVisible" class="modal" @click.self="previewModalVisible = false">
    <div class="modal-content">
      <div class="modal-header">
        <h3>Preview</h3>
        <button class="btn small" @click="previewModalVisible = false">Close</button>
      </div>
      <div class="modal-body" v-if="previewLoading">
        Loading preview...
      </div>
      <div class="modal-body" v-else>
        <div v-if="previewUrl">
          <img :src="previewUrl" alt="Preview" class="preview-image" />
        </div>
        <div v-else>
          No preview available.
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn" @click="reloadPreview" :disabled="previewLoading">Refresh</button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Canvas, Rect } from 'fabric'
import { 
  getTemplate, 
  getTemplateVersions, 
  createDraft, 
  updateDraft, 
  previewDraft, 
  publishDraft,
  uploadDraftAsset
} from '../../api/admin'

export default {
  name: 'DesignerEditor',
  setup() {
    const route = useRoute()
    const router = useRouter()
    const designerType = ref(route.params.designerType)
    const templateId = ref(parseInt(route.params.templateId))
    const versionId = ref(parseInt(route.params.versionId))
    
    const loading = ref(false)
    const saving = ref(false)
    const previewing = ref(false)
    const publishing = ref(false)

    const templateCode = ref('')
    const version = ref('')
    const versionStatus = ref('')

    const draftId = ref(null)
    const schemaVersion = ref('1.0.0')
    // formState 结构（根据 designerType 使用不同部分）：
    // ID_PHOTO_V1:
    //   output/compose/background/layout/segmentation
    // STYLE_PORTRAIT_V1:
    //   ai: { variants: [...] }
    const formState = ref({
      output: null,
      compose: null,
      background: null,
      layout: { x: 0.1, y: 0.1, w: 0.8, h: 0.8 },
      segmentation: {
        enabled: true,
        prefer: ['removebg', 'rembg'],
        timeoutMs: 6000,
        featherPx: 2
      },
      ai: {
        variants: []
      }
    })

    const canvasWrapRef = ref(null)
    const canvasEl = ref(null)
    const canvas = ref(null)

    const resizeCanvas = () => {
      if (!canvas.value || !canvasWrapRef.value) return
      const rect = canvasWrapRef.value.getBoundingClientRect()
      const width = rect.width || canvasWrapRef.value.clientWidth || 0
      const height = rect.height || canvasWrapRef.value.clientHeight || 720
      canvas.value.setWidth(width)
      canvas.value.setHeight(height)
      canvas.value.renderAll()
    }

    const initCanvas = () => {
      if (canvas.value || !canvasEl.value) return
      canvas.value = new Canvas(canvasEl.value, {
        backgroundColor: '#ffffff'
      })

      // 先根据容器尺寸设置画布宽高
      resizeCanvas()

      // 根据 layout 初始化矩形
      const layout = formState.value.layout || { x: 0.1, y: 0.1, w: 0.8, h: 0.8 }
      const { left, top, width, height } = layoutToRect(layout, canvas.value)

      const rect = new Rect({
        left,
        top,
        fill: 'rgba(64, 158, 255, 0.2)',
        stroke: '#409eff',
        strokeWidth: 2,
        width,
        height,
        selectable: true
      })
      canvas.value.add(rect)
      canvas.value.setActiveObject(rect)
      canvas.value.renderAll()

      // 监听矩形变化，同步回写 layout
      const syncLayout = () => {
        const nextLayout = rectToLayout(rect, canvas.value)
        formState.value = {
          ...formState.value,
          layout: nextLayout
        }
      }
      rect.on('modified', syncLayout)
      rect.on('moving', syncLayout)
      rect.on('scaling', syncLayout)
    }

    const disposeCanvas = () => {
      if (canvas.value) {
        canvas.value.dispose()
        canvas.value = null
      }
    }

    const addRect = () => {
      if (!canvas.value) return
      const rect = new Rect({
        left: 150,
        top: 150,
        fill: 'rgba(245, 108, 108, 0.2)',
        stroke: '#f56c6c',
        strokeWidth: 2,
        width: 180,
        height: 120,
        selectable: true
      })
      canvas.value.add(rect)
      canvas.value.setActiveObject(rect)
      canvas.value.renderAll()
    }

    const resetCanvas = () => {
      if (!canvas.value) return
      canvas.value.clear()
      canvas.value.setBackgroundColor('#ffffff', canvas.value.renderAll.bind(canvas.value))
      // 使用当前 layout 重新绘制矩形
      const layout = formState.value.layout || { x: 0.1, y: 0.1, w: 0.8, h: 0.8 }
      const { left, top, width, height } = layoutToRect(layout, canvas.value)
      const rect = new Rect({
        left,
        top,
        fill: 'rgba(64, 158, 255, 0.2)',
        stroke: '#409eff',
        strokeWidth: 2,
        width,
        height,
        selectable: true
      })
      canvas.value.add(rect)
      canvas.value.setActiveObject(rect)
      canvas.value.renderAll()

      // 调试信息：画布尺寸与对象数量
      console.log(
        '[DesignerEditor] Canvas size:',
        canvas.value.getWidth(),
        canvas.value.getHeight()
      )
      console.log(
        '[DesignerEditor] Objects count:',
        canvas.value.getObjects().length
      )
    }

    // 将 layout (0-1 相对坐标) 转换为 Canvas 矩形像素坐标
    const layoutToRect = (layout, canvasInstance) => {
      const cw = canvasInstance.getWidth()
      const ch = canvasInstance.getHeight()
      return {
        left: layout.x * cw,
        top: layout.y * ch,
        width: layout.w * cw,
        height: layout.h * ch
      }
    }

    // 从 Rect 反推 layout（0-1 相对坐标）
    const rectToLayout = (rect, canvasInstance) => {
      const cw = canvasInstance.getWidth()
      const ch = canvasInstance.getHeight()
      const actualWidth = rect.width * (rect.scaleX || 1)
      const actualHeight = rect.height * (rect.scaleY || 1)
      return {
        x: rect.left / cw,
        y: rect.top / ch,
        w: actualWidth / cw,
        h: actualHeight / ch
      }
    }

    const getEditorStatePayload = () => {
      const fabricJson = canvas.value ? canvas.value.toJSON() : null
      return {
        fabricJson,
        formState: formState.value,
        schemaVersion: schemaVersion.value
      }
    }

    const handleSave = async () => {
      if (!draftId.value) return
      saving.value = true
      try {
        const state = getEditorStatePayload()
        await updateDraft(draftId.value, {
          editorStateJson: JSON.stringify(state),
          status: 'DRAFT'
        })
        // 简单提示，可以后续换成消息组件
        // eslint-disable-next-line no-alert
        alert('Draft saved')
      } catch (e) {
        console.error('Failed to save draft', e)
        alert('Failed to save draft: ' + (e.response?.data?.message || e.message))
      } finally {
        saving.value = false
      }
    }

    const previewModalVisible = ref(false)
    const previewUrl = ref('')
    const previewLoading = ref(false)

    const handlePreview = async () => {
      if (!draftId.value) return
      previewing.value = true
      previewLoading.value = true
      try {
        await handleSave()
        const response = await previewDraft(draftId.value)
        if (response.data.success && response.data.data?.previewUrl) {
          const url = response.data.data.previewUrl
          // 为避免缓存，加一个时间戳
          previewUrl.value = url + (url.includes('?') ? '&' : '?') + 't=' + Date.now()
          previewModalVisible.value = true
        } else {
          alert('Preview failed: ' + (response.data.message || 'Unknown error'))
        }
      } catch (e) {
        console.error('Failed to preview', e)
        alert('Failed to preview: ' + (e.response?.data?.message || e.message))
      } finally {
        previewing.value = false
        previewLoading.value = false
      }
    }

    const reloadPreview = async () => {
      if (!draftId.value) return
      previewLoading.value = true
      try {
        const response = await previewDraft(draftId.value)
        if (response.data.success && response.data.data?.previewUrl) {
          const url = response.data.data.previewUrl
          previewUrl.value = url + (url.includes('?') ? '&' : '?') + 't=' + Date.now()
        } else {
          alert('Preview failed: ' + (response.data.message || 'Unknown error'))
        }
      } catch (e) {
        console.error('Failed to reload preview', e)
        alert('Failed to reload preview: ' + (e.response?.data?.message || e.message))
      } finally {
        previewLoading.value = false
      }
    }

    const handlePublish = async () => {
      if (!draftId.value) return
      publishing.value = true
      try {
        await handleSave()
        const response = await publishDraft(draftId.value, {
          versionSemver: version.value || '1.0.0',
          activate: true
        })
        if (response.data.success) {
          const newVersionId = response.data.data?.versionId
          alert('Publish succeeded')
          // 跳转到模板版本页，TemplateEditor 会自动刷新版本列表
          router.push(`/admin/templates/${templateId.value}`)
        } else {
          alert('Publish failed: ' + (response.data.message || 'Unknown error'))
        }
      } catch (e) {
        console.error('Failed to publish', e)
        alert('Failed to publish: ' + (e.response?.data?.message || e.message))
      } finally {
        publishing.value = false
      }
    }

    const loadData = async () => {
      loading.value = true
      try {
        // 加载模板信息
        const templateResponse = await getTemplate(templateId.value)
        if (templateResponse.data.success) {
          templateCode.value = templateResponse.data.data.code
        }

        // 加载版本信息
        const versionsResponse = await getTemplateVersions(templateId.value)
        if (versionsResponse.data.success) {
          const versions = versionsResponse.data.data || []
          const currentVersion = versions.find(v => v.id === versionId.value)
          if (currentVersion) {
            version.value = currentVersion.version
            versionStatus.value = currentVersion.status

            // ID_PHOTO_V1 Adapter：从 manifestJson 初始化 formState
            if ((designerType.value === 'ID_PHOTO_V1' || designerType.value === 'STYLE_PORTRAIT_V1') && currentVersion.manifestJson) {
              try {
                const manifest = JSON.parse(currentVersion.manifestJson)
                const output = manifest.output || null
                const compose = manifest.compose || null
                const background = compose && compose.background ? compose.background : null

                const layoutFromManifest =
                  compose &&
                  Array.isArray(compose.photos) &&
                  compose.photos.length > 0 &&
                  compose.photos[0].layout
                    ? compose.photos[0].layout
                    : { x: 0.1, y: 0.1, w: 0.8, h: 0.8 }

                const segConfig = (manifest.segmentation && typeof manifest.segmentation === 'object')
                  ? {
                      enabled: manifest.segmentation.enabled !== false,
                      prefer: manifest.segmentation.prefer || ['removebg', 'rembg'],
                      timeoutMs: manifest.segmentation.timeoutMs || 6000,
                      featherPx: manifest.segmentation.featherPx ?? 2
                    }
                  : {
                      enabled: true,
                      prefer: ['removebg', 'rembg'],
                      timeoutMs: 6000,
                      featherPx: 2
                    }

                // STYLE_PORTRAIT_V1: 从规则中提取 ai.variants
                let aiConfig = formState.value.ai || { variants: [] }
                if (designerType.value === 'STYLE_PORTRAIT_V1' && manifest.rules && manifest.rules.ai) {
                  const aiRules = manifest.rules.ai
                  if (Array.isArray(aiRules.variants)) {
                    aiConfig = {
                      ...aiConfig,
                      variants: aiRules.variants.map((v) => ({
                        name: v.name || '',
                        prompt: v.prompt || '',
                        styleImage: Array.isArray(v.styleImages) && v.styleImages.length > 0 ? v.styleImages[0] : (v.styleImage || ''),
                        parameters: {
                          size: v.parameters?.size || '1024x1024',
                          watermark: v.parameters?.watermark || 'none',
                          enable_interleave: v.parameters?.enable_interleave || false,
                          n: v.parameters?.n || 1
                        }
                      }))
                    }
                  }
                }

                formState.value = {
                  output,
                  compose,
                  background,
                  layout: layoutFromManifest,
                  segmentation: segConfig,
                  ai: aiConfig
                }
              } catch (e) {
                console.error('Failed to parse manifestJson for designer', e)
              }
            }
          }
        }

        // 创建草稿
        const editorType = designerType.value || 'GENERIC_V1'
        const initialState = {
          fabricJson: null,
          formState: {},
          schemaVersion: schemaVersion.value
        }
        const draftResponse = await createDraft({
          templateId: templateId.value,
          baseVersionId: versionId.value,
          editorType,
          schemaVersion: schemaVersion.value,
          editorStateJson: JSON.stringify(initialState)
        })
        if (draftResponse.data.success) {
          draftId.value = draftResponse.data.data.id
        } else {
          console.error('Failed to create draft:', draftResponse.data.message)
        }
      } catch (e) {
        console.error('Failed to load data', e)
      } finally {
        loading.value = false
        // 初始化画布
        initCanvas()
      }
    }

    const handleResize = () => {
      resizeCanvas()
    }

    onMounted(() => {
      loadData()
      window.addEventListener('resize', handleResize)
    })

    onBeforeUnmount(() => {
      window.removeEventListener('resize', handleResize)
      disposeCanvas()
    })

    // segmentation.prefer 输入框（逗号分隔）
    const segmentationPreferInput = computed({
      get() {
        const seg = formState.value.segmentation || {}
        return Array.isArray(seg.prefer) ? seg.prefer.join(', ') : ''
      },
      set(value) {
        const items = value
          .split(',')
          .map((s) => s.trim())
          .filter((s) => s.length > 0)
        formState.value = {
          ...formState.value,
          segmentation: {
            ...(formState.value.segmentation || {}),
            prefer: items
          }
        }
      }
    })

    // STYLE_PORTRAIT_V1: variants 操作
    const ensureAiVariants = () => {
      if (!formState.value.ai) {
        formState.value.ai = { variants: [] }
      } else if (!Array.isArray(formState.value.ai.variants)) {
        formState.value.ai.variants = []
      }
    }

    const addVariant = () => {
      ensureAiVariants()
      formState.value.ai.variants.push({
        name: `Variant ${formState.value.ai.variants.length + 1}`,
        prompt: '',
        styleImage: '',
        parameters: {
          size: '1024x1024',
          watermark: 'none',
          enable_interleave: false,
          n: 1
        }
      })
    }

    const removeVariant = (index) => {
      ensureAiVariants()
      formState.value.ai.variants.splice(index, 1)
    }

    const moveVariantUp = (index) => {
      ensureAiVariants()
      if (index <= 0) return
      const variants = formState.value.ai.variants
      const tmp = variants[index - 1]
      variants[index - 1] = variants[index]
      variants[index] = tmp
    }

    const moveVariantDown = (index) => {
      ensureAiVariants()
      const variants = formState.value.ai.variants
      if (index >= variants.length - 1) return
      const tmp = variants[index + 1]
      variants[index + 1] = variants[index]
      variants[index] = tmp
    }

    const handleStyleImageUpload = async (index, event) => {
      const files = event.target.files
      if (!files || !files[0] || !draftId.value) return
      const file = files[0]
      try {
        const response = await uploadDraftAsset(draftId.value, file)
        if (response.data.success && response.data.data?.storageUrl) {
          // 这里假设 storageUrl 形如 /storage/designer/assets/{draftId}/filename.png
          // 根据 STYLE_PORTRAIT_V1 约定，rules.ai.variants[].styleImage 使用相对路径，如 assets/styles/xxx.png
          // 简化处理：如果文件名是 xxx.png，则使用 assets/styles/xxx.png
          const url = response.data.data.storageUrl
          const filename = url.split('/').pop()
          const stylePath = `assets/styles/${filename}`
          ensureAiVariants()
          if (formState.value.ai.variants[index]) {
            formState.value.ai.variants[index].styleImage = stylePath
          }
        } else {
          alert('Upload failed: ' + (response.data.message || 'Unknown error'))
        }
      } catch (e) {
        console.error('Failed to upload style image', e)
        alert('Failed to upload style image: ' + (e.response?.data?.message || e.message))
      } finally {
        event.target.value = ''
      }
    }

    return {
      designerType,
      templateId,
      versionId,
      templateCode,
      version,
      versionStatus,
      formState,
      segmentationPreferInput,
      draftId,
      loading,
      saving,
      previewing,
      publishing,
      previewModalVisible,
      previewUrl,
      previewLoading,
      canvasEl,
      addRect,
      resetCanvas,
      handleSave,
      handlePreview,
      reloadPreview,
      handlePublish,
      addVariant,
      removeVariant,
      moveVariantUp,
      moveVariantDown,
      handleStyleImageUpload
    }
  }
}
</script>

<style scoped>
.designer-editor {
  background: white;
  padding: 2rem;
  border-radius: 8px;
}

.header {
  margin-bottom: 2rem;
}

.header-main {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.header-actions {
  display: flex;
  gap: 0.5rem;
}

.btn {
  padding: 0.5rem 1rem;
  border-radius: 4px;
  border: 1px solid #dcdfe6;
  background-color: #fff;
  color: #606266;
  cursor: pointer;
  font-size: 0.9rem;
}

.btn.primary {
  background-color: #409eff;
  border-color: #409eff;
  color: #fff;
}

.btn.small {
  padding: 0.25rem 0.75rem;
  font-size: 0.8rem;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.breadcrumb {
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
  color: #606266;
}

.breadcrumb a {
  color: #409eff;
  text-decoration: none;
}

.breadcrumb a:hover {
  text-decoration: underline;
}

.separator {
  margin: 0 0.5rem;
  color: #c0c4cc;
}

.header h1 {
  margin: 0;
  font-size: 1.5rem;
  color: #303133;
}

.editor-content {
  display: flex;
  gap: 2rem;
}

.info-panel {
  width: 300px;
  padding: 1.5rem;
  background: #f5f7fa;
  border-radius: 4px;
}

.info-panel h3 {
  margin: 0 0 1rem 0;
  font-size: 1.1rem;
  color: #303133;
}

.section-title {
  margin-top: 1.5rem;
}

.variants-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1rem;
}

.variant-item {
  padding: 0.75rem;
  border-radius: 4px;
  background: #fff;
  border: 1px solid #e4e7ed;
}

.variant-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.variant-actions {
  display: flex;
  gap: 0.25rem;
}

.info-item {
  margin-bottom: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.info-item label {
  font-size: 0.85rem;
  color: #909399;
  font-weight: 500;
}

.info-item span {
  color: #303133;
}

.status-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.85rem;
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

.editor-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 1.5rem;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
}

.editor-panel h3 {
  margin: 0 0 1rem 0;
  font-size: 1.1rem;
  color: #303133;
}

.canvas-toolbar {
  margin-bottom: 1rem;
  display: flex;
  gap: 0.5rem;
}

.canvas-wrapper {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 720px;
  background: #f6f6f6;
  border-radius: 4px;
  overflow: hidden;
}

.modal {
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
  padding: 1.5rem;
  width: 90%;
  max-width: 800px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.modal-body {
  flex: 1;
  overflow: auto;
  text-align: center;
}

.modal-footer {
  margin-top: 1rem;
  display: flex;
  justify-content: flex-end;
}

.preview-image {
  max-width: 100%;
  max-height: 70vh;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.loading {
  padding: 3rem;
  text-align: center;
  color: #909399;
}
</style>
