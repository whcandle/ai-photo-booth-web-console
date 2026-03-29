<template>
  <div class="page">
    <div class="header">
      <h2>{{ pageTitle }}</h2>
      <el-button v-if="can('system:user:add')" type="primary" @click="openCreate">
        {{ t('merchant.addUser') }}
      </el-button>
    </div>

    <el-card shadow="never">
      <el-form :inline="true" :model="filters" class="filters" :label-width="labelWidth">
        <el-form-item :label="t('merchant.merchantId')">
          <el-input v-model.number="filters.merchantId" :placeholder="t('merchant.merchantId')" clearable style="width: 160px" />
        </el-form-item>
        <el-form-item :label="t('merchant.email')">
          <el-input v-model="filters.email" :placeholder="t('merchant.email')" clearable style="width: 200px" />
        </el-form-item>
        <el-form-item :label="t('merchant.displayName')">
          <el-input v-model="filters.displayName" :placeholder="t('merchant.displayName')" clearable style="width: 200px" />
        </el-form-item>
        <el-form-item :label="t('common.status')">
          <el-select v-model="filters.status" :placeholder="t('common.status')" clearable style="width: 140px">
            <el-option label="ACTIVE" value="ACTIVE" />
            <el-option label="INACTIVE" value="INACTIVE" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="onSearch">{{ t('common.search') }}</el-button>
          <el-button @click="resetFilters">{{ t('common.reset') }}</el-button>
        </el-form-item>
      </el-form>

      <el-table v-loading="loading" :data="users" style="width: 100%; margin-top: 12px" border>
        <el-table-column prop="id" label="ID" width="90" />
        <el-table-column prop="merchantId" :label="t('merchant.merchantId')" width="110" />
        <el-table-column prop="merchantName" :label="t('menu.merchantList')" min-width="140" show-overflow-tooltip>
          <template #default="{ row }">
            {{ row.merchantName || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="email" label="Email" min-width="200" />
        <el-table-column prop="displayName" :label="t('merchant.displayName')" min-width="140" />
        <el-table-column prop="phone" :label="t('merchant.phone')" width="120">
          <template #default="{ row }">
            {{ row.phone || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="role" :label="t('merchant.role')" width="140" />
        <el-table-column :label="t('common.status')" width="160">
          <template #default="{ row }">
            <el-switch
              v-model="row.status"
              :active-value="'ACTIVE'"
              :inactive-value="'INACTIVE'"
              @change="onToggleStatus(row)"
            />
          </template>
        </el-table-column>
        <el-table-column :label="t('common.actions')" width="360" fixed="right">
          <template #default="{ row }">
            <el-button v-if="can('system:user:edit')" type="primary" link @click="openEdit(row)">
              {{ t('common.edit') }}
            </el-button>
            <el-button v-if="can('system:user:resetPwd')" type="warning" link @click="resetPwd(row)">
              {{ t('merchant.resetPassword') }}
            </el-button>
            <el-button v-if="can('system:user:remove')" type="danger" link @click="deleteUser(row)">
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
          @current-change="fetchUsers"
        />
      </div>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="560px" destroy-on-close>
      <el-form :model="form" label-width="120px" :rules="rules" ref="formRef">
        <el-form-item label="Email" prop="email" v-if="mode === 'create'">
          <el-input v-model="form.email" placeholder="email@example.com" />
        </el-form-item>
        <el-form-item label="Display Name" prop="displayName">
          <el-input v-model="form.displayName" />
        </el-form-item>
        <el-form-item label="Phone">
          <el-input v-model="form.phone" />
        </el-form-item>
        <el-form-item label="Role">
          <el-input :model-value="fixedRole" disabled style="width: 220px" />
        </el-form-item>
        <el-form-item label="Merchant ID" prop="merchantId">
          <el-input v-model.number="form.merchantId" placeholder="Required" />
        </el-form-item>
        <el-form-item label="Status" prop="status">
          <el-select v-model="form.status" style="width: 220px">
            <el-option label="ACTIVE" value="ACTIVE" />
            <el-option label="INACTIVE" value="INACTIVE" />
          </el-select>
        </el-form-item>
        <el-form-item label="Password" prop="password" v-if="mode === 'create'">
          <el-input v-model="form.password" type="password" placeholder="Enter password" />
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">{{ t('common.cancel') }}</el-button>
          <el-button type="primary" :loading="submitting" @click="submitForm">{{ t('common.confirm') }}</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useAuthStore } from '../../store/auth'
import { useI18n } from 'vue-i18n'
import {
  listUsers,
  createUser,
  updateUser,
  deleteUser as deleteUserApi,
  resetUserPassword,
  changeUserStatus
} from '../../api/adminSystemUsers'

const route = useRoute()
const authStore = useAuthStore()
const { t, locale } = useI18n()

const fixedRole = computed(() => route.meta.fixedRole || 'MERCHANT_OWNER')
const pageTitle = computed(() => t(route.meta.pageTitleKey || 'menu.merchantList'))
const labelWidth = computed(() => locale.value === 'zh-CN' ? '100px' : '120px')

function can(perm) {
  return authStore.permissions?.includes('*:*:*') || authStore.permissions?.includes(perm)
}

const loading = ref(false)
const users = ref([])
const total = ref(0)
const pageNum = ref(1)
const pageSize = ref(10)

const filters = reactive({
  merchantId: null,
  email: '',
  displayName: '',
  status: ''
})

const displayedUsers = computed(() => {
  const q = (filters.displayName || '').trim().toLowerCase()
  if (!q) return users.value
  return users.value.filter(
    (u) =>
      u.displayName &&
      String(u.displayName).toLowerCase().includes(q)
  )
})

const dialogVisible = ref(false)
const dialogTitle = ref('')
const mode = ref('create')
const submitting = ref(false)
const formRef = ref(null)

const form = reactive({
  userId: null,
  email: '',
  password: '',
  displayName: '',
  phone: '',
  merchantId: null,
  status: 'ACTIVE'
})

const rules = {
  email: [{ required: true, message: 'Email required', trigger: 'blur' }],
  displayName: [{ required: true, message: 'Display name required', trigger: 'blur' }],
  merchantId: [
    { required: true, message: 'Merchant ID required', trigger: 'blur' },
    { type: 'number', min: 1, message: 'Valid merchant ID required', trigger: 'blur' }
  ],
  status: [{ required: true, message: 'Status required', trigger: 'change' }],
  password: [{ required: true, message: 'Password required', trigger: 'blur' }]
}

let fetchSeq = 0
async function fetchUsers() {
  const seq = ++fetchSeq
  loading.value = true
  try {
    const params = {
      pageNum: pageNum.value,
      pageSize: pageSize.value,
      role: fixedRole.value,
      email: filters.email?.trim() || undefined,
      displayName: filters.displayName?.trim() || undefined,
      status: filters.status || undefined
    }
    if (filters.merchantId != null && filters.merchantId !== '' && !Number.isNaN(Number(filters.merchantId))) {
      params.merchantId = Number(filters.merchantId)
    }
    const res = await listUsers(params)
    // Avoid out-of-order responses when users switch routes quickly.
    if (seq !== fetchSeq) return
    if (res?.data?.success) {
      users.value = res.data.data.records || []
      total.value = res.data.data.total || 0
    }
  } catch (e) {
    if (seq !== fetchSeq) return
    ElMessage.error(e?.response?.data?.message || e.message || 'Failed to load users')
  } finally {
    if (seq === fetchSeq) loading.value = false
  }
}

function onSearch() {
  pageNum.value = 1
  fetchUsers()
}

function resetFilters() {
  filters.merchantId = null
  filters.email = ''
  filters.displayName = ''
  filters.status = ''
  pageNum.value = 1
  fetchUsers()
}

function resetForm() {
  form.userId = null
  form.email = ''
  form.password = ''
  form.displayName = ''
  form.phone = ''
  form.merchantId = null
  form.status = 'ACTIVE'
}

function resetForCurrentRoute() {
  // Reset list state to avoid "owners/staff" switch showing stale data/filters.
  filters.merchantId = null
  filters.email = ''
  filters.displayName = ''
  filters.status = ''
  pageNum.value = 1
  users.value = []
  total.value = 0
  dialogVisible.value = false
  mode.value = 'create'
  resetForm()
}

watch(
  () => route.fullPath,
  async () => {
    resetForCurrentRoute()
    await fetchUsers()
  }
)

function openCreate() {
  mode.value = 'create'
  dialogTitle.value = `Add ${fixedRole.value === 'MERCHANT_OWNER' ? 'merchant admin' : 'merchant staff'}`
  resetForm()
  dialogVisible.value = true
}

function openEdit(row) {
  mode.value = 'edit'
  dialogTitle.value = 'Edit user'
  form.userId = row.id
  form.email = row.email
  form.displayName = row.displayName
  form.phone = row.phone
  form.merchantId = row.merchantId
  form.status = row.status
  dialogVisible.value = true
}

async function submitForm() {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    submitting.value = true
    try {
      if (mode.value === 'create') {
        const res = await createUser({
          email: form.email,
          password: form.password,
          displayName: form.displayName,
          phone: form.phone,
          role: fixedRole.value,
          status: form.status,
          merchantId: form.merchantId
        })
        if (res?.data?.success) {
          ElMessage.success('User created')
          dialogVisible.value = false
          fetchUsers()
        } else {
          ElMessage.error(res?.data?.message || 'Create failed')
        }
      } else {
        const res = await updateUser(form.userId, {
          displayName: form.displayName,
          phone: form.phone,
          role: fixedRole.value,
          status: form.status,
          merchantId: form.merchantId
        })
        if (res?.data?.success) {
          ElMessage.success('User updated')
          dialogVisible.value = false
          fetchUsers()
        } else {
          ElMessage.error(res?.data?.message || 'Update failed')
        }
      }
    } catch (e) {
      ElMessage.error(e?.response?.data?.message || e.message || 'Submit failed')
    } finally {
      submitting.value = false
    }
  })
}

async function onToggleStatus(row) {
  try {
    await changeUserStatus({ userId: row.id, status: row.status })
    ElMessage.success('Status updated')
  } catch (e) {
    ElMessage.error(e?.response?.data?.message || e.message || 'Failed to update status')
  }
}

async function resetPwd(row) {
  try {
    const { value } = await ElMessageBox.prompt('Enter new password', 'Reset Password', {
      confirmButtonText: 'OK',
      cancelButtonText: 'Cancel'
    })
    await resetUserPassword({ userId: row.id, password: value })
    ElMessage.success('Password updated')
  } catch (e) {
    // canceled
  }
}

async function deleteUser(row) {
  ElMessageBox.confirm(`Deactivate user ${row.email}?`, 'Confirm', {
    confirmButtonText: 'OK',
    cancelButtonText: 'Cancel',
    type: 'warning'
  })
    .then(async () => {
      try {
        await deleteUserApi(row.id)
        ElMessage.success('Done')
        fetchUsers()
      } catch (e) {
        ElMessage.error(e?.response?.data?.message || e.message || 'Failed')
      }
    })
    .catch(() => {})
}

onMounted(() => {
  fetchUsers()
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
