<template>
  <div class="page">
    <div class="header">
      <h2>Role Management</h2>
      <el-button v-if="can('system:role:add')" type="primary" @click="openCreate">Add Role</el-button>
    </div>

    <el-card shadow="never">
      <el-form :inline="true" :model="filters" class="filters" label-width="90px">
        <el-form-item label="Role Name">
          <el-input v-model="filters.roleName" placeholder="Search role name" clearable />
        </el-form-item>
        <el-form-item label="Status">
          <el-select v-model="filters.status" placeholder="Status" clearable style="width: 160px">
            <el-option label="ACTIVE" value="ACTIVE" />
            <el-option label="INACTIVE" value="INACTIVE" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchRoles">Search</el-button>
          <el-button @click="resetFilters">Reset</el-button>
        </el-form-item>
      </el-form>

      <el-table v-loading="loading" :data="roles" style="width: 100%; margin-top: 12px" border>
        <el-table-column prop="id" label="ID" width="90" />
        <el-table-column prop="roleName" label="Role Name" min-width="200" />
        <el-table-column prop="roleKey" label="Role Key" min-width="180" />
        <el-table-column prop="roleSort" label="Sort" width="100" />
        <el-table-column prop="status" label="Status" width="140" />
        <el-table-column label="Actions" width="280" fixed="right">
          <template #default="{ row }">
            <el-button v-if="can('system:role:edit')" type="primary" link @click="openEdit(row)">
              Edit
            </el-button>
            <el-button v-if="can('system:role:remove')" type="danger" link @click="deleteRoleAction(row)">
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
          @current-change="fetchRoles"
        />
      </div>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="700px" destroy-on-close>
      <el-form :model="form" label-width="100px" ref="formRef">
        <el-form-item label="Role Name">
          <el-input v-model="form.roleName" />
        </el-form-item>
        <el-form-item label="Role Key">
          <el-input v-model="form.roleKey" :disabled="mode === 'edit'" />
        </el-form-item>
        <el-form-item label="Sort">
          <el-input-number v-model="form.roleSort" :min="0" />
        </el-form-item>
        <el-form-item label="Status">
          <el-select v-model="form.status" style="width: 220px">
            <el-option label="ACTIVE" value="ACTIVE" />
            <el-option label="INACTIVE" value="INACTIVE" />
          </el-select>
        </el-form-item>
        <el-form-item label="Remark">
          <el-input v-model="form.remark" />
        </el-form-item>

        <el-divider />

        <div class="field-title">Menu Permissions</div>
        <el-form-item label="Menu IDs">
          <el-select
            v-model="selectedMenuIds"
            multiple
            collapse-tags
            placeholder="Select menus/buttons"
            style="width: 100%"
          >
            <el-option v-for="m in menuOptions" :key="m.id" :label="`${m.menuName} (${m.menuType})`" :value="m.id" />
          </el-select>
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">Cancel</el-button>
          <el-button type="primary" :loading="submitting" @click="submitForm">Confirm</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ElMessage } from 'element-plus'
import { computed, onMounted, reactive, ref } from 'vue'
import { useAuthStore } from '../../../store/auth'
import {
  listRoles,
  listAllRoles,
  createRole,
  updateRole,
  deleteRole,
  getRoleMenuIds,
  setRoleMenuIds
} from '../../../api/adminSystemRoles'
import { listMenuTree } from '../../../api/adminSystemMenus'
import { ElMessageBox } from 'element-plus'

const authStore = useAuthStore()
const loading = ref(false)
const roles = ref([])
const total = ref(0)
const pageNum = ref(1)
const pageSize = ref(10)

const filters = reactive({
  roleName: '',
  status: ''
})

const dialogVisible = ref(false)
const dialogTitle = ref('')
const mode = ref('create')
const submitting = ref(false)
const formRef = ref(null)

const form = reactive({
  roleId: null,
  roleName: '',
  roleKey: '',
  roleSort: 0,
  status: 'ACTIVE',
  remark: ''
})

const menuOptions = ref([])
const selectedMenuIds = ref([])

function can(perm) {
  return authStore.permissions?.includes('*:*:*') || authStore.permissions?.includes(perm)
}

async function fetchMenuOptions() {
  try {
    const res = await listMenuTree()
    if (res?.data?.success) {
      menuOptions.value = res.data.data || []
    }
  } catch (e) {
    // ignore
  }
}

async function fetchRoles() {
  loading.value = true
  try {
    const res = await listRoles({
      pageNum: pageNum.value,
      pageSize: pageSize.value,
      roleName: filters.roleName || undefined,
      status: filters.status || undefined
    })
    if (res?.data?.success) {
      roles.value = res.data.data.records || []
      total.value = res.data.data.total || 0
    }
  } catch (e) {
    ElMessage.error(e?.response?.data?.message || e.message || 'Failed to load roles')
  } finally {
    loading.value = false
  }
}

function resetFilters() {
  filters.roleName = ''
  filters.status = ''
  pageNum.value = 1
  fetchRoles()
}

function resetForm() {
  form.roleId = null
  form.roleName = ''
  form.roleKey = ''
  form.roleSort = 0
  form.status = 'ACTIVE'
  form.remark = ''
  selectedMenuIds.value = []
}

async function openCreate() {
  mode.value = 'create'
  dialogTitle.value = 'Add Role'
  resetForm()
  await fetchMenuOptions()
  dialogVisible.value = true
}

async function openEdit(row) {
  mode.value = 'edit'
  dialogTitle.value = 'Edit Role'
  resetForm()
  form.roleId = row.id
  form.roleName = row.roleName
  form.roleKey = row.roleKey
  form.roleSort = row.roleSort
  form.status = row.status
  form.remark = row.remark

  await fetchMenuOptions()
  try {
    const res = await getRoleMenuIds(row.id)
    if (res?.data?.success) {
      selectedMenuIds.value = res.data.data || []
    }
  } catch (e) {
    // ignore
  }

  dialogVisible.value = true
}

async function submitForm() {
  submitting.value = true
  try {
    if (mode.value === 'create') {
      const res = await createRole({
        roleName: form.roleName,
        roleKey: form.roleKey,
        roleSort: form.roleSort,
        status: form.status,
        remark: form.remark
      })
      if (!res?.data?.success) {
        ElMessage.error(res?.data?.message || 'Create role failed')
        return
      }
      const created = res.data.data
      await setRoleMenuIds(created.id, { menuIds: selectedMenuIds.value })
      ElMessage.success('Role created')
    } else {
      const res = await updateRole(form.roleId, {
        roleName: form.roleName,
        roleKey: form.roleKey,
        roleSort: form.roleSort,
        status: form.status,
        remark: form.remark
      })
      if (!res?.data?.success) {
        ElMessage.error(res?.data?.message || 'Update role failed')
        return
      }
      await setRoleMenuIds(form.roleId, { menuIds: selectedMenuIds.value })
      ElMessage.success('Role updated')
    }
    dialogVisible.value = false
    fetchRoles()
  } catch (e) {
    ElMessage.error(e?.response?.data?.message || e.message || 'Submit failed')
  } finally {
    submitting.value = false
  }
}

async function deleteRoleAction(row) {
  try {
    await ElMessageBox.confirm(`Delete role ${row.roleName}?`, 'Confirm', {
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel',
      type: 'warning'
    })
    await deleteRole(row.id)
    ElMessage.success('Role deleted')
    fetchRoles()
  } catch (e) {
    // canceled or error
  }
}

onMounted(async () => {
  await fetchMenuOptions()
  await fetchRoles()
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

.field-title {
  font-weight: 600;
  margin-bottom: 6px;
}
</style>

