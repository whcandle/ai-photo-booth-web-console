<template>
  <div class="page">
    <div class="header">
      <h2>Membership Plans</h2>
      <el-button v-if="can('system:membershipPlan:add')" type="primary" @click="openCreate">
        Add Plan
      </el-button>
    </div>

    <el-card shadow="never">
      <el-table v-loading="loading" :data="plans" style="width: 100%; margin-top: 12px" border>
        <el-table-column prop="id" label="Plan ID" width="120" />
        <el-table-column prop="name" label="Plan Name" min-width="200" />
        <el-table-column prop="durationMonths" label="Duration (Months)" width="180" />
        <el-table-column prop="priceAmount" label="Price (USD)" width="160" />
        <el-table-column prop="includedCredits" label="Included Credits" width="190" />
        <el-table-column label="Status" width="160">
          <template #default="{ row }">
            <span :class="row.status === 'ACTIVE' ? 'text-active' : 'text-inactive'">
              {{ row.status }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="Description / Remark" min-width="220">
          <template #default="{ row }">
            <span v-if="row.description">{{ row.description }}</span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="Actions" width="520" fixed="right">
          <template #default="{ row }">
            <el-button v-if="can('system:membershipPlan:edit')" type="primary" link @click="openEdit(row)">
              Edit
            </el-button>

            <el-button
              v-if="can('system:membershipPlan:changeStatus') && row.status === 'ACTIVE'"
              type="warning"
              link
              @click="changeStatus(row, 'INACTIVE')"
            >
              Deactivate
            </el-button>
            <el-button
              v-if="can('system:membershipPlan:changeStatus') && row.status === 'INACTIVE'"
              type="success"
              link
              @click="changeStatus(row, 'ACTIVE')"
            >
              Activate
            </el-button>

            <el-button
              v-if="can('system:membershipPlan:remove') && row.status === 'ACTIVE'"
              type="danger"
              link
              @click="softDelete(row)"
            >
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
          @current-change="fetchPlans"
        />
      </div>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="760px" destroy-on-close>
      <el-form :model="form" label-width="120px">
        <el-form-item label="Plan Name">
          <el-input v-model="form.name" placeholder="e.g. 1 month basic package" />
        </el-form-item>

        <el-form-item label="Duration (Months)">
          <el-select v-model="form.durationMonths" style="width: 240px">
            <el-option :value="1" label="1" />
            <el-option :value="3" label="3" />
            <el-option :value="6" label="6" />
            <el-option :value="12" label="12" />
          </el-select>
        </el-form-item>

        <el-form-item label="Price (USD)">
          <el-input-number v-model="form.priceAmount" :min="0" :step="0.01" style="width: 240px" />
        </el-form-item>

        <el-form-item label="Included Credits">
          <el-input-number v-model="form.includedCredits" :min="0" :step="1" style="width: 240px" />
        </el-form-item>

        <el-form-item label="Status">
          <el-select v-model="form.status" style="width: 240px">
            <el-option label="ACTIVE" value="ACTIVE" />
            <el-option label="INACTIVE" value="INACTIVE" />
          </el-select>
        </el-form-item>

        <el-form-item label="Description / Remark">
          <el-input type="textarea" v-model="form.description" :rows="4" placeholder="optional" />
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
import { ElMessage, ElMessageBox } from 'element-plus'
import { computed, onMounted, reactive, ref } from 'vue'
import { useAuthStore } from '../../../store/auth'
import {
  listMembershipPlans,
  createMembershipPlan,
  updateMembershipPlan,
  changeMembershipPlanStatus
} from '../../../api/adminMembershipPlans'

const authStore = useAuthStore()

function can(perm) {
  return authStore.permissions?.includes('*:*:*') || authStore.permissions?.includes(perm)
}

const loading = ref(false)
const plans = ref([])
const total = ref(0)
const pageNum = ref(1)
const pageSize = ref(10)

const dialogVisible = ref(false)
const dialogTitle = ref('')
const submitting = ref(false)

const mode = ref('create') // create | edit

const form = reactive({
  planId: null,
  name: '',
  durationMonths: 1,
  priceAmount: 0,
  includedCredits: 0,
  status: 'ACTIVE',
  description: ''
})

function resetForm() {
  form.planId = null
  form.name = ''
  form.durationMonths = 1
  form.priceAmount = 0
  form.includedCredits = 0
  form.status = 'ACTIVE'
  form.description = ''
}

function openCreate() {
  mode.value = 'create'
  dialogTitle.value = 'Add Membership Plan'
  resetForm()
  dialogVisible.value = true
}

function openEdit(row) {
  mode.value = 'edit'
  dialogTitle.value = 'Edit Membership Plan'
  form.planId = row.id
  form.name = row.name
  form.durationMonths = row.durationMonths
  form.priceAmount = row.priceAmount
  form.includedCredits = row.includedCredits
  form.status = row.status
  form.description = row.description || ''
  dialogVisible.value = true
}

async function fetchPlans() {
  loading.value = true
  try {
    const res = await listMembershipPlans({
      pageNum: pageNum.value,
      pageSize: pageSize.value
    })
    if (res?.data?.success) {
      plans.value = res.data.data.records || []
      total.value = res.data.data.total || 0
    }
  } catch (e) {
    ElMessage.error(e?.response?.data?.message || e.message || 'Failed to load membership plans')
  } finally {
    loading.value = false
  }
}

async function submitForm() {
  submitting.value = true
  try {
    const payload = {
      name: form.name,
      durationMonths: form.durationMonths,
      priceAmount: form.priceAmount,
      includedCredits: form.includedCredits,
      status: form.status,
      description: form.description
    }

    if (mode.value === 'create') {
      const res = await createMembershipPlan(payload)
      if (!res?.data?.success) {
        ElMessage.error(res?.data?.message || 'Create failed')
        return
      }
      ElMessage.success('Plan created')
    } else {
      const res = await updateMembershipPlan(form.planId, payload)
      if (!res?.data?.success) {
        ElMessage.error(res?.data?.message || 'Update failed')
        return
      }
      ElMessage.success('Plan updated')
    }

    dialogVisible.value = false
    await fetchPlans()
  } catch (e) {
    ElMessage.error(e?.response?.data?.message || e.message || 'Submit failed')
  } finally {
    submitting.value = false
  }
}

async function changeStatus(row, targetStatus) {
  try {
    await changeMembershipPlanStatus(row.id, { status: targetStatus })
    ElMessage.success('Status updated')
    await fetchPlans()
  } catch (e) {
    ElMessage.error(e?.response?.data?.message || e.message || 'Status update failed')
  }
}

async function softDelete(row) {
  await ElMessageBox.confirm(`Delete "${row.name}" (soft disable)?`, 'Confirm', {
    confirmButtonText: 'Delete',
    cancelButtonText: 'Cancel',
    type: 'warning'
  })
  await changeStatus(row, 'INACTIVE')
}

onMounted(async () => {
  await fetchPlans()
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

.text-active {
  color: #52c41a;
  font-weight: 600;
}

.text-inactive {
  color: #999;
  font-style: italic;
}
</style>

