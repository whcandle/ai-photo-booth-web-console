<template>
  <div class="routing-policies">
    <div class="header">
      <h1>Routing Policies</h1>
      <el-button type="primary" @click="handleCreate">New Policy</el-button>
    </div>

    <!-- 筛选区域 -->
    <div class="filter-section">
      <el-form :inline="true" :model="filters" class="filter-form">
        <el-form-item label="Scope">
          <el-select
            v-model="filters.scope"
            placeholder="All Scopes"
            clearable
            style="width: 150px"
            @change="handleFilter"
          >
            <el-option label="GLOBAL" value="GLOBAL" />
            <el-option label="MERCHANT" value="MERCHANT" />
          </el-select>
        </el-form-item>
        <el-form-item label="Capability">
          <el-input
            v-model="filters.capability"
            placeholder="Filter by capability"
            clearable
            style="width: 200px"
            @input="handleFilter"
          />
        </el-form-item>
        <el-form-item label="Merchant ID">
          <el-input
            v-model="filters.merchantId"
            placeholder="Filter by merchant ID"
            clearable
            style="width: 200px"
            @input="handleFilter"
          />
        </el-form-item>
        <el-form-item>
          <el-button @click="resetFilters">Reset</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 表格列表 -->
    <el-table
      v-loading="loading"
      :data="filteredPolicies"
      style="width: 100%"
      border
    >
      <el-table-column prop="scope" label="Scope" width="100" />
      <el-table-column prop="merchantId" label="Merchant ID" width="120">
        <template #default="{ row }">
          {{ row.merchant ? row.merchant.id : '-' }}
        </template>
      </el-table-column>
      <el-table-column prop="capability" label="Capability" width="150" />
      <el-table-column prop="status" label="Status" width="100">
        <template #default="{ row }">
          <el-tag :type="row.status === 'ACTIVE' ? 'success' : 'info'">
            {{ row.status }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="preferProvidersJson" label="Prefer Providers" min-width="200">
        <template #default="{ row }">
          <pre class="json-preview">{{ formatJson(row.preferProvidersJson) }}</pre>
        </template>
      </el-table-column>
      <el-table-column prop="retryCount" label="Retry Count" width="100" />
      <el-table-column prop="failoverOnHttpCodesJson" label="Failover Codes" min-width="200">
        <template #default="{ row }">
          <pre class="json-preview">{{ formatJson(row.failoverOnHttpCodesJson) }}</pre>
        </template>
      </el-table-column>
      <el-table-column prop="maxCostTier" label="Max Cost Tier" width="120" />
      <el-table-column label="Actions" width="120" fixed="right">
        <template #default="{ row }">
          <el-button
            type="primary"
            size="small"
            @click="handleEdit(row)"
          >
            Edit
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 新增/编辑弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="700px"
      @close="handleDialogClose"
    >
      <el-form
        ref="formRef"
        :model="currentPolicy"
        :rules="formRules"
        label-width="160px"
      >
        <el-form-item
          v-if="isCreate"
          label="Scope"
          prop="scope"
        >
          <el-select
            v-model="currentPolicy.scope"
            placeholder="Select scope"
            style="width: 100%"
            @change="handleScopeChange"
          >
            <el-option label="GLOBAL" value="GLOBAL" />
            <el-option label="MERCHANT" value="MERCHANT" />
          </el-select>
        </el-form-item>
        <el-form-item
          v-if="isCreate && currentPolicy.scope === 'MERCHANT'"
          label="Merchant Code"
          prop="merchantCode"
        >
          <el-input
            v-model="currentPolicy.merchantCode"
            placeholder="Enter merchant code"
          />
        </el-form-item>
        <el-form-item
          v-if="isCreate"
          label="Capability"
          prop="capability"
        >
          <el-input
            v-model="currentPolicy.capability"
            placeholder="e.g., segmentation"
          />
        </el-form-item>
        <el-form-item
          v-if="!isCreate"
          label="Scope"
        >
          <el-input
            :value="currentPolicy.scope"
            disabled
          />
        </el-form-item>
        <el-form-item
          v-if="!isCreate"
          label="Merchant ID"
        >
          <el-input
            :value="currentPolicy.merchant ? currentPolicy.merchant.id : '-'"
            disabled
          />
        </el-form-item>
        <el-form-item
          v-if="!isCreate"
          label="Capability"
        >
          <el-input
            :value="currentPolicy.capability"
            disabled
          />
        </el-form-item>
        <el-form-item
          label="Status"
          prop="status"
        >
          <el-select
            v-model="currentPolicy.status"
            placeholder="Select status"
            style="width: 100%"
          >
            <el-option label="ACTIVE" value="ACTIVE" />
            <el-option label="INACTIVE" value="INACTIVE" />
          </el-select>
        </el-form-item>
        <el-form-item
          label="Prefer Providers (JSON)"
          prop="preferProvidersJson"
        >
          <el-input
            v-model="currentPolicy.preferProvidersJson"
            type="textarea"
            :rows="4"
            placeholder='["provider1", "provider2"]'
          />
          <div class="form-tip">Must be valid JSON array format</div>
        </el-form-item>
        <el-form-item
          label="Retry Count"
          prop="retryCount"
        >
          <el-input-number
            v-model="currentPolicy.retryCount"
            :min="0"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item
          label="Failover Codes (JSON)"
          prop="failoverOnHttpCodesJson"
        >
          <el-input
            v-model="currentPolicy.failoverOnHttpCodesJson"
            type="textarea"
            :rows="4"
            placeholder='[500, 502, 503]'
          />
          <div class="form-tip">Must be valid JSON array format</div>
        </el-form-item>
        <el-form-item
          label="Max Cost Tier"
          prop="maxCostTier"
        >
          <el-input-number
            v-model="currentPolicy.maxCostTier"
            :min="0"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">Cancel</el-button>
          <el-button
            type="primary"
            :loading="submitting"
            @click="handleSubmit"
          >
            {{ isCreate ? 'Create' : 'Update' }}
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import {
  listPolicies,
  createPolicy,
  updatePolicy
} from '../../api/routingPolicies'

export default {
  name: 'RoutingPolicies',
  setup() {
    const policies = ref([])
    const loading = ref(false)
    const dialogVisible = ref(false)
    const submitting = ref(false)
    const isCreate = ref(true)
    const formRef = ref(null)

    // 筛选条件
    const filters = reactive({
      scope: '',
      capability: '',
      merchantId: ''
    })

    // 表单数据
    const currentPolicy = reactive({
      id: null,
      scope: 'GLOBAL',
      merchantCode: '',
      capability: '',
      status: 'ACTIVE',
      preferProvidersJson: '',
      retryCount: 0,
      failoverOnHttpCodesJson: '',
      maxCostTier: null
    })

    // 表单验证规则
    const formRules = {
      scope: [
        { required: true, message: 'Please select scope', trigger: 'change' }
      ],
      merchantCode: [
        {
          validator: (rule, value, callback) => {
            if (currentPolicy.scope === 'MERCHANT' && (!value || value.trim() === '')) {
              callback(new Error('Merchant code is required for MERCHANT scope'))
            } else {
              callback()
            }
          },
          trigger: 'blur'
        }
      ],
      capability: [
        { required: true, message: 'Please enter capability', trigger: 'blur' }
      ],
      status: [
        { required: true, message: 'Please select status', trigger: 'change' }
      ],
      preferProvidersJson: [
        {
          validator: (rule, value, callback) => {
            if (!value || value.trim() === '') {
              callback()
              return
            }
            try {
              const parsed = JSON.parse(value)
              if (!Array.isArray(parsed)) {
                callback(new Error('Must be a JSON array'))
              } else {
                callback()
              }
            } catch (e) {
              callback(new Error('Invalid JSON format'))
            }
          },
          trigger: 'blur'
        }
      ],
      failoverOnHttpCodesJson: [
        {
          validator: (rule, value, callback) => {
            if (!value || value.trim() === '') {
              callback()
              return
            }
            try {
              const parsed = JSON.parse(value)
              if (!Array.isArray(parsed)) {
                callback(new Error('Must be a JSON array'))
              } else {
                callback()
              }
            } catch (e) {
              callback(new Error('Invalid JSON format'))
            }
          },
          trigger: 'blur'
        }
      ]
    }

    const dialogTitle = computed(() => {
      return isCreate.value ? 'New Routing Policy' : 'Edit Routing Policy'
    })

    // 筛选后的列表
    const filteredPolicies = computed(() => {
      let result = policies.value

      if (filters.scope) {
        result = result.filter(p => p.scope === filters.scope)
      }

      if (filters.capability) {
        result = result.filter(p =>
          p.capability.toLowerCase().includes(filters.capability.toLowerCase())
        )
      }

      if (filters.merchantId) {
        const merchantIdNum = Number(filters.merchantId)
        if (!isNaN(merchantIdNum)) {
          result = result.filter(p =>
            p.merchant && p.merchant.id === merchantIdNum
          )
        }
      }

      return result
    })

    // 加载列表
    const loadPolicies = async () => {
      loading.value = true
      try {
        const response = await listPolicies()
        if (response.data.success) {
          policies.value = response.data.data || []
        } else {
          ElMessage.error('Failed to load policies: ' + response.data.message)
        }
      } catch (error) {
        console.error('Failed to load policies', error)
        ElMessage.error('Failed to load policies')
      } finally {
        loading.value = false
      }
    }

    // 筛选处理
    const handleFilter = () => {
      // 筛选逻辑在 computed 中处理
    }

    // 重置筛选
    const resetFilters = () => {
      filters.scope = ''
      filters.capability = ''
      filters.merchantId = ''
    }

    // Scope 变化处理
    const handleScopeChange = () => {
      if (currentPolicy.scope !== 'MERCHANT') {
        currentPolicy.merchantCode = ''
      }
    }

    // 打开新增弹窗
    const handleCreate = () => {
      isCreate.value = true
      currentPolicy.id = null
      currentPolicy.scope = 'GLOBAL'
      currentPolicy.merchantCode = ''
      currentPolicy.capability = ''
      currentPolicy.status = 'ACTIVE'
      currentPolicy.preferProvidersJson = ''
      currentPolicy.retryCount = 0
      currentPolicy.failoverOnHttpCodesJson = ''
      currentPolicy.maxCostTier = null
      dialogVisible.value = true
    }

    // 打开编辑弹窗
    const handleEdit = (row) => {
      isCreate.value = false
      currentPolicy.id = row.id
      currentPolicy.scope = row.scope
      // 编辑时不需要 merchantCode，因为后端不允许修改
      currentPolicy.merchantCode = ''
      currentPolicy.capability = row.capability
      currentPolicy.status = row.status
      currentPolicy.preferProvidersJson = row.preferProvidersJson
        ? (typeof row.preferProvidersJson === 'string'
            ? row.preferProvidersJson
            : JSON.stringify(row.preferProvidersJson, null, 2))
        : ''
      currentPolicy.retryCount = row.retryCount || 0
      currentPolicy.failoverOnHttpCodesJson = row.failoverOnHttpCodesJson
        ? (typeof row.failoverOnHttpCodesJson === 'string'
            ? row.failoverOnHttpCodesJson
            : JSON.stringify(row.failoverOnHttpCodesJson, null, 2))
        : ''
      currentPolicy.maxCostTier = row.maxCostTier
      dialogVisible.value = true
    }

    // 提交表单
    const handleSubmit = async () => {
      if (!formRef.value) return

      // 先验证 JSON 字段
      if (currentPolicy.preferProvidersJson) {
        try {
          const parsed = JSON.parse(currentPolicy.preferProvidersJson)
          if (!Array.isArray(parsed)) {
            ElMessage.error('Prefer Providers must be a JSON array')
            return
          }
        } catch (e) {
          ElMessage.error('Invalid JSON format in Prefer Providers')
          return
        }
      }

      if (currentPolicy.failoverOnHttpCodesJson) {
        try {
          const parsed = JSON.parse(currentPolicy.failoverOnHttpCodesJson)
          if (!Array.isArray(parsed)) {
            ElMessage.error('Failover Codes must be a JSON array')
            return
          }
        } catch (e) {
          ElMessage.error('Invalid JSON format in Failover Codes')
          return
        }
      }

      await formRef.value.validate(async (valid) => {
        if (!valid) return

        submitting.value = true
        try {
          let response
          if (isCreate.value) {
            const data = {
              scope: currentPolicy.scope,
              merchantCode: currentPolicy.scope === 'MERCHANT' ? currentPolicy.merchantCode : null,
              capability: currentPolicy.capability,
              status: currentPolicy.status,
              preferProvidersJson: currentPolicy.preferProvidersJson
                ? currentPolicy.preferProvidersJson.trim()
                : null,
              retryCount: currentPolicy.retryCount,
              failoverOnHttpCodesJson: currentPolicy.failoverOnHttpCodesJson
                ? currentPolicy.failoverOnHttpCodesJson.trim()
                : null,
              maxCostTier: currentPolicy.maxCostTier
            }
            response = await createPolicy(data)
          } else {
            const data = {
              status: currentPolicy.status,
              preferProvidersJson: currentPolicy.preferProvidersJson
                ? currentPolicy.preferProvidersJson.trim()
                : null,
              retryCount: currentPolicy.retryCount,
              failoverOnHttpCodesJson: currentPolicy.failoverOnHttpCodesJson
                ? currentPolicy.failoverOnHttpCodesJson.trim()
                : null,
              maxCostTier: currentPolicy.maxCostTier
            }
            response = await updatePolicy(currentPolicy.id, data)
          }

          if (response.data.success) {
            ElMessage.success(
              isCreate.value
                ? 'Policy created successfully'
                : 'Policy updated successfully'
            )
            dialogVisible.value = false
            loadPolicies()
          } else {
            ElMessage.error(response.data.message || 'Operation failed')
          }
        } catch (error) {
          console.error('Operation failed', error)
          ElMessage.error(
            error.response?.data?.message || 'Operation failed'
          )
        } finally {
          submitting.value = false
        }
      })
    }

    // 关闭弹窗
    const handleDialogClose = () => {
      formRef.value?.resetFields()
    }

    // 工具函数
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

    onMounted(() => {
      loadPolicies()
    })

    return {
      policies,
      loading,
      dialogVisible,
      submitting,
      isCreate,
      formRef,
      filters,
      currentPolicy,
      formRules,
      dialogTitle,
      filteredPolicies,
      handleCreate,
      handleEdit,
      handleSubmit,
      handleDialogClose,
      handleFilter,
      resetFilters,
      handleScopeChange,
      formatJson
    }
  }
}
</script>

<style scoped>
.routing-policies {
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

.header h1 {
  margin: 0;
  font-size: 1.5rem;
  color: #303133;
}

.filter-section {
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: #f5f5f5;
  border-radius: 4px;
}

.filter-form {
  margin: 0;
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

.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>
