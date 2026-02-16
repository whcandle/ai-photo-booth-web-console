<template>
  <div class="providers">
    <div class="header">
      <h1>Providers</h1>
      <el-button type="primary" @click="handleCreate">New Provider</el-button>
    </div>

    <!-- 表格列表 -->
    <el-table
      v-loading="loading"
      :data="providers"
      style="width: 100%"
      border
    >
      <el-table-column prop="code" label="Code" width="150" />
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
      <el-table-column label="Actions" width="180" fixed="right">
        <template #default="{ row }">
          <el-button
            type="primary"
            size="small"
            @click="handleEdit(row)"
          >
            Edit
          </el-button>
          <el-button
            type="success"
            size="small"
            @click="handleViewDetail(row)"
          >
            Detail
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 新增/编辑弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="500px"
      @close="handleDialogClose"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="100px"
      >
        <el-form-item
          v-if="isCreate"
          label="Code"
          prop="code"
        >
          <el-input
            v-model="formData.code"
            placeholder="Enter provider code"
            :disabled="!isCreate"
          />
        </el-form-item>
        <el-form-item
          label="Name"
          prop="name"
        >
          <el-input
            v-model="formData.name"
            placeholder="Enter provider name"
          />
        </el-form-item>
        <el-form-item
          label="Status"
          prop="status"
        >
          <el-select
            v-model="formData.status"
            placeholder="Select status"
            style="width: 100%"
          >
            <el-option label="ACTIVE" value="ACTIVE" />
            <el-option label="INACTIVE" value="INACTIVE" />
          </el-select>
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
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  listProviders,
  createProvider,
  updateProvider
} from '../../api/providers'

export default {
  name: 'Providers',
  setup() {
    const router = useRouter()
    const providers = ref([])
    const loading = ref(false)
    const dialogVisible = ref(false)
    const submitting = ref(false)
    const isCreate = ref(true)
    const formRef = ref(null)

    const formData = reactive({
      code: '',
      name: '',
      status: 'ACTIVE'
    })

    const formRules = {
      code: [
        { required: true, message: 'Please enter provider code', trigger: 'blur' }
      ],
      name: [
        { required: true, message: 'Please enter provider name', trigger: 'blur' }
      ],
      status: [
        { required: true, message: 'Please select status', trigger: 'change' }
      ]
    }

    const dialogTitle = computed(() => {
      return isCreate.value ? 'New Provider' : 'Edit Provider'
    })

    // 加载列表
    const loadProviders = async () => {
      loading.value = true
      try {
        const response = await listProviders()
        if (response.data.success) {
          providers.value = response.data.data || []
        } else {
          ElMessage.error(response.data.message || 'Failed to load providers')
        }
      } catch (error) {
        console.error('Failed to load providers', error)
        ElMessage.error('Failed to load providers')
      } finally {
        loading.value = false
      }
    }

    // 打开新增弹窗
    const handleCreate = () => {
      isCreate.value = true
      formData.code = ''
      formData.name = ''
      formData.status = 'ACTIVE'
      dialogVisible.value = true
    }

    // 打开编辑弹窗
    const handleEdit = (row) => {
      isCreate.value = false
      formData.code = row.code
      formData.name = row.name
      formData.status = row.status
      formData.id = row.id
      dialogVisible.value = true
    }

    // 查看详情
    const handleViewDetail = (row) => {
      router.push(`/admin/providers/${row.id}`)
    }

    // 提交表单
    const handleSubmit = async () => {
      if (!formRef.value) return

      await formRef.value.validate(async (valid) => {
        if (!valid) return

        submitting.value = true
        try {
          let response
          if (isCreate.value) {
            response = await createProvider({
              code: formData.code,
              name: formData.name,
              status: formData.status
            })
          } else {
            response = await updateProvider(formData.id, {
              name: formData.name,
              status: formData.status
            })
          }

          if (response.data.success) {
            ElMessage.success(
              isCreate.value ? 'Provider created successfully' : 'Provider updated successfully'
            )
            dialogVisible.value = false
            loadProviders()
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

    // 格式化日期
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
      loadProviders()
    })

    return {
      providers,
      loading,
      dialogVisible,
      submitting,
      isCreate,
      formRef,
      formData,
      formRules,
      dialogTitle,
      handleCreate,
      handleEdit,
      handleViewDetail,
      handleSubmit,
      handleDialogClose,
      formatDate
    }
  }
}
</script>

<style scoped>
.providers {
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

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>
