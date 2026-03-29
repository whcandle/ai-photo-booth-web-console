<template>
  <div class="page">
    <div class="header">
      <h2>{{ t('page.merchantPayments') }} - {{ merchantTitle }}</h2>
    </div>
    <el-card shadow="never">
      <el-table v-loading="loading" :data="records" border>
        <el-table-column prop="id" label="ID" width="90" />
        <el-table-column prop="type" label="Type" width="140" />
        <el-table-column prop="provider" label="Provider" width="130" />
        <el-table-column prop="providerTxnId" label="Txn ID" min-width="180" />
        <el-table-column prop="amount" label="Amount" width="120" />
        <el-table-column prop="currency" label="Currency" width="100" />
        <el-table-column prop="status" label="Status" width="120" />
        <el-table-column label="Paid At" width="190"><template #default="{ row }">{{ fmt(row.paidAt) }}</template></el-table-column>
        <el-table-column :label="t('common.actions')" width="120">
          <template #default="{ row }"><el-button link type="primary" @click="openDetail(row)">{{ t('common.view') }}</el-button></template>
        </el-table-column>
      </el-table>
      <div class="pagination">
        <el-pagination background layout="total, prev, pager, next" :total="total" v-model:current-page="pageNum" :page-size="pageSize" @current-change="fetchData" />
      </div>
    </el-card>
    <el-dialog v-model="detailVisible" title="Payment detail" width="760px">
      <el-descriptions v-if="detail" :column="2" border>
        <el-descriptions-item label="Payment ID">{{ detail.payment?.id }}</el-descriptions-item>
        <el-descriptions-item label="Merchant ID">{{ detail.payment?.merchantId }}</el-descriptions-item>
        <el-descriptions-item label="Type">{{ detail.payment?.type }}</el-descriptions-item>
        <el-descriptions-item label="Status">{{ detail.payment?.status }}</el-descriptions-item>
        <el-descriptions-item label="Subscription Records">{{ detail.subscriptionCount }}</el-descriptions-item>
        <el-descriptions-item label="Points Ledgers">{{ detail.pointsLedgerCount }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { getMerchant } from '../../api/admin/merchants'
import { getPayment, listMerchantPayments } from '../../api/adminPayments'

const route = useRoute()
const { t } = useI18n()
const merchantId = computed(() => Number(route.params.id))
const merchantTitle = ref(`Merchant #${route.params.id}`)
const loading = ref(false)
const records = ref([])
const total = ref(0)
const pageNum = ref(1)
const pageSize = ref(10)
const detailVisible = ref(false)
const detail = ref(null)
const fmt = (v) => (v ? new Date(v).toLocaleString() : '-')

async function fetchData() {
  loading.value = true
  try {
    const res = await listMerchantPayments(merchantId.value, { pageNum: pageNum.value, pageSize: pageSize.value })
    if (res?.data?.success) {
      records.value = res.data.data.records || []
      total.value = res.data.data.total || 0
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
  try {
    const res = await getPayment(row.id)
    if (res?.data?.success) detail.value = res.data.data
  } catch (e) {
    ElMessage.error(e?.response?.data?.message || e.message || 'Load detail failed')
  }
}

onMounted(async () => {
  try {
    const m = await getMerchant(merchantId.value)
    if (m?.data?.success) merchantTitle.value = m.data.data?.name || merchantTitle.value
  } catch (_) {}
  await fetchData()
})
</script>

<style scoped>
.page { background:#fff; padding:18px; border-radius:8px; }
.header { margin-bottom:12px; }
.pagination { margin-top:14px; display:flex; justify-content:flex-end; }
</style>

