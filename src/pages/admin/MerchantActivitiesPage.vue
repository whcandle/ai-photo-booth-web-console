<template>
  <div class="page">
    <div class="header">
      <h2>{{ t('page.merchantActivitySupervision') }} - {{ merchantTitle }}</h2>
    </div>
    <el-card shadow="never">
      <el-form :inline="true" :model="filters" class="filters">
        <el-form-item label="Search">
          <el-input v-model="filters.q" placeholder="name/description" clearable style="width: 220px" @keyup.enter="fetchActivities" />
        </el-form-item>
        <el-form-item label="Status">
          <el-select v-model="filters.status" style="width: 140px">
            <el-option label="ALL" value="ALL" />
            <el-option label="ACTIVE" value="ACTIVE" />
            <el-option label="INACTIVE" value="INACTIVE" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchActivities">{{ t('common.search') }}</el-button>
        </el-form-item>
      </el-form>

      <el-table v-loading="loading" :data="activities" border>
        <el-table-column prop="id" label="ID" width="90" />
        <el-table-column prop="name" label="Name" min-width="220" />
        <el-table-column prop="status" label="Status" width="120" />
        <el-table-column label="Start" width="200"><template #default="{ row }">{{ fmt(row.startAt) }}</template></el-table-column>
        <el-table-column label="End" width="200"><template #default="{ row }">{{ fmt(row.endAt) }}</template></el-table-column>
        <el-table-column :label="t('common.actions')" width="120">
          <template #default="{ row }"><el-button link type="primary" @click="openDetail(row)">{{ t('common.view') }}</el-button></template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination background layout="total, prev, pager, next" :total="total" v-model:current-page="pageNum" :page-size="pageSize" @current-change="fetchActivities" />
      </div>
    </el-card>

    <el-dialog v-model="detailVisible" title="Activity detail" width="980px" destroy-on-close>
      <el-descriptions v-if="detail" :column="2" border>
        <el-descriptions-item label="ID">{{ detail.id }}</el-descriptions-item>
        <el-descriptions-item label="Name">{{ detail.name }}</el-descriptions-item>
        <el-descriptions-item label="Status">{{ detail.status }}</el-descriptions-item>
        <el-descriptions-item label="Start">{{ fmt(detail.startAt) }}</el-descriptions-item>
        <el-descriptions-item label="End">{{ fmt(detail.endAt) }}</el-descriptions-item>
      </el-descriptions>
      <el-tabs v-model="tab" style="margin-top: 12px">
        <el-tab-pane label="Bound Templates" name="templates">
          <el-table :data="boundTemplates" border size="small">
            <el-table-column prop="templateName" label="Template" min-width="220" />
            <el-table-column prop="versionSemver" label="Version" width="160" />
            <el-table-column prop="sortOrder" label="Sort" width="100" />
          </el-table>
        </el-tab-pane>
        <el-tab-pane label="Bound Devices" name="devices">
          <el-table :data="boundDevices" border size="small">
            <el-table-column prop="deviceCode" label="Device Code" min-width="220" />
            <el-table-column prop="name" label="Name" min-width="160" />
            <el-table-column prop="status" label="Status" width="120" />
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { getMerchant } from '../../api/admin/merchants'
import { getMerchantActivity, getMerchantActivityDevices, getMerchantActivityTemplateVersions, listMerchantActivities } from '../../api/adminActivities'

const route = useRoute()
const { t } = useI18n()
const merchantId = computed(() => Number(route.params.id))
const merchantTitle = ref(`Merchant #${route.params.id}`)
const loading = ref(false)
const activities = ref([])
const total = ref(0)
const pageNum = ref(1)
const pageSize = ref(20)
const filters = reactive({ q: '', status: 'ALL' })
const detailVisible = ref(false)
const detail = ref(null)
const tab = ref('templates')
const boundTemplates = ref([])
const boundDevices = ref([])

const fmt = (v) => (v ? new Date(v).toLocaleString() : '-')

async function fetchActivities() {
  loading.value = true
  try {
    const res = await listMerchantActivities(merchantId.value, {
      q: filters.q || undefined,
      status: filters.status,
      page: pageNum.value - 1,
      size: pageSize.value
    })
    if (res?.data?.success) {
      activities.value = res.data.data.items || []
      total.value = res.data.data.totalElements || 0
    }
  } catch (e) {
    ElMessage.error(e?.response?.data?.message || e.message || 'Load failed')
  } finally {
    loading.value = false
  }
}

async function openDetail(row) {
  detailVisible.value = true
  detail.value = null
  boundTemplates.value = []
  boundDevices.value = []
  try {
    const [a, t, d] = await Promise.all([
      getMerchantActivity(merchantId.value, row.id),
      getMerchantActivityTemplateVersions(merchantId.value, row.id),
      getMerchantActivityDevices(merchantId.value, row.id)
    ])
    if (a?.data?.success) detail.value = a.data.data
    if (t?.data?.success) boundTemplates.value = t.data.data || []
    if (d?.data?.success) boundDevices.value = d.data.data || []
  } catch (e) {
    ElMessage.error(e?.response?.data?.message || e.message || 'Load detail failed')
  }
}

onMounted(async () => {
  try {
    const m = await getMerchant(merchantId.value)
    if (m?.data?.success) merchantTitle.value = m.data.data?.name || merchantTitle.value
  } catch (_) {}
  await fetchActivities()
})
</script>

<style scoped>
.page { background:#fff; padding:18px; border-radius:8px; }
.header { margin-bottom:12px; }
.pagination { margin-top:14px; display:flex; justify-content:flex-end; }
</style>

