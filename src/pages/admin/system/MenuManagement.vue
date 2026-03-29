<template>
  <div class="page">
    <div class="header">
      <h2>Menu / Permission Management</h2>
      <el-button v-if="can('system:menu:add')" type="primary" @click="openCreate">Add Menu</el-button>
    </div>

    <el-card shadow="never">
      <el-form :inline="true" :model="filters" class="filters" label-width="90px">
        <el-form-item label="Menu Name">
          <el-input v-model="filters.menuName" placeholder="Search menu name" clearable />
        </el-form-item>
        <el-form-item label="Menu Type">
          <el-select v-model="filters.menuType" placeholder="Type" clearable style="width: 160px">
            <el-option label="M" value="M" />
            <el-option label="C" value="C" />
            <el-option label="F" value="F" />
          </el-select>
        </el-form-item>
        <el-form-item label="Status">
          <el-select v-model="filters.status" placeholder="Status" clearable style="width: 160px">
            <el-option label="ACTIVE" value="ACTIVE" />
            <el-option label="INACTIVE" value="INACTIVE" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchMenus">Search</el-button>
          <el-button @click="resetFilters">Reset</el-button>
        </el-form-item>
      </el-form>

      <el-table v-loading="loading" :data="menus" style="width: 100%; margin-top: 12px" border>
        <el-table-column prop="id" label="ID" width="90" />
        <el-table-column prop="menuName" label="Menu Name" min-width="160" />
        <el-table-column prop="menuType" label="Type" width="90" />
        <el-table-column prop="parentId" label="Parent ID" width="120" />
        <el-table-column prop="path" label="Path" min-width="160" />
        <el-table-column prop="perms" label="Perms" min-width="220" />
        <el-table-column prop="status" label="Status" width="120" />
        <el-table-column label="Actions" width="220" fixed="right">
          <template #default="{ row }">
            <el-button v-if="can('system:menu:edit')" type="primary" link @click="openEdit(row)">
              Edit
            </el-button>
            <el-button v-if="can('system:menu:remove')" type="danger" link @click="deleteMenuAction(row)">
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
          @current-change="fetchMenus"
        />
      </div>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="720px" destroy-on-close>
      <el-form :model="form" label-width="110px" ref="formRef">
        <el-form-item label="Menu Name">
          <el-input v-model="form.menuName" />
        </el-form-item>
        <el-form-item label="Menu Type">
          <el-select v-model="form.menuType" style="width: 220px">
            <el-option value="M" label="Directory (M)" />
            <el-option value="C" label="Menu (C)" />
            <el-option value="F" label="Button (F)" />
          </el-select>
        </el-form-item>
        <el-form-item label="Parent Menu">
          <el-select v-model="form.parentId" style="width: 220px" clearable>
            <el-option :value="0" label="ROOT (0)" />
            <el-option v-for="m in parentOptions" :key="m.id" :value="m.id" :label="`${m.menuName} (${m.menuType})`" />
          </el-select>
        </el-form-item>
        <el-form-item label="Order Num">
          <el-input-number v-model="form.orderNum" :min="0" />
        </el-form-item>

        <el-form-item label="Status">
          <el-select v-model="form.status" style="width: 220px">
            <el-option label="ACTIVE" value="ACTIVE" />
            <el-option label="INACTIVE" value="INACTIVE" />
          </el-select>
        </el-form-item>
        <el-form-item label="Visible">
          <el-select v-model="form.visible" style="width: 220px">
            <el-option label="SHOW" value="SHOW" />
            <el-option label="HIDE" value="HIDE" />
          </el-select>
        </el-form-item>

        <div class="divider" />

        <el-form-item v-if="form.menuType !== 'F'" label="Path">
          <el-input v-model="form.path" placeholder="/admin/xxx" />
        </el-form-item>
        <el-form-item v-if="form.menuType !== 'F'" label="Component">
          <el-input v-model="form.component" placeholder="pages/admin/xxx.vue" />
        </el-form-item>

        <el-form-item v-if="form.menuType === 'F'" label="Perms">
          <el-input v-model="form.perms" placeholder="system:user:add" />
        </el-form-item>
        <el-form-item v-if="form.menuType === 'F'" label="Icon">
          <el-input v-model="form.icon" placeholder="lock" />
        </el-form-item>

        <el-form-item label="Remark">
          <el-input v-model="form.remark" />
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
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { ElMessageBox } from 'element-plus'
import { useAuthStore } from '../../../store/auth'
import { listMenus, listMenuTree, createMenu, updateMenu, deleteMenu } from '../../../api/adminSystemMenus'

