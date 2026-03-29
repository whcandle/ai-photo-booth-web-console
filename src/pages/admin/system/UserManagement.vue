<template>
  <div class="page">
    <div class="header">
      <h2>User Management</h2>
      <el-button v-if="can('system:user:add')" type="primary" @click="openCreate">
        Add User
      </el-button>
    </div>

    <el-card shadow="never">
      <el-form :inline="true" :model="filters" class="filters" label-width="90px">
        <el-form-item label="Email">
          <el-input v-model="filters.email" placeholder="Search email" clearable />
        </el-form-item>
        <el-form-item label="Role">
          <el-select v-model="filters.role" placeholder="Role" clearable style="width: 160px">
            <el-option v-for="r in roleOptions" :key="r.roleKey || r.roleName" :label="r.roleName || r.roleKey" :value="r.roleKey" />
          </el-select>
        </el-form-item>
        <el-form-item label="Status">
          <el-select v-model="filters.status" placeholder="Status" clearable style="width: 160px">
            <el-option label="ACTIVE" value="ACTIVE" />
            <el-option label="INACTIVE" value="INACTIVE" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchUsers">Search</el-button>
          <el-button @click="resetFilters">Reset</el-button>
        </el-form-item>
      </el-form>

      <el-table v-loading="loading" :data="users" style="width: 100%; margin-top: 12px" border>
        <el-table-column prop="id" label="ID" width="90" />
        <el-table-column prop="email" label="Email" min-width="200" />
        <el-table-column prop="displayName" label="Display Name" min-width="160" />
        <el-table-column prop="role" label="Role" width="140" />
        <el-table-column label="Status" width="160">
          <template #default="{ row }">
            <el-switch
              v-model="row.status"
              :active-value="'ACTIVE'"
              :inactive-value="'INACTIVE'"
              @change="onToggleStatus(row)"
            />
          </template>
        </el-table-column>
        <el-table-column prop="merchantId" label="Merchant ID" width="140" />
        <el-table-column label="Actions" width="420" fixed="right">
          <template #default="{ row }">
            <el-button v-if="can('system:user:edit')" type="primary" link @click="openEdit(row)">
              Edit
            </el-button>
            <el-button v-if="can('system:user:resetPwd')" type="warning" link @click="resetPwd(row)">
              Reset Password
            </el-button>
            <el-button v-if="can('system:user:remove')" type="danger" link @click="deleteUser(row)">
              Delete
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
      <el-form :model="form" label-width="100px" :rules="rules" ref="formRef">
        <el-form-item label="Email" prop="email" v-if="mode === 'create'">
          <el-input v-model="form.email" placeholder="email@example.com" />
        </el-form-item>
        <el-form-item label="Display Name" prop="displayName">
          <el-input v-model="form.displayName" />
        </el-form-item>
        <el-form-item label="Phone">
          <el-input v-model="form.phone" />
        </el-form-item>
        <el-form-item label="Role" prop="role">
          <el-select v-model="form.role" style="width: 220px" @change="onRoleChange">
            <el-option v-for="r in roleOptions" :key="r.roleKey" :label="r.roleName" :value="r.roleKey" />
          </el-select>
        </el-form-item>
        <el-form-item label="Merchant ID" v-if="form.role !== 'ADMIN'">
          <el-input v-model.number="form.merchantId" placeholder="Merchant ID" />
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
          <el-button @click="dialogVisible = false">Cancel</el-button>
          <el-button type="primary" :loading="submitting" @click="submitForm">
            Confirm
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useAuthStore } from '../../../store/auth'
import { listUsers, createUser, updateUser, deleteUser as deleteUserApi, resetUserPassword, changeUserStatus } from '../../../api/adminSystemUsers'
import { listAllRoles } from '../../../api/adminSystemRoles'

const authStore = useAuthStore()

function can(perm) {
  return authStore.permissions?.includes('*:*:*') || authStore.permissions?.includes(perm)
}

const loading = ref(false)
const users = ref([])
const total = ref(0)
const pageNum = ref(1)
const pageSize = ref(10)

const roleOptions = ref([])

const filters = reactive({
  email: '',
  role: '',
  status: ''
})

const dialogVisible = ref(false)
const dialogTitle = ref('')
const mode = ref('create') // create | edit
const submitting = ref(false)

const formRef = ref(null)
const form = reactive({
  userId: null,
  email: '',
  password: '',
  displayName: '',
  phone: '',
  role: 'ADMIN',
  merchantId: null,
  status: 'ACTIVE'
})

const rules = {
  email: [{ required: true, message: 'Email required', trigger: 'blur' }],
  displayName: [{ required: true, message: 'Display name required', trigger: 'blur' }],
  role: [{ required: true, message: 'Role required', trigger: 'change' }],
  status: [{ required: true, message: 'Status required', trigger: 'change' }],
  password: [{ required: true, message: 'Password required', trigger: 'blur' }]
}

async function fetchRoles() {
  try {
    const res = await listAllRoles()
    if (res?.data?.success) {
      roleOptions.value = res.data.data || []
    }
  } catch (e) {
    // ignore
  }
}

async function fetchUsers() {
  loading.value = true
  try {
    const res = await listUsers({
      pageNum: pageNum.value,
      pageSize: pageSize.value,
      email: filters.email || undefined,
      role: filters.role || undefined,
      status: filters.status || undefined
    })
    if (res?.data?.success) {
      users.value = res.data.data.records || []
      total.value = res.data.data.total || 0
    }
  } catch (e) {
    ElMessage.error(e?.response?.data?.message || e.message || 'Failed to load users')
  } finally {
    loading.value = false
  }
}

function resetFilters() {
  filters.email = ''
  filters.role = ''
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
  form.role = 'ADMIN'
  form.merchantId = null
  form.status = 'ACTIVE'
}

function openCreate() {
  mode.value = 'create'
  dialogTitle.value = 'Add User'
  resetForm()
  dialogVisible.value = true
}

function openEdit(row) {
  mode.value = 'edit'
  dialogTitle.value = 'Edit User'
  form.userId = row.id
  form.email = row.email
  form.displayName = row.displayName
  form.phone = row.phone
  form.role = row.role
  form.merchantId = row.merchantId
  form.status = row.status
  dialogVisible.value = true
}

function onRoleChange() {
  if (form.role === 'ADMIN') {
    form.merchantId = null
  }
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
          role: form.role,
          status: form.status,
          merchantId: form.role === 'ADMIN' ? null : form.merchantId
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
          role: form.role,
          status: form.status,
          merchantId: form.role === 'ADMIN' ? null : form.merchantId
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

async function deleteUserAction(row) {
  await deleteUserApi(row.id)
}

async function deleteUser(row) {
  ElMessageBox.confirm(`Delete user ${row.email}?`, 'Confirm', {
    confirmButtonText: 'Delete',
    cancelButtonText: 'Cancel',
    type: 'warning'
  }).then(async () => {
    try {
      await deleteUserAction(row)
      ElMessage.success('Deleted')
      fetchUsers()
    } catch (e) {
      ElMessage.error(e?.response?.data?.message || e.message || 'Delete failed')
    }
  }).catch(() => {})
}

onMounted(async () => {
  await fetchRoles()
  await fetchUsers()
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

