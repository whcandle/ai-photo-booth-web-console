<template>
  <div class="page">
    <div class="header">
      <h2>{{ t('page.merchantActivitySupervision') }}</h2>
    </div>

    <el-card shadow="never">
      <el-form :inline="true" :model="filters" class="filters" label-width="90px">
        <el-form-item label="Merchant">
          <el-select
            v-model="filters.merchantId"
            placeholder="Select merchant"
            filterable
            clearable
            style="width: 260px"
            @change="onMerchantChange"
          >
            <el-option
              v-for="m in merchants"
              :key="m.id"
              :label="m.name"
              :value="m.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item :label="t('common.search')">
          <el-input
            v-model="filters.q"
            placeholder="name/description"
            clearable
            style="width: 220px"
            @keyup.enter="fetchActivities"
          />
        </el-form-item>

        <el-form-item :label="t('common.status')">
          <el-select v-model="filters.status" placeholder="ALL" clearable style="width: 140px">
            <el-option label="ALL" value="ALL" />
            <el-option label="ACTIVE" value="ACTIVE" />
            <el-option label="INACTIVE" value="INACTIVE" />
          </el-select>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="fetchActivities">{{ t('common.search') }}</el-button>
          <el-button @click="resetFilters">{{ t('common.reset') }}</el-button>
        </el-form-item>
      </el-form>

      <el-table v-loading="loading" :data="activities" style="width: 100%; margin-top: 12px" border>
        <el-table-column prop="id" label="ID" width="90" />
        <el-table-column prop="name" label="Name" min-width="220" show-overflow-tooltip />
        <el-table-column prop="status" label="Status" width="140" />
        <el-table-column label="Start" width="200">
          <template #default="{ row }">
            {{ formatDateTime(row.startAt) }}
          </template>
        </el-table-column>
        <el-table-column label="End" width="200">
          <template #default="{ row }">
            {{ formatDateTime(row.endAt) }}
          </template>
        </el-table-column>
        <el-table-column :label="t('common.actions')" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="openDetail(row)">{{ t('common.view') }}</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination
          background
          layout="total, prev, pager, next"
          :total="totalElements"
          v-model:current-page="pageNum"
          :page-size="pageSize"
          @current-change="fetchActivities"
        />
      </div>
    </el-card>

    <el-dialog
      v-model="detailVisible"
      title="Activity detail"
      width="1000px"
      destroy-on-close
    >
      <el-descriptions v-if="detail" :column="2" border>
        <el-descriptions-item label="ID">{{ detail.id }}</el-descriptions-item>
        <el-descriptions-item label="Name">{{ detail.name }}</el-descriptions-item>
        <el-descriptions-item label="Status">{{ detail.status }}</el-descriptions-item>
        <el-descriptions-item label="Start">{{ formatDateTime(detail.startAt) }}</el-descriptions-item>
        <el-descriptions-item label="End">{{ formatDateTime(detail.endAt) }}</el-descriptions-item>
      </el-descriptions>

      <el-tabs v-model="detailTab" style="margin-top: 14px">
        <el-tab-pane label="Bound Templates" name="templates">
          <el-table :data="boundTemplates" style="width: 100%" border size="small">
            <el-table-column prop="templateName" label="Template" min-width="240" show-overflow-tooltip />
            <el-table-column prop="versionSemver" label="Version" width="200" />
            <el-table-column prop="sortOrder" label="Sort" width="120" />
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="Bound Devices" name="devices">
          <el-table :data="boundDevices" style="width: 100%" border size="small">
            <el-table-column prop="deviceCode" label="Device Code" min-width="220" show-overflow-tooltip />
            <el-table-column prop="name" label="Name" min-width="160" show-overflow-tooltip />
            <el-table-column prop="status" label="Status" width="140" />
            <el-table-column label="Last Seen" width="200">
              <template #default="{ row }">{{ formatDateTime(row.lastSeenAt) }}</template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </el-dialog>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useI18n } from 'vue-i18n'
import {
  listMerchants,
  listMerchantActivities,
  getMerchantActivity,
  getMerchantActivityTemplateVersions,
  getMerchantActivityDevices
} from '../../api/admin/merchants'

const loading = ref(false)
const { t } = useI18n()
const activities = ref([])
const totalElements = ref(0)
const pageNum = ref(1) // 1-based for el-pagination
const pageSize = ref(20)

const merchants = ref([])

const filters = reactive({
  merchantId: null,
  q: '',
  status: 'ALL'
})

const detailVisible = ref(false)
const detailTab = ref('templates')
const detail = ref(null)
const boundTemplates = ref([])
const boundDevices = ref([])

function formatDateTime(v) {
  if (v == null || v === '') return '-'
  const d = typeof v === 'string' ? new Date(v) : null
  if (!d || Number.isNaN(d.getTime())) return String(v)
  return d.toLocaleString()
}

async function fetchMerchantOptions() {
  try {
    const res = await listMerchants({ pageNum: 1, pageSize: 1000 })
    if (res?.data?.success) {
      merchants.value = res.data.data.records || []
    }
  } catch (e) {
    ElMessage.error(e?.response?.data?.message || e.message || 'Failed to load merchants')
  }
}

async function fetchActivities() {
  if (!filters.merchantId) return
  loading.value = true
  try {
    const params = {
      q: filters.q?.trim() || undefined,
      status: filters.status || 'ALL',
      page: pageNum.value - 1,
      size: pageSize.value,
      sort: 'updatedAt',
      direction: 'desc'
    }

    const res = await listMerchantActivities(filters.merchantId, params)
    if (res?.data?.success) {
      const data = res.data.data
      activities.value = data.items || []
      totalElements.value = data.totalElements || 0
    }
  } catch (e) {
    ElMessage.error(e?.response?.data?.message || e.message || 'Failed to load activities')
  } finally {
    loading.value = false
  }
}

function resetFilters() {
  filters.q = ''
  filters.status = 'ALL'
  pageNum.value = 1
  activities.value = []
  totalElements.value = 0
  if (filters.merchantId) fetchActivities()
}

function onMerchantChange() {
  pageNum.value = 1
  fetchActivities()
}

async function openDetail(row) {
  detailTab.value = 'templates'
  detail.value = null
  boundTemplates.value = []
  boundDevices.value = []
  detailVisible.value = true

  try {
    const [activityRes, templatesRes, devicesRes] = await Promise.all([
      getMerchantActivity(filters.merchantId, row.id),
      getMerchantActivityTemplateVersions(filters.merchantId, row.id),
      getMerchantActivityDevices(filters.merchantId, row.id)
    ])

    if (activityRes?.data?.success) {
      detail.value = activityRes.data.data
    }
    if (templatesRes?.data?.success) {
      boundTemplates.value = templatesRes.data.data || []
    }
    if (devicesRes?.data?.success) {
      boundDevices.value = devicesRes.data.data || []
    }
  } catch (e) {
    ElMessage.error(e?.response?.data?.message || e.message || 'Failed to load activity detail')
  }
}

onMounted(async () => {
  await fetchMerchantOptions()
  if (merchants.value.length > 0) {
    filters.merchantId = merchants.value[0].id
    await fetchActivities()
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
</style>