const authStore = useAuthStore()
function can(perm) {
  return authStore.permissions?.includes('*:*:*') || authStore.permissions?.includes(perm)
}

const loading = ref(false)
const menus = ref([])
const total = ref(0)
const pageNum = ref(1)
const pageSize = ref(10)

const filters = reactive({
  menuName: '',
  menuType: '',
  status: ''
})

const parentOptions = ref([])

const dialogVisible = ref(false)
const dialogTitle = ref('')
const mode = ref('create') // create | edit
const submitting = ref(false)

const formRef = ref(null)
const form = reactive({
  menuId: null,
  menuName: '',
  parentId: 0,
  orderNum: 0,
  path: '',
  component: '',
  menuType: 'M',
  visible: 'SHOW',
  status: 'ACTIVE',
  perms: '',
  icon: '',
  remark: ''
})

function resetForm() {
  form.menuId = null
  form.menuName = ''
  form.parentId = 0
  form.orderNum = 0
  form.path = ''
  form.component = ''
  form.menuType = 'M'
  form.visible = 'SHOW'
  form.status = 'ACTIVE'
  form.perms = ''
  form.icon = ''
  form.remark = ''
}

async function fetchParentOptions() {
  try {
    const res = await listMenuTree()
    if (res?.data?.success) {
      // parent options shouldn't be buttons
      parentOptions.value = (res.data.data || []).filter(m => m.menuType === 'M' || m.menuType === 'C')
    }
  } catch (e) {
    // ignore
  }
}

async function fetchMenus() {
  loading.value = true
  try {
    const res = await listMenus({
      pageNum: pageNum.value,
      pageSize: pageSize.value,
      menuName: filters.menuName || undefined,
      status: filters.status || undefined,
      menuType: filters.menuType || undefined
    })
    if (res?.data?.success) {
      menus.value = res.data.data.records || []
      total.value = res.data.data.total || 0
    }
  } catch (e) {
    ElMessage.error(e?.response?.data?.message || e.message || 'Failed to load menus')
  } finally {
    loading.value = false
  }
}

function resetFilters() {
  filters.menuName = ''
  filters.menuType = ''
  filters.status = ''
  pageNum.value = 1
  fetchMenus()
}

async function openCreate() {
  mode.value = 'create'
  dialogTitle.value = 'Add Menu'
  resetForm()
  await fetchParentOptions()
  dialogVisible.value = true
}

async function openEdit(row) {
  mode.value = 'edit'
  dialogTitle.value = 'Edit Menu'
  resetForm()
  form.menuId = row.id
  form.menuName = row.menuName
  form.parentId = row.parentId
  form.orderNum = row.orderNum
  form.path = row.path
  form.component = row.component
  form.menuType = row.menuType
  form.visible = row.visible
  form.status = row.status
  form.perms = row.perms
  form.icon = row.icon
  form.remark = row.remark
  await fetchParentOptions()
  dialogVisible.value = true
}

async function submitForm() {
  submitting.value = true
  try {
    const payload = {
      menuName: form.menuName,
      parentId: form.parentId,
      orderNum: form.orderNum,
      path: form.menuType === 'F' ? null : form.path,
      component: form.menuType === 'F' ? null : form.component,
      menuType: form.menuType,
      visible: form.visible,
      status: form.status,
      perms: form.menuType === 'F' ? form.perms : null,
      icon: form.menuType === 'F' ? form.icon : null,
      remark: form.remark
    }
    if (mode.value === 'create') {
      const res = await createMenu(payload)
      if (!res?.data?.success) {
        ElMessage.error(res?.data?.message || 'Create menu failed')
        return
      }
      ElMessage.success('Menu created')
    } else {
      const res = await updateMenu(form.menuId, payload)
      if (!res?.data?.success) {
        ElMessage.error(res?.data?.message || 'Update menu failed')
        return
      }
      ElMessage.success('Menu updated')
    }
    dialogVisible.value = false
    fetchMenus()
  } catch (e) {
    ElMessage.error(e?.response?.data?.message || e.message || 'Submit failed')
  } finally {
    submitting.value = false
  }
}

async function deleteMenuAction(row) {
  try {
    await ElMessageBox.confirm(`Delete menu ${row.menuName}?`, 'Confirm', {
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel',
      type: 'warning'
    })
    await deleteMenu(row.id)
    ElMessage.success('Menu deleted')
    fetchMenus()
  } catch (e) {
    // canceled or error
  }
}

onMounted(async () => {
  await fetchParentOptions()
  await fetchMenus()
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

.divider {
  height: 1px;
  background: #eee;
  margin: 12px 0;
}
</style>

