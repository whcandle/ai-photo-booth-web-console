<template>
  <div class="provider-detail">
    <!-- 顶部基本信息 -->
    <div class="provider-header">
      <div class="provider-info">
        <h1>{{ provider.name || 'Loading...' }}</h1>
        <div class="info-row">
          <span class="label">Code:</span>
          <span class="value">{{ provider.code || '-' }}</span>
        </div>
        <div class="info-row">
          <span class="label">Status:</span>
          <el-tag :type="provider.status === 'ACTIVE' ? 'success' : 'info'">
            {{ provider.status || '-' }}
          </el-tag>
        </div>
      </div>
      <el-button @click="goBack">Back to List</el-button>
    </div>

    <!-- Tabs -->
    <el-tabs v-model="activeTab" class="detail-tabs">
      <!-- Capabilities Tab -->
      <el-tab-pane label="Capabilities" name="capabilities">
        <div class="tab-content">
          <div class="tab-header">
            <h2>Capabilities</h2>
            <el-button type="primary" @click="handleCreateCapability">
              New Capability
            </el-button>
          </div>

          <el-table
            v-loading="capabilitiesLoading"
            :data="capabilities"
            style="width: 100%"
            border
          >
            <el-table-column prop="capability" label="Capability" width="150" />
            <el-table-column prop="endpoint" label="Endpoint" width="200" />
            <el-table-column prop="status" label="Status" width="100">
              <template #default="{ row }">
                <el-tag :type="row.status === 'ACTIVE' ? 'success' : 'info'">
                  {{ row.status }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="priority" label="Priority" width="100" />
            <el-table-column prop="defaultTimeoutMs" label="Timeout (ms)" width="120" />
            <el-table-column prop="constraints" label="Constraints" width="200">
              <template #default="{ row }">
                <span class="constraints-summary" v-html="formatConstraints(row)"></span>
              </template>
            </el-table-column>
            <el-table-column prop="defaultParamsJson" label="Default Params" min-width="200">
              <template #default="{ row }">
                <pre class="json-preview">{{ formatJson(row.defaultParamsJson) }}</pre>
              </template>
            </el-table-column>
            <el-table-column prop="createdAt" label="Created At" width="180">
              <template #default="{ row }">
                {{ formatDate(row.createdAt) }}
              </template>
            </el-table-column>
            <el-table-column label="Actions" width="120" fixed="right">
              <template #default="{ row }">
                <el-button
                  type="primary"
                  size="small"
                  @click="handleEditCapability(row)"
                >
                  Edit
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>

      <!-- Keys Tab -->
      <el-tab-pane label="Keys" name="keys">
        <div class="tab-content">
          <div class="tab-header">
            <h2>API Keys</h2>
            <el-button type="primary" @click="handleCreateKey">
              New Key
            </el-button>
          </div>

          <el-table
            v-loading="keysLoading"
            :data="keys"
            style="width: 100%"
            border
          >
            <el-table-column prop="name" label="Name" width="200" />
            <el-table-column prop="status" label="Status" width="120">
              <template #default="{ row }">
                <el-tag :type="row.status === 'ACTIVE' ? 'success' : 'info'">
                  {{ row.status }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="createdAt" label="Created At" width="180">
              <template #default="{ row }">
                {{ formatDate(row.createdAt) }}
              </template>
            </el-table-column>
            <el-table-column label="Actions" width="120" fixed="right">
              <template #default="{ row }">
                <el-button
                  v-if="row.status === 'ACTIVE'"
                  type="danger"
                  size="small"
                  @click="handleDisableKey(row)"
                >
                  Disable
                </el-button>
                <span v-else class="disabled-text">Disabled</span>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- Capability 新增/编辑弹窗 -->
    <el-dialog
      v-model="capabilityDialogVisible"
      :title="capabilityDialogTitle"
      width="600px"
      @close="handleCapabilityDialogClose"
    >
      <el-form
        ref="capabilityFormRef"
        :model="currentCapability"
        :rules="capabilityRules"
        label-width="140px"
      >
        <el-form-item label="Capability" prop="capability">
          <el-input
            v-model="currentCapability.capability"
            placeholder="e.g., segmentation"
          />
        </el-form-item>
        <el-form-item label="Endpoint" prop="endpoint">
          <el-input
            v-model="currentCapability.endpoint"
            placeholder="e.g., https://api.example.com/v1/segment"
          />
        </el-form-item>
        <el-form-item label="Status" prop="status">
          <el-select
            v-model="currentCapability.status"
            placeholder="Select status"
            style="width: 100%"
          >
            <el-option label="ACTIVE" value="ACTIVE" />
            <el-option label="INACTIVE" value="INACTIVE" />
          </el-select>
        </el-form-item>
        <el-form-item label="Priority" prop="priority">
          <el-input-number
            v-model="currentCapability.priority"
            :min="0"
            :max="999"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="Timeout (ms)" prop="defaultTimeoutMs">
          <el-input-number
            v-model="currentCapability.defaultTimeoutMs"
            :min="0"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="Default Params (JSON)" prop="defaultParamsJson">
          <el-input
            v-model="currentCapability.defaultParamsJson"
            type="textarea"
            :rows="6"
            placeholder='{"key": "value"}'
          />
          <div class="form-tip">
            Must be valid JSON format
          </div>
        </el-form-item>

        <el-divider>
          <h3 style="margin: 0; font-size: 14px; font-weight: 600; color: #303133;">Input Constraints</h3>
        </el-divider>

        <el-form-item label="Max Bytes (MB)" prop="inputMaxBytesMb">
          <el-input-number
            v-model="currentCapability.inputMaxBytesMb"
            :precision="2"
            :step="0.1"
            :min="0"
            placeholder="10"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="Max Side (px)" prop="inputMaxSide">
          <el-input-number
            v-model="currentCapability.inputMaxSide"
            :min="0"
            placeholder="4096"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="Max Pixels (MP)" prop="inputMaxPixelsMp">
          <el-input-number
            v-model="currentCapability.inputMaxPixelsMp"
            :precision="2"
            :step="0.1"
            :min="0"
            placeholder="12"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="Accept Formats">
          <el-select
            v-model="currentCapability.acceptFormatsArr"
            multiple
            placeholder="Select formats"
            style="width: 100%"
          >
            <el-option label="jpeg" value="jpeg" />
            <el-option label="jpg" value="jpg" />
            <el-option label="png" value="png" />
            <el-option label="webp" value="webp" />
          </el-select>
        </el-form-item>

        <el-form-item label="Default Quality (1-100)" prop="defaultQuality">
          <el-input-number
            v-model="currentCapability.defaultQuality"
            :min="1"
            :max="100"
            placeholder="85"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="capabilityDialogVisible = false">Cancel</el-button>
          <el-button
            type="primary"
            :loading="capabilitySubmitting"
            @click="handleCapabilitySubmit"
          >
            {{ isCreateCapability ? 'Create' : 'Update' }}
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- Key 新增弹窗 -->
    <el-dialog
      v-model="keyDialogVisible"
      title="New API Key"
      width="500px"
      @close="handleKeyDialogClose"
    >
      <el-form
        ref="keyFormRef"
        :model="currentKey"
        :rules="keyRules"
        label-width="100px"
      >
        <el-form-item label="Name" prop="name">
          <el-input
            v-model="currentKey.name"
            placeholder="Enter key name"
          />
        </el-form-item>
        <el-form-item label="API Key" prop="apiKey">
          <el-input
            v-model="currentKey.apiKey"
            type="password"
            show-password
            placeholder="Enter API key (plain text)"
          />
          <div class="form-tip warning">
            ⚠️ After creation, the plain text key cannot be viewed again.
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="keyDialogVisible = false">Cancel</el-button>
          <el-button
            type="primary"
            :loading="keySubmitting"
            @click="handleKeySubmit"
          >
            Create
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { listProviders } from '../../api/providers'
import {
  listCapabilities,
  createCapability,
  updateCapability
} from '../../api/providerCapabilities'
import {
  listKeys,
  createKey,
  disableKey
} from '../../api/providerKeys'

export default {
  name: 'ProviderDetail',
  setup() {
    const route = useRoute()
    const router = useRouter()
    const providerId = computed(() => Number(route.params.id))

    // Provider 基本信息
    const provider = ref({})
    const providerLoading = ref(false)

    // Capabilities
    const capabilities = ref([])
    const capabilitiesLoading = ref(false)
    const capabilityDialogVisible = ref(false)
    const capabilitySubmitting = ref(false)
    const isCreateCapability = ref(true)
    const capabilityFormRef = ref(null)
    const currentCapability = reactive({
      id: null,
      capability: '',
      endpoint: '',
      status: 'ACTIVE',
      priority: 0,
      defaultTimeoutMs: 30000,
      defaultParamsJson: '{}',
      inputMaxBytesMb: null,
      inputMaxSide: null,
      inputMaxPixelsMp: null,
      acceptFormatsArr: [],
      defaultQuality: null
    })

    // Keys
    const keys = ref([])
    const keysLoading = ref(false)
    const keyDialogVisible = ref(false)
    const keySubmitting = ref(false)
    const keyFormRef = ref(null)
    const currentKey = reactive({
      name: '',
      apiKey: ''
    })

    const activeTab = ref('capabilities')

    // 工具函数：安全 JSON 解析
    const safeJsonParse = (s, fallback) => {
      if (!s || (typeof s === 'string' && s.trim() === '')) {
        return fallback
      }
      try {
        return JSON.parse(s)
      } catch (e) {
        return fallback
      }
    }

    // 表单验证规则
    const capabilityRules = {
      capability: [
        { required: true, message: 'Please enter capability', trigger: 'blur' }
      ],
      endpoint: [
        { required: true, message: 'Please enter endpoint', trigger: 'blur' }
      ],
      status: [
        { required: true, message: 'Please select status', trigger: 'change' }
      ],
      priority: [
        { required: true, message: 'Please enter priority', trigger: 'blur' }
      ],
      defaultParamsJson: [
        {
          validator: (rule, value, callback) => {
            if (!value || value.trim() === '') {
              callback()
              return
            }
            try {
              JSON.parse(value)
              callback()
            } catch (e) {
              callback(new Error('Invalid JSON format'))
            }
          },
          trigger: 'blur'
        }
      ],
      inputMaxBytesMb: [
        {
          validator: (rule, value, callback) => {
            if (value == null || value === '') {
              callback()
              return
            }
            if (value <= 0) {
              callback(new Error('Max Bytes must be greater than 0'))
              return
            }
            callback()
          },
          trigger: 'blur'
        }
      ],
      inputMaxSide: [
        {
          validator: (rule, value, callback) => {
            if (value == null || value === '') {
              callback()
              return
            }
            if (value <= 0) {
              callback(new Error('Max Side must be greater than 0'))
              return
            }
            callback()
          },
          trigger: 'blur'
        }
      ],
      inputMaxPixelsMp: [
        {
          validator: (rule, value, callback) => {
            if (value == null || value === '') {
              callback()
              return
            }
            if (value <= 0) {
              callback(new Error('Max Pixels must be greater than 0'))
              return
            }
            callback()
          },
          trigger: 'blur'
        }
      ],
      defaultQuality: [
        {
          validator: (rule, value, callback) => {
            if (value == null || value === '') {
              callback()
              return
            }
            if (value < 1 || value > 100) {
              callback(new Error('Default Quality must be between 1 and 100'))
              return
            }
            callback()
          },
          trigger: 'blur'
        }
      ]
    }

    const keyRules = {
      name: [
        { required: true, message: 'Please enter key name', trigger: 'blur' }
      ],
      apiKey: [
        { required: true, message: 'Please enter API key', trigger: 'blur' }
      ]
    }

    const capabilityDialogTitle = computed(() => {
      return isCreateCapability.value ? 'New Capability' : 'Edit Capability'
    })

    // 加载 Provider 基本信息
    const loadProvider = async () => {
      providerLoading.value = true
      try {
        const response = await listProviders()
        if (response.data.success) {
          const found = response.data.data.find(p => p.id === providerId.value)
          if (found) {
            provider.value = found
          } else {
            ElMessage.error('Provider not found')
            router.push('/admin/providers')
          }
        } else {
          ElMessage.error('Failed to load provider: ' + response.data.message)
        }
      } catch (error) {
        console.error('Failed to load provider', error)
        ElMessage.error('Failed to load provider')
        router.push('/admin/providers')
      } finally {
        providerLoading.value = false
      }
    }

    // 加载 Capabilities
    const loadCapabilities = async () => {
      capabilitiesLoading.value = true
      try {
        const response = await listCapabilities(providerId.value)
        if (response.data.success) {
          capabilities.value = response.data.data || []
        } else {
          ElMessage.error('Failed to load capabilities: ' + response.data.message)
        }
      } catch (error) {
        console.error('Failed to load capabilities', error)
        ElMessage.error('Failed to load capabilities')
      } finally {
        capabilitiesLoading.value = false
      }
    }

    // 加载 Keys
    const loadKeys = async () => {
      keysLoading.value = true
      try {
        const response = await listKeys(providerId.value)
        if (response.data.success) {
          keys.value = response.data.data || []
        } else {
          ElMessage.error('Failed to load keys: ' + response.data.message)
        }
      } catch (error) {
        console.error('Failed to load keys', error)
        ElMessage.error('Failed to load keys')
      } finally {
        keysLoading.value = false
      }
    }

    // Capability 操作
    const handleCreateCapability = () => {
      isCreateCapability.value = true
      currentCapability.id = null
      currentCapability.capability = ''
      currentCapability.endpoint = ''
      currentCapability.status = 'ACTIVE'
      currentCapability.priority = 0
      currentCapability.defaultTimeoutMs = 30000
      currentCapability.defaultParamsJson = '{}'
      currentCapability.inputMaxBytesMb = null
      currentCapability.inputMaxSide = null
      currentCapability.inputMaxPixelsMp = null
      currentCapability.acceptFormatsArr = []
      currentCapability.defaultQuality = null
      capabilityDialogVisible.value = true
    }

    const handleEditCapability = (row) => {
      isCreateCapability.value = false
      currentCapability.id = row.id
      currentCapability.capability = row.capability
      currentCapability.endpoint = row.endpoint
      currentCapability.status = row.status
      currentCapability.priority = row.priority
      currentCapability.defaultTimeoutMs = row.defaultTimeoutMs
      // 处理 defaultParamsJson：可能是字符串或对象
      if (row.defaultParamsJson) {
        if (typeof row.defaultParamsJson === 'string') {
          try {
            // 如果是字符串，先解析再格式化
            const parsed = JSON.parse(row.defaultParamsJson)
            currentCapability.defaultParamsJson = JSON.stringify(parsed, null, 2)
          } catch (e) {
            // 如果解析失败，直接使用原字符串
            currentCapability.defaultParamsJson = row.defaultParamsJson
          }
        } else {
          // 如果是对象，直接格式化
          currentCapability.defaultParamsJson = JSON.stringify(row.defaultParamsJson, null, 2)
        }
      } else {
        currentCapability.defaultParamsJson = '{}'
      }

      // 回显 Input Constraints 字段
      // inputMaxBytesMb: bytes -> MB，保留 2 位小数
      if (row.inputMaxBytes != null && row.inputMaxBytes !== undefined) {
        currentCapability.inputMaxBytesMb = Math.round((row.inputMaxBytes / 1024 / 1024) * 100) / 100
      } else {
        currentCapability.inputMaxBytesMb = null
      }

      // inputMaxPixelsMp: pixels -> MP，保留 2 位小数
      if (row.inputMaxPixels != null && row.inputMaxPixels !== undefined) {
        currentCapability.inputMaxPixelsMp = Math.round((row.inputMaxPixels / 1_000_000) * 100) / 100
      } else {
        currentCapability.inputMaxPixelsMp = null
      }

      // inputMaxSide: 直接回显
      currentCapability.inputMaxSide = row.inputMaxSide || null

      // defaultQuality: 直接回显
      currentCapability.defaultQuality = row.defaultQuality || null

      // acceptFormatsArr: 解析 JSON 字符串或直接使用数组
      if (row.acceptFormats) {
        if (typeof row.acceptFormats === 'string') {
          currentCapability.acceptFormatsArr = safeJsonParse(row.acceptFormats, [])
        } else if (Array.isArray(row.acceptFormats)) {
          currentCapability.acceptFormatsArr = row.acceptFormats
        } else {
          currentCapability.acceptFormatsArr = []
        }
      } else {
        currentCapability.acceptFormatsArr = []
      }

      capabilityDialogVisible.value = true
    }

    const handleCapabilitySubmit = async () => {
      if (!capabilityFormRef.value) return

      // 先验证 JSON
      if (currentCapability.defaultParamsJson) {
        try {
          JSON.parse(currentCapability.defaultParamsJson)
        } catch (e) {
          ElMessage.error('Invalid JSON format in Default Params')
          return
        }
      }

      await capabilityFormRef.value.validate(async (valid) => {
        if (!valid) return

        capabilitySubmitting.value = true
        try {
          // 确保 defaultParamsJson 是有效的 JSON 字符串
          let defaultParamsJsonValue = null
          if (currentCapability.defaultParamsJson && currentCapability.defaultParamsJson.trim()) {
            try {
              // 验证 JSON 格式，然后作为字符串发送
              JSON.parse(currentCapability.defaultParamsJson)
              defaultParamsJsonValue = currentCapability.defaultParamsJson.trim()
            } catch (e) {
              ElMessage.error('Invalid JSON format in Default Params')
              capabilitySubmitting.value = false
              return
            }
          }

          const data = {
            capability: currentCapability.capability,
            endpoint: currentCapability.endpoint,
            status: currentCapability.status,
            priority: currentCapability.priority,
            defaultTimeoutMs: currentCapability.defaultTimeoutMs,
            defaultParamsJson: defaultParamsJsonValue
          }

          // 转换并添加 Input Constraints 字段
          // inputMaxBytes: MB -> bytes
          if (currentCapability.inputMaxBytesMb != null && currentCapability.inputMaxBytesMb !== '') {
            data.inputMaxBytes = Math.round(currentCapability.inputMaxBytesMb * 1024 * 1024)
          }

          // inputMaxSide: 直接传数值（如果非空）
          if (currentCapability.inputMaxSide != null && currentCapability.inputMaxSide !== '') {
            data.inputMaxSide = currentCapability.inputMaxSide
          }

          // inputMaxPixels: MP -> pixels
          if (currentCapability.inputMaxPixelsMp != null && currentCapability.inputMaxPixelsMp !== '') {
            data.inputMaxPixels = Math.round(currentCapability.inputMaxPixelsMp * 1000000)
          }

          // acceptFormats: 数组 -> JSON 字符串
          if (currentCapability.acceptFormatsArr && currentCapability.acceptFormatsArr.length > 0) {
            data.acceptFormats = JSON.stringify(currentCapability.acceptFormatsArr)
          }

          // defaultQuality: 直接传数值（如果非空）
          if (currentCapability.defaultQuality != null && currentCapability.defaultQuality !== '') {
            data.defaultQuality = currentCapability.defaultQuality
          }

          let response
          if (isCreateCapability.value) {
            response = await createCapability(providerId.value, data)
          } else {
            response = await updateCapability(
              providerId.value,
              currentCapability.id,
              data
            )
          }

          if (response.data.success) {
            ElMessage.success(
              isCreateCapability.value
                ? 'Capability created successfully'
                : 'Capability updated successfully'
            )
            capabilityDialogVisible.value = false
            loadCapabilities()
          } else {
            ElMessage.error(response.data.message || 'Operation failed')
          }
        } catch (error) {
          console.error('Operation failed', error)
          ElMessage.error(
            error.response?.data?.message || 'Operation failed'
          )
        } finally {
          capabilitySubmitting.value = false
        }
      })
    }

    const handleCapabilityDialogClose = () => {
      capabilityFormRef.value?.resetFields()
    }

    // Key 操作
    const handleCreateKey = () => {
      currentKey.name = ''
      currentKey.apiKey = ''
      keyDialogVisible.value = true
    }

    const handleKeySubmit = async () => {
      if (!keyFormRef.value) return

      await keyFormRef.value.validate(async (valid) => {
        if (!valid) return

        keySubmitting.value = true
        try {
          const response = await createKey(providerId.value, {
            name: currentKey.name,
            apiKey: currentKey.apiKey
          })

          if (response.data.success) {
            ElMessage.success('API Key created successfully')
            keyDialogVisible.value = false
            loadKeys()
          } else {
            ElMessage.error(response.data.message || 'Operation failed')
          }
        } catch (error) {
          console.error('Operation failed', error)
          ElMessage.error(
            error.response?.data?.message || 'Operation failed'
          )
        } finally {
          keySubmitting.value = false
        }
      })
    }

    const handleDisableKey = async (row) => {
      try {
        await ElMessageBox.confirm(
          'Are you sure you want to disable this API key?',
          'Confirm Disable',
          {
            confirmButtonText: 'Disable',
            cancelButtonText: 'Cancel',
            type: 'warning'
          }
        )

        const response = await disableKey(providerId.value, row.id)
        if (response.data.success) {
          ElMessage.success('API Key disabled successfully')
          loadKeys()
        } else {
          ElMessage.error(response.data.message || 'Operation failed')
        }
      } catch (error) {
        if (error !== 'cancel') {
          console.error('Operation failed', error)
          ElMessage.error(
            error.response?.data?.message || 'Operation failed'
          )
        }
      }
    }

    const handleKeyDialogClose = () => {
      keyFormRef.value?.resetFields()
    }

    // 工具函数
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

    const formatJson = (json) => {
      if (!json) return '-'
      if (typeof json === 'string') {
        try {
          return JSON.stringify(JSON.parse(json), null, 2)
        } catch (e) {
          return json
        }
      }
      return JSON.stringify(json, null, 2)
    }

    const formatConstraints = (row) => {
      const parts = []

      // bytes -> MB（保留 1 位小数）
      if (row.inputMaxBytes != null && row.inputMaxBytes !== undefined) {
        const mb = Math.round((row.inputMaxBytes / 1024 / 1024) * 10) / 10
        parts.push(`${mb}MB`)
      } else {
        parts.push('<span class="muted">-</span>')
      }

      // maxSide
      if (row.inputMaxSide != null && row.inputMaxSide !== undefined) {
        parts.push(`${row.inputMaxSide}px`)
      } else {
        parts.push('<span class="muted">-</span>')
      }

      // pixels -> MP（保留 1 位小数）
      if (row.inputMaxPixels != null && row.inputMaxPixels !== undefined) {
        const mp = Math.round((row.inputMaxPixels / 1_000_000) * 10) / 10
        parts.push(`${mp}MP`)
      } else {
        parts.push('<span class="muted">-</span>')
      }

      // formats: 如果是 JSON string 则 parse 后 join
      let formats = []
      if (row.acceptFormats) {
        if (typeof row.acceptFormats === 'string') {
          formats = safeJsonParse(row.acceptFormats, [])
        } else if (Array.isArray(row.acceptFormats)) {
          formats = row.acceptFormats
        }
      }
      if (formats.length > 0) {
        parts.push(formats.join('/'))
      } else {
        parts.push('<span class="muted">-</span>')
      }

      // quality
      if (row.defaultQuality != null && row.defaultQuality !== undefined) {
        parts.push(`q${row.defaultQuality}`)
      } else {
        parts.push('<span class="muted">-</span>')
      }

      return parts.join(' | ')
    }

    const goBack = () => {
      router.push('/admin/providers')
    }

    // 初始化
    onMounted(() => {
      loadProvider()
      loadCapabilities()
      loadKeys()
    })

    return {
      provider,
      providerLoading,
      capabilities,
      capabilitiesLoading,
      keys,
      keysLoading,
      activeTab,
      capabilityDialogVisible,
      capabilitySubmitting,
      isCreateCapability,
      capabilityFormRef,
      currentCapability,
      capabilityRules,
      capabilityDialogTitle,
      keyDialogVisible,
      keySubmitting,
      keyFormRef,
      currentKey,
      keyRules,
      handleCreateCapability,
      handleEditCapability,
      handleCapabilitySubmit,
      handleCapabilityDialogClose,
      handleCreateKey,
      handleKeySubmit,
      handleDisableKey,
      handleKeyDialogClose,
      formatDate,
      formatJson,
      formatConstraints,
      goBack
    }
  }
}
</script>

<style scoped>
.provider-detail {
  background: white;
  padding: 2rem;
  border-radius: 8px;
}

.provider-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e4e7ed;
}

.provider-info h1 {
  margin: 0 0 1rem 0;
  font-size: 1.5rem;
  color: #303133;
}

.info-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 0.5rem;
}

.info-row .label {
  font-weight: 600;
  color: #606266;
}

.info-row .value {
  color: #303133;
}

.detail-tabs {
  margin-top: 1rem;
}

.tab-content {
  padding: 1rem 0;
}

.tab-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.tab-header h2 {
  margin: 0;
  font-size: 1.2rem;
  color: #303133;
}

.json-preview {
  margin: 0;
  font-size: 12px;
  max-height: 100px;
  overflow: auto;
  background: #f5f5f5;
  padding: 4px 8px;
  border-radius: 4px;
}

.disabled-text {
  color: #909399;
  font-size: 14px;
}

.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.form-tip.warning {
  color: #e6a23c;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.constraints-summary {
  font-size: 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.constraints-summary .muted {
  color: #909399;
}
</style>
