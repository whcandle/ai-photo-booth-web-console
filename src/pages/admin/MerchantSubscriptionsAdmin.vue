<template>
  <div class="page">
    <div class="header">
      <h2>{{ t('page.merchantSubscriptions') }}</h2>
      <el-button type="primary" :disabled="!filters.merchantId" @click="openCreate">{{ t('common.create') }}</el-button>
    </div>
    <el-card shadow="never">
      <el-form :inline="true" :model="filters" class="filters">
        <el-form-item :label="t('merchant.merchantId')">
          <el-select
            v-model="filters.merchantId"
            :placeholder="t('merchant.merchantId')"
            filterable
            clearable
            style="width: 280px"
            @change="onMerchantChange"
          >
            <el-option v-for="m in merchants" :key="m.id" :label="m.name" :value="m.id" />
          </el-select>
        </el-form-item>
      </el-form>

      <el-table v-loading="loading" :data="records" border style="margin-top: 10px">
        <el-table-column prop="id" :label="t('merchantSubscription.colSubscriptionId')" width="100" />
        <el-table-column prop="plan.name" :label="t('merchantSubscription.colPlanName')" min-width="180" show-overflow-tooltip />
        <el-table-column :label="t('merchantSubscription.colPlanBenefits')" min-width="220" show-overflow-tooltip>
          <template #default="{ row }">{{ planBenefitsText(row) }}</template>
        </el-table-column>
        <el-table-column prop="status" :label="t('merchantSubscription.colStatus')" width="130">
          <template #default="{ row }">
            <el-tag :type="statusTagType(row.status)" size="small">{{ statusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="t('merchantSubscription.colStartAt')" width="190">
          <template #default="{ row }">{{ fmt(row.startAt) }}</template>
        </el-table-column>
        <el-table-column :label="t('merchantSubscription.colEndAt')" width="190">
          <template #default="{ row }">{{ fmt(row.endAt) }}</template>
        </el-table-column>
        <el-table-column :label="t('merchantSubscription.colAutoRenew')" width="110">
          <template #default="{ row }">{{ row.autoRenew ? t('merchantSubscription.yes') : t('merchantSubscription.no') }}</template>
        </el-table-column>
        <el-table-column :label="t('merchantSubscription.colUpdatedAt')" width="190">
          <template #default="{ row }">{{ fmt(row.updatedAt) }}</template>
        </el-table-column>
        <el-table-column :label="t('common.actions')" width="170" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openEdit(row)">{{ t('common.edit') }}</el-button>
            <el-button link type="danger" @click="removeRow(row)">{{ t('common.delete') }}</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination">
        <el-pagination
          background
          layout="total, prev, pager, next"
          :total="total"
          v-model:current-page="pageNum"
          :page-size="pageSize"
          @current-change="fetchData"
        />
      </div>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="dialogTitleText" width="580px">
      <el-form :model="form" label-width="140px">
        <el-form-item :label="t('merchantSubscription.plan')">
          <el-select
            v-model="form.planId"
            :placeholder="t('merchantSubscription.planPlaceholder')"
            filterable
            style="width: 100%"
            @change="onPlanChange"
          >
            <el-option v-for="p in planOptions" :key="p.id" :label="p.name" :value="p.id" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="selectedPlan" :label="t('merchantSubscription.planSummary')">
          <el-descriptions :column="1" border size="small" style="width: 100%">
            <el-descriptions-item :label="t('merchantSubscription.summaryName')">{{ selectedPlan.name }}</el-descriptions-item>
            <el-descriptions-item :label="t('merchantSubscription.summaryDuration')">
              {{ t('merchantSubscription.summaryDurationMonths', { n: selectedPlan.durationMonths }) }}
            </el-descriptions-item>
            <el-descriptions-item :label="t('merchantSubscription.summaryIncludedCredits')">
              {{ selectedPlan.includedCredits ?? 0 }}
            </el-descriptions-item>
            <el-descriptions-item :label="t('merchantSubscription.summaryDescription')">
              {{ selectedPlan.description || '—' }}
            </el-descriptions-item>
          </el-descriptions>
        </el-form-item>
        <el-form-item :label="t('merchantSubscription.colStatus')">
          <el-select v-model="form.status" style="width: 220px">
            <el-option :label="t('merchantSubscription.statusActive')" value="ACTIVE" />
            <el-option :label="t('merchantSubscription.statusCanceled')" value="CANCELED" class="opt-danger" />
            <el-option :label="t('merchantSubscription.statusExpired')" value="EXPIRED" />
            <el-option :label="t('merchantSubscription.statusTrialing')" value="TRIALING" />
          </el-select>
        </el-form-item>
        <el-alert
          v-if="form.status === 'CANCELED'"
          type="warning"
          :closable="false"
          show-icon
          class="status-hint"
          :title="t('merchantSubscription.statusChangeHint')"
        />
        <el-form-item :label="t('merchantSubscription.startAt')">
          <el-date-picker
            v-model="form.startAt"
            type="datetime"
            value-format="YYYY-MM-DDTHH:mm:ss"
            style="width: 100%"
            @change="onStartChange"
          />
        </el-form-item>
        <el-form-item :label="t('merchantSubscription.endAt')">
          <el-date-picker v-model="form.endAt" type="datetime" value-format="YYYY-MM-DDTHH:mm:ss" style="width: 100%" />
          <div class="field-hint">{{ t('merchantSubscription.endAtHint') }}</div>
        </el-form-item>
        <el-form-item :label="t('merchantSubscription.autoRenew')">
          <el-switch v-model="form.autoRenew" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">{{ t('common.cancel') }}</el-button>
        <el-button type="primary" :loading="submitting" @click="submit">{{ t('common.confirm') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { listMerchants } from '../../api/admin/merchants'
import { createMerchantSubscription, deleteSubscription, listMerchantSubscriptions, updateSubscription } from '../../api/adminSubscriptions'
import { listMembershipPlans } from '../../api/adminMembershipPlans'

const { t } = useI18n()
const merchants = ref([])
const filters = reactive({ merchantId: null })
const loading = ref(false)
const records = ref([])
const total = ref(0)
const pageNum = ref(1)
const pageSize = ref(10)
const dialogVisible = ref(false)
const submitting = ref(false)
const editingId = ref(null)
const form = reactive({ planId: null, status: 'ACTIVE', startAt: '', endAt: '', autoRenew: false })
const planOptions = ref([])
const selectedPlan = computed(() => planOptions.value.find((p) => p.id === form.planId) || null)
/** Status when dialog opened; used to confirm transition to CANCELED on submit */
const statusAtDialogOpen = ref('ACTIVE')

const dialogTitleText = computed(() =>
  editingId.value ? t('merchantSubscription.dialogEdit') : t('merchantSubscription.dialogCreate')
)

const fmt = (v) => (v ? new Date(v).toLocaleString() : '—')

function planBenefitsText(row) {
  const plan = row?.plan
  if (!plan) return '—'
  const credits = plan.includedCredits
  const desc = (plan.description || '').trim()
  if (credits == null && !desc) return '—'
  const creditPart = credits != null ? `${t('merchantSubscription.summaryIncludedCredits')}: ${credits}` : ''
  const descPart = desc ? (desc.length > 72 ? `${desc.slice(0, 72)}…` : desc) : ''
  return [creditPart, descPart].filter(Boolean).join(' · ')
}

function statusLabel(code) {
  const map = {
    ACTIVE: 'merchantSubscription.statusActive',
    CANCELED: 'merchantSubscription.statusCanceled',
    EXPIRED: 'merchantSubscription.statusExpired',
    TRIALING: 'merchantSubscription.statusTrialing'
  }
  return t(map[code] || code || '—')
}

function statusTagType(code) {
  if (code === 'CANCELED') return 'danger'
  if (code === 'EXPIRED') return 'info'
  if (code === 'TRIALING') return 'warning'
  return 'success'
}

function resetForm() {
  editingId.value = null
  form.planId = null
  form.status = 'ACTIVE'
  form.startAt = ''
  form.endAt = ''
  form.autoRenew = false
}

async function fetchMerchantOptions() {
  try {
    const res = await listMerchants({ pageNum: 1, pageSize: 1000 })
    if (res?.data?.success) merchants.value = res.data.data.records || []
  } catch (e) {
    ElMessage.error(e?.response?.data?.message || e.message || t('merchantSubscription.msgLoadMerchantsFailed'))
  }
}

async function fetchPlanOptions() {
  try {
    const res = await listMembershipPlans({ pageNum: 1, pageSize: 1000, status: 'ACTIVE' })
    if (res?.data?.success) {
      planOptions.value = res.data.data.records || []
    }
  } catch (e) {
    ElMessage.error(e?.response?.data?.message || e.message || t('merchantSubscription.msgLoadPlansFailed'))
  }
}

async function fetchData() {
  if (!filters.merchantId) return
  loading.value = true
  try {
    const res = await listMerchantSubscriptions(filters.merchantId, { pageNum: pageNum.value, pageSize: pageSize.value })
    if (res?.data?.success) {
      records.value = res.data.data.records || []
      total.value = res.data.data.total || 0
    }
  } catch (e) {
    ElMessage.error(e?.response?.data?.message || e.message || t('merchantSubscription.msgLoadFailed'))
  } finally {
    loading.value = false
  }
}

function onMerchantChange() {
  pageNum.value = 1
  if (!filters.merchantId) {
    records.value = []
    total.value = 0
    return
  }
  fetchData()
}

function openCreate() {
  resetForm()
  form.status = 'ACTIVE'
  statusAtDialogOpen.value = 'ACTIVE'
  dialogVisible.value = true
}

function openEdit(row) {
  editingId.value = row.id
  form.planId = row.plan?.id || null
  form.status = row.status
  form.startAt = row.startAt
  form.endAt = row.endAt
  form.autoRenew = !!row.autoRenew
  statusAtDialogOpen.value = row.status || 'ACTIVE'
  dialogVisible.value = true
}

function formatLocalDateTime(dt) {
  const pad = (n) => String(n).padStart(2, '0')
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}:${pad(dt.getSeconds())}`
}

function onStartChange(value) {
  if (!value || !selectedPlan.value?.durationMonths) return
  const start = new Date(value)
  if (Number.isNaN(start.getTime())) return
  start.setMonth(start.getMonth() + Number(selectedPlan.value.durationMonths))
  form.endAt = formatLocalDateTime(start)
}

function onPlanChange() {
  if (form.startAt) onStartChange(form.startAt)
}

function validateFormTimes() {
  if (!form.startAt || !form.endAt) return true
  const s = new Date(form.startAt).getTime()
  const e = new Date(form.endAt).getTime()
  if (Number.isNaN(s) || Number.isNaN(e)) return true
  if (e < s) {
    ElMessage.warning(t('merchantSubscription.msgEndBeforeStart'))
    return false
  }
  return true
}

async function submit() {
  if (!validateFormTimes()) return
  if (form.status === 'CANCELED' && statusAtDialogOpen.value !== 'CANCELED') {
    try {
      await ElMessageBox.confirm(
        t('merchantSubscription.confirmCancelStatusBody'),
        t('merchantSubscription.confirmCancelStatusTitle'),
        { type: 'warning', confirmButtonText: t('common.confirm'), cancelButtonText: t('common.cancel') }
      )
    } catch {
      return
    }
  }
  submitting.value = true
  try {
    if (editingId.value) {
      await updateSubscription(editingId.value, form)
    } else {
      await createMerchantSubscription(filters.merchantId, form)
    }
    dialogVisible.value = false
    await fetchData()
  } catch (e) {
    ElMessage.error(e?.response?.data?.message || e.message || t('merchantSubscription.msgSubmitFailed'))
  } finally {
    submitting.value = false
  }
}

async function removeRow(row) {
  try {
    await ElMessageBox.confirm(t('merchantSubscription.confirmDeleteBody', { id: row.id }), t('common.confirm'), {
      type: 'warning',
      confirmButtonText: t('common.delete'),
      cancelButtonText: t('common.cancel')
    })
    await deleteSubscription(row.id)
    await fetchData()
  } catch (_) {}
}

onMounted(async () => {
  await fetchMerchantOptions()
  await fetchPlanOptions()
  if (merchants.value.length > 0) {
    filters.merchantId = merchants.value[0].id
    pageNum.value = 1
    await fetchData()
  }
})
</script>

<style scoped>
.page {
  background: #fff;
  padding: 18px;
  border-radius: 8px;
}
.header {
  margin-bottom: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.pagination {
  margin-top: 14px;
  display: flex;
  justify-content: flex-end;
}
.field-hint {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-top: 6px;
  line-height: 1.4;
}
.status-hint {
  margin-bottom: 12px;
}
:deep(.opt-danger) {
  color: var(--el-color-danger);
}
</style>
