<template>
  <div class="page">
    <div class="header">
      <h2>{{ t('page.merchantDeviceOwnership') }}</h2>
    </div>

    <el-card shadow="never">
      <el-form :inline="true" :model="filters" class="filters" label-width="110px">
        <el-form-item label="Merchant ID">
          <el-input v-model.number="filters.merchantId" placeholder="Optional" clearable style="width: 180px" />
        </el-form-item>
        <el-form-item label="Device Code">
          <el-input v-model="filters.deviceCode" placeholder="Contains match" clearable style="width: 220px" />
        </el-form-item>
        <el-form-item label="Status">
          <el-select v-model="filters.status" placeholder="Optional" clearable style="width: 140px">
            <el-option label="ACTIVE" value="ACTIVE" />
            <el-option label="INACTIVE" value="INACTIVE" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchDevices">{{ t('common.search') }}</el-button>
          <el-button @click="resetFilters">{{ t('common.reset') }}</el-button>
        </el-form-item>
      </el-form>

      <el-table v-loading="loading" :data="devices" style="width: 100%; margin-top: 12px" border>
        <el-table-column prop="id" label="ID" width="90" />
        <el-table-column prop="deviceCode" label="Device Code" min-width="160" />
        <el-table-column prop="name" label="Name" min-width="160" show-overflow-tooltip />
        <el-table-column prop="merchantId" label="Merchant ID" width="130" />
        <el-table-column prop="merchantName" label="Merchant" min-width="160" show-overflow-tooltip>
          <template #default="{ row }">
            {{ row.merchantName || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="Status" width="140">
          <template #default="{ row }">
            <el-tag :type="row.status === 'ACTIVE' ? 'success' : 'info'">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="t('common.actions')" width="360" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link v-if="can('system:devices:bind')" @click="openBind(row)">Bind</el-button>
            <el-button type="danger" link v-if="can('system:devices:unbind')" @click="unbind(row)">
              {{ t('common.delete') }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination
          background
          layout="total, prev, pager, next"
          :total="total"
          v-model:current-page="pageNum"
          @current-change="fetchDevices"
        />
      </div>
    </el-card>

    <el-dialog v-model="dialogVisible" title="Bind Device to Merchant" width="520px" destroy-on-close>
      <el-form :model="bindForm" label-width="120px" :rules="rules" ref="bindFormRef">
        <el-form-item label="Merchant ID" prop="merchantId">
          <el-input v-model.number="bindForm.merchantId" placeholder="Required" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">Cancel</el-button>
          <el-button type="primary" :loading="submitting" @click="submitBind">Confirm</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useAuthStore } from '../../store/auth'
import { listAdminDevices, bindDeviceMerchant, unbindDeviceMerchant } from '../../api/admin/devices'
import { useI18n } from 'vue-i18n'

const authStore = useAuthStore()
const { t } = useI18n()

function can(perm) {
  return authStore.permissions?.includes('*:*:*') || authStore.permissions?.includes(perm)
}

const loading = ref(false)
const devices = ref([])
const total = ref(0)
const pageNum = ref(1)
const pageSize = ref(10)

const filters = reactive({
  merchantId: null,
  status: '',
  deviceCode: ''
})

const dialogVisible = ref(false)
const submitting = ref(false)
const bindFormRef = ref(null)

const bindTarget = ref(null)
const bindForm = reactive({
  merchantId: null
})

const rules = {
  merchantId: [{ required: true, message: 'Merchant ID is required', trigger: 'blur' }]
}

async function fetchDevices() {
  loading.value = true
  try {
    const params = {
      pageNum: pageNum.value,
      pageSize: pageSize.value,
      merchantId: filters.merchantId || undefined,
      status: filters.status || undefined,
      deviceCode: filters.deviceCode?.trim() || undefined
    }
    // treat empty => undefined
    if (params.merchantId === null) delete params.merchantId

    const res = await listAdminDevices(params)
    if (res?.data?.success) {
      devices.value = res.data.data.records || []
      total.value = res.data.data.total || 0
    }
  } catch (e) {
    ElMessage.error(e?.response?.data?.message || e.message || 'Failed to load devices')
  } finally {
    loading.value = false
  }
}

function resetFilters() {
  filters.merchantId = null
  filters.status = ''
  filters.deviceCode = ''
  pageNum.value = 1
  fetchDevices()
}

function openBind(row) {
  bindTarget.value = row
  bindForm.merchantId = null
  dialogVisible.value = true
}

async function submitBind() {
  if (!bindFormRef.value) return
  await bindFormRef.value.validate(async (valid) => {
    if (!valid) return
    try {
      submitting.value = true
      await bindDeviceMerchant(bindTarget.value.id, bindForm.merchantId)
      ElMessage.success('Device bound')
      dialogVisible.value = false
      await fetchDevices()
    } catch (e) {
      ElMessage.error(e?.response?.data?.message || e.message || 'Bind failed')
    } finally {
      submitting.value = false
    }
  })
}

async function unbind(row) {
  try {
    await ElMessageBox.confirm(`确认将设备 "${row.deviceCode}" 从商户解绑？`, '确认', {
      confirmButtonText: '解绑',
      cancelButtonText: 'Cancel',
      type: 'warning'
    })
    await unbindDeviceMerchant(row.id)
    ElMessage.success('Device unbound')
    await fetchDevices()
  } catch (e) {
    // cancel
  }
}

onMounted(() => {
  fetchDevices()
})
</script>

<style scoped>
.page {
  background: #fff;
  padding: 18px;
  border-radius: 8px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.filters {
  margin-top: 6px;
}

.pagination {
  margin-top: 14px;
  display: flex;
  justify-content: flex-end;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>

