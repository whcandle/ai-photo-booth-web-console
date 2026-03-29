<template>
  <div class="page">
    <div class="header">
      <h2>{{ t('page.merchants') }}</h2>
      <el-button type="primary" @click="openCreate">{{ t('merchant.addMerchant') }}</el-button>
    </div>

    <el-card shadow="never">
      <el-form :inline="true" :model="filters" class="filters" :label-width="labelWidth">
        <el-form-item :label="t('common.name')">
          <el-input v-model="filters.name" :placeholder="t('common.name')" clearable style="width: 200px" />
        </el-form-item>
        <el-form-item :label="t('merchant.code')">
          <el-input v-model="filters.code" :placeholder="t('merchant.code')" clearable style="width: 180px" />
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

      <el-table v-loading="loading" :data="merchants" style="width: 100%; margin-top: 8px" border>
        <el-table-column prop="id" :label="t('common.id')" width="90" />
        <el-table-column prop="code" :label="t('merchant.code')" min-width="140" show-overflow-tooltip />
        <el-table-column prop="name" :label="t('common.name')" min-width="160" show-overflow-tooltip />
        <el-table-column :label="t('common.status')" width="120">
          <template #default="{ row }">
            <span :class="row.status === 'ACTIVE' ? 'text-active' : 'text-inactive'">
              {{ row.status }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="contactEmail" :label="t('merchant.contactEmail')" min-width="180" show-overflow-tooltip>
          <template #default="{ row }">
            {{ row.contactEmail || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="country" :label="t('merchant.country')" width="120">
          <template #default="{ row }">
            {{ row.country || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="timezone" :label="t('merchant.timezone')" width="140" show-overflow-tooltip />
        <el-table-column label="Updated" width="180">
          <template #default="{ row }">
            {{ formatDateTime(row.updatedAt) }}
          </template>
        </el-table-column>
        <el-table-column :label="t('common.actions')" width="560" fixed="right">
          <template #default="{ row }">
            <el-button type="info" link @click="openDetail(row)">{{ t('common.view') }}</el-button>
            <el-button type="primary" link @click="openEdit(row)">{{ t('common.edit') }}</el-button>
            <el-button type="primary" link @click="openMerchantActivitiesPage(row)">Activities</el-button>
            <el-button type="primary" link @click="openMerchantSubscriptionsPage(row)">Subscriptions</el-button>
            <el-button type="primary" link @click="openMerchantPointsPage(row)">Points</el-button>
            <el-button type="primary" link @click="openMerchantPaymentsPage(row)">Payments</el-button>
            <el-button
              v-if="row.status === 'INACTIVE'"
              type="success"
              link
              @click="onEnable(row)"
            >
              {{ t('common.enable') }}
            </el-button>
            <el-button
              v-if="row.status === 'ACTIVE'"
              type="warning"
              link
              @click="onDisable(row)"
            >
              {{ t('common.disable') }}
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
          :page-size="pageSize"
          @current-change="fetchMerchants"
        />
      </div>
    </el-card>

    <!-- Create / Edit -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="640px" destroy-on-close @closed="onDialogClosed">
      <el-form :model="form" label-width="140px">
        <el-form-item label="Name" required>
          <el-input v-model="form.name" placeholder="Merchant display name" />
        </el-form-item>
        <el-form-item label="Code">
          <el-input
            v-model="form.code"
            :placeholder="mode === 'create' ? 'Optional; leave empty to auto-generate' : 'Unique merchant code'"
          />
        </el-form-item>
        <el-form-item label="Status">
          <el-select v-model="form.status" style="width: 220px">
            <el-option label="ACTIVE" value="ACTIVE" />
            <el-option label="INACTIVE" value="INACTIVE" />
          </el-select>
        </el-form-item>
        <el-form-item label="Contact name">
          <el-input v-model="form.contactName" />
        </el-form-item>
        <el-form-item label="Contact phone">
          <el-input v-model="form.contactPhone" />
        </el-form-item>
        <el-form-item label="Contact email">
          <el-input v-model="form.contactEmail" type="email" />
        </el-form-item>
        <el-form-item label="Country">
          <el-input v-model="form.country" />
        </el-form-item>
        <el-form-item label="Timezone">
          <el-input v-model="form.timezone" placeholder="e.g. Asia/Shanghai" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">{{ t('common.cancel') }}</el-button>
          <el-button type="primary" :loading="submitting" @click="submitForm">{{ t('common.confirm') }}</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- Detail -->
    <el-dialog v-model="detailVisible" title="Merchant detail" width="980px" destroy-on-close>
      <el-descriptions v-if="detail" :column="1" border>
        <el-descriptions-item label="ID">{{ detail.id }}</el-descriptions-item>
        <el-descriptions-item label="Code">{{ detail.code }}</el-descriptions-item>
        <el-descriptions-item label="Name">{{ detail.name }}</el-descriptions-item>
        <el-descriptions-item label="Status">{{ detail.status }}</el-descriptions-item>
        <el-descriptions-item label="Contact name">{{ detail.contactName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="Contact phone">{{ detail.contactPhone || '-' }}</el-descriptions-item>
        <el-descriptions-item label="Contact email">{{ detail.contactEmail || '-' }}</el-descriptions-item>
        <el-descriptions-item label="Country">{{ detail.country || '-' }}</el-descriptions-item>
        <el-descriptions-item label="Timezone">{{ detail.timezone }}</el-descriptions-item>
        <el-descriptions-item label="Created">{{ formatDateTime(detail.createdAt) }}</el-descriptions-item>
        <el-descriptions-item label="Updated">{{ formatDateTime(detail.updatedAt) }}</el-descriptions-item>
      </el-descriptions>

      <el-tabs v-if="detail" v-model="detailTab" style="margin-top: 12px">
        <el-tab-pane label="Devices" name="devices">
          <div class="section-header">
            <el-button type="primary" link @click="quickCreateDevice">Add Device</el-button>
            <el-button link @click="fetchMerchantDevices(detail.id)">Refresh</el-button>
          </div>
          <el-table v-loading="devicesLoading" :data="merchantDevices" border size="small">
            <el-table-column prop="id" label="ID" width="80" />
            <el-table-column prop="deviceCode" label="Device Code" min-width="140" />
            <el-table-column prop="name" label="Name" min-width="120" />
            <el-table-column prop="status" label="Status" width="100" />
            <el-table-column label="Last Seen" min-width="160">
              <template #default="{ row }">{{ formatDateTime(row.lastSeenAt) }}</template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
        <el-tab-pane label="Activities" name="activities">
          <div class="section-header">
            <el-input v-model="activityFilters.q" placeholder="Search name/description" clearable style="width: 220px" />
            <el-select v-model="activityFilters.status" placeholder="Status" clearable style="width: 140px">
              <el-option label="ALL" value="ALL" />
              <el-option label="ACTIVE" value="ACTIVE" />
              <el-option label="INACTIVE" value="INACTIVE" />
            </el-select>
            <el-button type="primary" link @click="fetchMerchantActivities(detail.id)">Search</el-button>
          </div>
          <el-table v-loading="activitiesLoading" :data="merchantActivities" border size="small">
            <el-table-column prop="id" label="ID" width="80" />
            <el-table-column prop="name" label="Name" min-width="140" />
            <el-table-column prop="status" label="Status" width="100" />
            <el-table-column label="Start" min-width="150">
              <template #default="{ row }">{{ formatDateTime(row.startAt) }}</template>
            </el-table-column>
            <el-table-column label="End" min-width="150">
              <template #default="{ row }">{{ formatDateTime(row.endAt) }}</template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
      </el-tabs>
      <template #footer>
        <el-button type="primary" @click="detailVisible = false">Close</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ElMessage, ElMessageBox } from 'element-plus'
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import {
  listMerchants,
  getMerchant,
  createMerchant,
  updateMerchant,
  enableMerchant,
  disableMerchant,
  listMerchantDevices,
  createMerchantDevice,
  listMerchantActivities
} from '../../api/admin/merchants'

const loading = ref(false)
const router = useRouter()
const { t, locale } = useI18n()
const labelWidth = computed(() => locale.value === 'zh-CN' ? '90px' : '110px')
const merchants = ref([])
const total = ref(0)
const pageNum = ref(1)
const pageSize = ref(10)

const filters = reactive({
  name: '',
  code: '',
  status: ''
})

const dialogVisible = ref(false)
const dialogTitle = ref('')
const submitting = ref(false)
const mode = ref('create')

const form = reactive({
  id: null,
  name: '',
  code: '',
  status: 'ACTIVE',
  contactName: '',
  contactPhone: '',
  contactEmail: '',
  country: '',
  timezone: 'Asia/Shanghai'
})

const detailVisible = ref(false)
const detail = ref(null)
const detailTab = ref('devices')
const merchantDevices = ref([])
const devicesLoading = ref(false)
const merchantActivities = ref([])
const activitiesLoading = ref(false)
const activityFilters = reactive({
  q: '',
  status: 'ALL'
})

function resetForm() {
  form.id = null
  form.name = ''
  form.code = ''
  form.status = 'ACTIVE'
  form.contactName = ''
  form.contactPhone = ''
  form.contactEmail = ''
  form.country = ''
  form.timezone = 'Asia/Shanghai'
}

function onDialogClosed() {
  resetForm()
}

function openCreate() {
  mode.value = 'create'
  dialogTitle.value = 'Add Merchant'
  resetForm()
  dialogVisible.value = true
}

function openEdit(row) {
  mode.value = 'edit'
  dialogTitle.value = 'Edit Merchant'
  resetForm()
  form.id = row.id
  form.name = row.name || ''
  form.code = row.code || ''
  form.status = row.status || 'ACTIVE'
  form.contactName = row.contactName || ''
  form.contactPhone = row.contactPhone || ''
  form.contactEmail = row.contactEmail || ''
  form.country = row.country || ''
  form.timezone = row.timezone || 'Asia/Shanghai'
  dialogVisible.value = true
}

async function openDetail(row) {
  detail.value = null
  detailTab.value = 'devices'
  merchantDevices.value = []
  merchantActivities.value = []
  activityFilters.q = ''
  activityFilters.status = 'ALL'
  detailVisible.value = true
  try {
    const res = await getMerchant(row.id)
    if (res?.data?.success) {
      detail.value = res.data.data
      await Promise.all([
        fetchMerchantDevices(row.id),
        fetchMerchantActivities(row.id)
      ])
    } else {
      ElMessage.error(res?.data?.message || 'Load failed')
      detailVisible.value = false
    }
  } catch (e) {
    ElMessage.error(e?.response?.data?.message || e.message || 'Load failed')
    detailVisible.value = false
  }
}

function openMerchantActivitiesPage(row) {
  router.push(`/admin/merchants/${row.id}/activities`)
}

function openMerchantSubscriptionsPage(row) {
  router.push(`/admin/merchants/${row.id}/subscriptions`)
}

function openMerchantPointsPage(row) {
  router.push(`/admin/merchants/${row.id}/points`)
}

function openMerchantPaymentsPage(row) {
  router.push(`/admin/merchants/${row.id}/payments`)
}

async function fetchMerchantDevices(merchantId) {
  devicesLoading.value = true
  try {
    const res = await listMerchantDevices(merchantId)
    if (res?.data?.success) {
      merchantDevices.value = res.data.data || []
    } else {
      ElMessage.error(res?.data?.message || 'Failed to load devices')
    }
  } catch (e) {
    ElMessage.error(e?.response?.data?.message || e.message || 'Failed to load devices')
  } finally {
    devicesLoading.value = false
  }
}

async function quickCreateDevice() {
  if (!detail.value?.id) return
  try {
    const { value: deviceCode } = await ElMessageBox.prompt('Input device code', 'Add Device', {
      confirmButtonText: 'Next',
      cancelButtonText: 'Cancel'
    })
    const { value: name } = await ElMessageBox.prompt('Input device name (optional)', 'Add Device', {
      confirmButtonText: 'Create',
      cancelButtonText: 'Cancel',
      inputValue: deviceCode
    })
    const res = await createMerchantDevice(detail.value.id, {
      deviceCode,
      name: name || deviceCode
    })
    if (res?.data?.success) {
      ElMessage.success('Device created')
      await fetchMerchantDevices(detail.value.id)
    } else {
      ElMessage.error(res?.data?.message || 'Create device failed')
    }
  } catch (e) {
    // canceled
  }
}

async function fetchMerchantActivities(merchantId) {
  activitiesLoading.value = true
  try {
    const res = await listMerchantActivities(merchantId, {
      q: activityFilters.q?.trim() || undefined,
      status: activityFilters.status || 'ALL',
      page: 0,
      size: 20,
      sort: 'updatedAt',
      direction: 'desc'
    })
    if (res?.data?.success) {
      merchantActivities.value = res.data.data?.records || []
    } else {
      ElMessage.error(res?.data?.message || 'Failed to load activities')
    }
  } catch (e) {
    ElMessage.error(e?.response?.data?.message || e.message || 'Failed to load activities')
  } finally {
    activitiesLoading.value = false
  }
}

function resetFilters() {
  filters.name = ''
  filters.code = ''
  filters.status = ''
  pageNum.value = 1
  fetchMerchants()
}

function onSearch() {
  pageNum.value = 1
  fetchMerchants()
}

async function fetchMerchants() {
  loading.value = true
  try {
    const params = {
      pageNum: pageNum.value,
      pageSize: pageSize.value
    }
    if (filters.name?.trim()) params.name = filters.name.trim()
    if (filters.code?.trim()) params.code = filters.code.trim()
    if (filters.status) params.status = filters.status

    const res = await listMerchants(params)
    if (res?.data?.success) {
      merchants.value = res.data.data.records || []
      total.value = res.data.data.total || 0
    } else {
      ElMessage.error(res?.data?.message || 'Failed to load merchants')
    }
  } catch (e) {
    ElMessage.error(e?.response?.data?.message || e.message || 'Failed to load merchants')
  } finally {
    loading.value = false
  }
}

async function submitForm() {
  if (!form.name?.trim()) {
    ElMessage.warning('Name is required')
    return
  }
  submitting.value = true
  try {
    if (mode.value === 'create') {
      const payload = {
        name: form.name.trim(),
        status: form.status,
        contactName: form.contactName || undefined,
        contactPhone: form.contactPhone || undefined,
        contactEmail: form.contactEmail || undefined,
        country: form.country || undefined,
        timezone: form.timezone?.trim() || undefined
      }
      if (form.code?.trim()) {
        payload.code = form.code.trim()
      }
      const res = await createMerchant(payload)
      if (!res?.data?.success) {
        ElMessage.error(res?.data?.message || 'Create failed')
        return
      }
      ElMessage.success('Merchant created')
    } else {
      const payload = {}
      if (form.name?.trim()) payload.name = form.name.trim()
      if (form.status) payload.status = form.status
      payload.contactName = form.contactName ?? ''
      payload.contactPhone = form.contactPhone ?? ''
      payload.contactEmail = form.contactEmail ?? ''
      payload.country = form.country ?? ''
      if (form.timezone?.trim()) payload.timezone = form.timezone.trim()
      if (form.code?.trim()) {
        payload.code = form.code.trim()
      }
      const res = await updateMerchant(form.id, payload)
      if (!res?.data?.success) {
        ElMessage.error(res?.data?.message || 'Update failed')
        return
      }
      ElMessage.success('Merchant updated')
    }
    dialogVisible.value = false
    await fetchMerchants()
  } catch (e) {
    ElMessage.error(e?.response?.data?.message || e.message || 'Submit failed')
  } finally {
    submitting.value = false
  }
}

async function onEnable(row) {
  try {
    const res = await enableMerchant(row.id)
    if (!res?.data?.success) {
      ElMessage.error(res?.data?.message || 'Enable failed')
      return
    }
    ElMessage.success('Merchant enabled')
    await fetchMerchants()
  } catch (e) {
    ElMessage.error(e?.response?.data?.message || e.message || 'Enable failed')
  }
}

async function onDisable(row) {
  try {
    await ElMessageBox.confirm(`Disable merchant "${row.name}"?`, 'Confirm', {
      confirmButtonText: 'Disable',
      cancelButtonText: 'Cancel',
      type: 'warning'
    })
    const res = await disableMerchant(row.id)
    if (!res?.data?.success) {
      ElMessage.error(res?.data?.message || 'Disable failed')
      return
    }
    ElMessage.success('Merchant disabled')
    await fetchMerchants()
  } catch (e) {
    if (e !== 'cancel') {
      ElMessage.error(e?.response?.data?.message || e.message || 'Disable failed')
    }
  }
}

function formatDateTime(v) {
  if (v == null || v === '') return '-'
  const s = typeof v === 'string' ? v.replace('T', ' ') : String(v)
  return s.length > 19 ? s.slice(0, 19) : s
}

onMounted(() => {
  fetchMerchants()
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
  margin-bottom: 4px;
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

.section-header {
  margin: 8px 0;
  display: flex;
  gap: 8px;
  align-items: center;
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
