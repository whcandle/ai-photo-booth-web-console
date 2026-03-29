<template>
  <div class="page">
    <div class="header">
      <h2>{{ t('page.merchantPointsLedger') }} - {{ merchantTitle }}</h2>
      <el-button type="primary" @click="adjustVisible = true">{{ t('common.edit') }} Points</el-button>
    </div>
    <el-card shadow="never">
      <el-table v-loading="loading" :data="records" border>
        <el-table-column prop="id" label="ID" width="90" />
        <el-table-column prop="type" label="Type" width="170" />
        <el-table-column prop="delta" label="Delta" width="120" />
        <el-table-column prop="refType" label="Ref Type" width="140" />
        <el-table-column prop="note" label="Note" min-width="220" />
        <el-table-column label="Created At" width="220"><template #default="{ row }">{{ fmt(row.createdAt) }}</template></el-table-column>
      </el-table>
      <div class="pagination">
        <el-pagination background layout="total, prev, pager, next" :total="total" v-model:current-page="pageNum" :page-size="pageSize" @current-change="fetchData" />
      </div>
    </el-card>
    <el-dialog v-model="adjustVisible" title="Adjust Points" width="500px">
      <el-form :model="adjustForm" label-width="100px">
        <el-form-item label="Delta"><el-input v-model.number="adjustForm.delta" placeholder="+100 / -50" /></el-form-item>
        <el-form-item label="Note"><el-input v-model="adjustForm.note" type="textarea" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="adjustVisible = false">{{ t('common.cancel') }}</el-button>
        <el-button type="primary" :loading="submitting" @click="submitAdjust">{{ t('common.confirm') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { getMerchant } from '../../api/admin/merchants'
import { adjustMerchantPoints, listMerchantPoints } from '../../api/adminPoints'

const route = useRoute()
const { t } = useI18n()
const merchantId = computed(() => Number(route.params.id))
const merchantTitle = ref(`Merchant #${route.params.id}`)
const loading = ref(false)
const records = ref([])
const total = ref(0)
const pageNum = ref(1)
const pageSize = ref(10)
const adjustVisible = ref(false)
const submitting = ref(false)
const adjustForm = reactive({ delta: null, note: '' })
const fmt = (v) => (v ? new Date(v).toLocaleString() : '-')

async function fetchData() {
  loading.value = true
  try {
    const res = await listMerchantPoints(merchantId.value, { pageNum: pageNum.value, pageSize: pageSize.value })
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

async function submitAdjust() {
  submitting.value = true
  try {
    await adjustMerchantPoints(merchantId.value, adjustForm)
    adjustVisible.value = false
    adjustForm.delta = null
    adjustForm.note = ''
    await fetchData()
  } catch (e) {
    ElMessage.error(e?.response?.data?.message || e.message || 'Adjust failed')
  } finally {
    submitting.value = false
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
.header { margin-bottom:12px; display:flex; justify-content:space-between; align-items:center; }
.pagination { margin-top:14px; display:flex; justify-content:flex-end; }
</style>

