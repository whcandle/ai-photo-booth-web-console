<template>
  <div class="page">
    <div class="header">
      <h2>Pricing Rules</h2>
      <el-button v-if="can('system:pricingRule:add')" type="primary" @click="openCreate">
        Add Rule
      </el-button>
    </div>

    <el-card shadow="never">
      <el-table v-loading="loading" :data="rules" style="width: 100%" border>
        <el-table-column prop="id" label="ID" width="90" />
        <el-table-column prop="itemType" label="Item Type" width="120" />
        <el-table-column prop="creditsPerItem" label="Credits / Item" width="160" />
        <el-table-column label="Effective From" width="200">
          <template #default="{ row }">
            <span v-if="row.effectiveFrom">{{ formatDateTime(row.effectiveFrom) }}</span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="Effective To" width="200">
          <template #default="{ row }">
            <span v-if="row.effectiveTo">{{ formatDateTime(row.effectiveTo) }}</span>
            <span v-else>Permanent</span>
          </template>
        </el-table-column>
        <el-table-column label="Current Status" width="150">
          <template #default="{ row }">
            <span :class="getStatusClass(row)">
              {{ isActiveNow(row) ? 'ACTIVE' : 'INACTIVE' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="Actions" width="360" fixed="right">
          <template #default="{ row }">
            <el-button v-if="can('system:pricingRule:edit')" type="primary" link @click="openEdit(row)">
              Edit
            </el-button>
            <el-button
              v-if="can('system:pricingRule:deactivate')"
              type="warning"
              link
              :disabled="!isRuleDeactivatable(row)"
              @click="deactivateRow(row)"
            >
              Deactivate
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
          @current-change="fetchRules"
        />
      </div>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="720px" destroy-on-close>
      <el-form :model="form" label-width="160px">
        <el-form-item label="Item Type">
          <el-select v-model="form.itemType" style="width: 220px">
            <el-option label="IMAGE" value="IMAGE" />
            <el-option label="VIDEO" value="VIDEO" />
          </el-select>
        </el-form-item>

        <el-form-item label="Credits / Item">
          <el-input-number v-model="form.creditsPerItem" :min="1" :step="1" />
        </el-form-item>

        <el-form-item label="Effective From">
          <input type="datetime-local" v-model="form.effectiveFrom" />
        </el-form-item>

        <el-form-item label="Effective To (optional)">
          <input type="datetime-local" v-model="form.effectiveTo" />
          <div class="hint">Leave empty for Permanent</div>
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
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useAuthStore } from '../../../store/auth'
import {
  listPricingRules,
  createPricingRule,
  updatePricingRule,
  deactivatePricingRule
} from '../../../api/adminPricingRules'

const authStore = useAuthStore()

function can(perm) {
  return authStore.permissions?.includes('*:*:*') || authStore.permissions?.includes(perm)
}

const loading = ref(false)
const rules = ref([])
const total = ref(0)
const pageNum = ref(1)
const pageSize = ref(10)

// Optional filter for UI. (Global-only, so no merchant selection)
const filters = reactive({
  itemType: ''
})

const dialogVisible = ref(false)
const dialogTitle = ref('')
const submitting = ref(false)

const form = reactive({
  ruleId: null,
  itemType: 'IMAGE',
  creditsPerItem: 1,
  effectiveFrom: '',
  effectiveTo: ''
})

function resetForm() {
  form.ruleId = null
  form.itemType = 'IMAGE'
  form.creditsPerItem = 1
  form.effectiveFrom = ''
  form.effectiveTo = ''
}

function pad2(n) {
  return String(n).padStart(2, '0')
}

// Convert ISO string from backend to datetime-local input value.
function toDateTimeLocalValue(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const yyyy = d.getFullYear()
  const mm = pad2(d.getMonth() + 1)
  const dd = pad2(d.getDate())
  const hh = pad2(d.getHours())
  const mi = pad2(d.getMinutes())
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`
}

function formatDateTime(iso) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString()
}

function toIsoOrNull(datetimeLocalValue) {
  if (!datetimeLocalValue) return null
  const d = new Date(datetimeLocalValue)
  if (Number.isNaN(d.getTime())) return null
  return d.toISOString()
}

function isActiveNow(row) {
  const now = new Date()
  const to = row.effectiveTo ? new Date(row.effectiveTo) : null
  if (!to) return true
  return to.getTime() > now.getTime()
}

function getStatusClass(row) {
  return isActiveNow(row) ? 'text-active' : 'text-inactive'
}

function isRuleDeactivatable(row) {
  // If effectiveTo is already set in the past (or already non-null), deactivate again is unnecessary.
  return !!row.effectiveTo === false || (new Date(row.effectiveTo).getTime() > Date.now())
}

async function fetchRules(page = pageNum.value) {
  loading.value = true
  try {
    const res = await listPricingRules({
      pageNum: page,
      pageSize: pageSize.value,
      itemType: filters.itemType || undefined
    })
    if (res?.data?.success) {
      rules.value = res.data.data.records || []
      total.value = res.data.data.total || 0
    }
  } catch (e) {
    ElMessage.error(e?.response?.data?.message || e.message || 'Failed to load pricing rules')
  } finally {
    loading.value = false
  }
}

function openCreate() {
  dialogTitle.value = 'Add Pricing Rule'
  resetForm()
  dialogVisible.value = true
}

function openEdit(row) {
  dialogTitle.value = 'Edit Pricing Rule'
  form.ruleId = row.id
  form.itemType = row.itemType
  form.creditsPerItem = row.creditsPerItem
  form.effectiveFrom = toDateTimeLocalValue(row.effectiveFrom)
  form.effectiveTo = toDateTimeLocalValue(row.effectiveTo)
  dialogVisible.value = true
}

async function submitForm() {
  if (!form.itemType || !form.effectiveFrom) {
    ElMessage.warning('Please fill itemType and effectiveFrom')
    return
  }
  submitting.value = true
  try {
    const payload = {
      itemType: form.itemType,
      creditsPerItem: form.creditsPerItem,
      effectiveFrom: toIsoOrNull(form.effectiveFrom),
      effectiveTo: toIsoOrNull(form.effectiveTo)
    }

    if (form.ruleId) {
      const res = await updatePricingRule(form.ruleId, payload)
      if (res?.data?.success) {
        ElMessage.success('Rule updated')
      } else {
        ElMessage.error(res?.data?.message || 'Update failed')
        return
      }
    } else {
      const res = await createPricingRule(payload)
      if (res?.data?.success) {
        ElMessage.success('Rule created')
      } else {
        ElMessage.error(res?.data?.message || 'Create failed')
        return
      }
    }

    dialogVisible.value = false
    await fetchRules()
  } catch (e) {
    ElMessage.error(e?.response?.data?.message || e.message || 'Submit failed')
  } finally {
    submitting.value = false
  }
}

async function deactivateRow(row) {
  ElMessageBox.confirm(`Deactivate rule ${row.id}?`, 'Confirm', {
    confirmButtonText: 'Deactivate',
    cancelButtonText: 'Cancel',
    type: 'warning'
  })
    .then(async () => {
      try {
        const res = await deactivatePricingRule(row.id)
        if (res?.data?.success) {
          ElMessage.success('Rule deactivated')
          await fetchRules()
        } else {
          ElMessage.error(res?.data?.message || 'Deactivate failed')
        }
      } catch (e) {
        ElMessage.error(e?.response?.data?.message || e.message || 'Deactivate failed')
      }
    })
    .catch(() => {})
}

onMounted(async () => {
  await fetchRules()
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

.hint {
  margin-top: 6px;
  font-size: 12px;
  color: #888;
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

