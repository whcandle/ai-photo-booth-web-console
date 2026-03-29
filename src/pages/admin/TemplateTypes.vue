<template>
  <div class="template-types-page">
    <div class="header">
      <h1>{{ t('templateTypes.title') }}</h1>
      <el-button type="primary" @click="openCreate">{{ t('templateTypes.add') }}</el-button>
    </div>

    <el-card shadow="never">
      <div class="toolbar toolbar-search">
        <span class="toolbar-label">{{ t('templateTypes.keyword') }}</span>
        <el-input
          v-model="keyword"
          clearable
          :placeholder="t('templateTypes.searchPlaceholder')"
          class="search-input"
          @clear="onSearchClear"
          @keyup.enter="applySearch"
        >
          <template #append>
            <el-button type="primary" @click="applySearch">{{ t('templateTypes.search') }}</el-button>
          </template>
        </el-input>
      </div>

      <el-table
        v-loading="loading"
        :data="pagedRows"
        style="width: 100%; margin-top: 12px"
        border
        :empty-text="t('templateTypes.empty')"
        :default-sort="{ prop: 'sortOrder', order: 'ascending' }"
        @sort-change="handleSortChange"
      >
        <el-table-column prop="id" :label="t('templateTypes.colId')" width="90" sortable="custom" />
        <el-table-column prop="code" :label="t('templateTypes.colCode')" min-width="140" show-overflow-tooltip sortable="custom" />
        <el-table-column prop="name" :label="t('templateTypes.colName')" min-width="140" show-overflow-tooltip sortable="custom" />
        <el-table-column prop="description" :label="t('templateTypes.colDescription')" min-width="200" show-overflow-tooltip>
          <template #default="{ row }">
            {{ row.description || '—' }}
          </template>
        </el-table-column>
        <el-table-column :label="t('templateTypes.colEnabled')" width="110" align="center">
          <template #default="{ row }">
            <el-switch
              :model-value="row.enabled"
              :loading="row._toggling"
              inline-prompt
              :active-text="t('templateTypes.switchOn')"
              :inactive-text="t('templateTypes.switchOff')"
              @change="(val) => onEnabledSwitch(row, val)"
            />
          </template>
        </el-table-column>
        <el-table-column prop="sortOrder" :label="t('templateTypes.colSortOrder')" width="120" align="center" sortable="custom" />
        <el-table-column :label="t('templateTypes.colAction')" width="160" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="openEdit(row)">{{ t('common.edit') }}</el-button>
            <el-button type="danger" link @click="confirmDelete(row)">{{ t('common.delete') }}</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrap">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="sortedRows.length"
          background
          @size-change="onPageSizeChange"
        />
      </div>
    </el-card>

    <el-dialog
      v-model="dialogVisible"
      :title="isCreate ? t('templateTypes.createTitle') : t('templateTypes.editTitle')"
      width="580px"
      destroy-on-close
      @closed="resetForm"
    >
      <el-form :model="form" label-width="160px">
        <el-form-item :label="t('templateTypes.fieldCode')" :required="isCreate">
          <el-input v-model="form.code" :disabled="!isCreate" :placeholder="t('templateTypes.placeholderCode')" />
        </el-form-item>
        <el-form-item :label="t('templateTypes.fieldName')" required>
          <el-input v-model="form.name" :placeholder="t('templateTypes.placeholderName')" />
        </el-form-item>
        <el-form-item :label="t('templateTypes.fieldDescription')">
          <el-input v-model="form.description" type="textarea" :rows="3" :placeholder="t('templateTypes.placeholderOptional')" />
        </el-form-item>
        <el-form-item :label="t('templateTypes.fieldStrategyKey')">
          <el-input v-model="form.strategyKey" placeholder="strategyKey" clearable />
        </el-form-item>
        <el-form-item :label="t('templateTypes.fieldSchemaKey')">
          <el-input v-model="form.designerSchemaKey" placeholder="designerSchemaKey" clearable />
        </el-form-item>
        <el-form-item :label="t('templateTypes.fieldEnabled')">
          <el-switch
            v-model="form.enabled"
            inline-prompt
            :active-text="t('templateTypes.switchOn')"
            :inactive-text="t('templateTypes.switchOff')"
          />
        </el-form-item>
        <el-form-item :label="t('templateTypes.fieldSortOrder')">
          <el-input-number v-model="form.sortOrder" :min="0" :step="1" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">{{ t('common.cancel') }}</el-button>
        <el-button type="primary" :loading="saving" @click="submitForm">
          {{ isCreate ? t('templateTypes.btnCreate') : t('templateTypes.btnSave') }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  listTemplateTypes,
  createTemplateType,
  updateTemplateType,
  setTemplateTypeEnabled,
  deleteTemplateType
} from '../../api/adminTemplateTypes'

export default {
  name: 'TemplateTypes',
  setup() {
    const { t } = useI18n()
    const rawRows = ref([])
    const keyword = ref('')
    const keywordApplied = ref('')
    const loading = ref(false)
    const dialogVisible = ref(false)
    const isCreate = ref(true)
    const saving = ref(false)
    const currentPage = ref(1)
    const pageSize = ref(10)
    const sortProp = ref('sortOrder')
    const sortOrder = ref('ascending')

    const form = reactive({
      id: null,
      code: '',
      name: '',
      description: '',
      strategyKey: '',
      designerSchemaKey: '',
      enabled: true,
      sortOrder: 0
    })

    // Client filter on code / name only; does not filter by enabled (dropdowns use enabledOnly elsewhere).
    const filteredRows = computed(() => {
      const k = keywordApplied.value.trim().toLowerCase()
      if (!k) {
        return rawRows.value
      }
      return rawRows.value.filter((r) => {
        const code = (r.code || '').toLowerCase()
        const name = (r.name || '').toLowerCase()
        return code.includes(k) || name.includes(k)
      })
    })

    const sortedRows = computed(() => {
      const list = [...filteredRows.value]
      const prop = sortProp.value
      const order = sortOrder.value
      if (!prop || !order) {
        return list
      }
      list.sort((a, b) => {
        let va = a[prop]
        let vb = b[prop]
        if (prop === 'sortOrder' || prop === 'id') {
          va = Number(va) || 0
          vb = Number(vb) || 0
          if (va === vb) {
            return String(a.code || '').localeCompare(String(b.code || ''))
          }
        } else {
          va = String(va || '').toLowerCase()
          vb = String(vb || '').toLowerCase()
        }
        const cmp = va < vb ? -1 : va > vb ? 1 : 0
        return order === 'ascending' ? cmp : -cmp
      })
      return list
    })

    const pagedRows = computed(() => {
      const start = (currentPage.value - 1) * pageSize.value
      return sortedRows.value.slice(start, start + pageSize.value)
    })

    watch(
      () => keywordApplied.value,
      () => {
        currentPage.value = 1
      }
    )

    function handleSortChange({ prop, order }) {
      if (!prop) {
        return
      }
      sortProp.value = prop
      sortOrder.value = order || 'ascending'
    }

    function applySearch() {
      keywordApplied.value = keyword.value
    }

    function onSearchClear() {
      keyword.value = ''
      keywordApplied.value = ''
    }

    function onPageSizeChange() {
      currentPage.value = 1
    }

    async function fetchList() {
      loading.value = true
      try {
        const res = await listTemplateTypes()
        if (!res?.data?.success) {
          ElMessage.error(res?.data?.message || t('templateTypes.msgLoadFailed'))
          rawRows.value = []
          return
        }
        const list = res.data.data
        rawRows.value = Array.isArray(list)
          ? list.map((r) => ({ ...r, _toggling: false }))
          : []
      } catch (e) {
        ElMessage.error(e?.response?.data?.message || e.message || t('templateTypes.msgLoadFailed'))
        rawRows.value = []
      } finally {
        loading.value = false
      }
    }

    function openCreate() {
      isCreate.value = true
      form.id = null
      form.code = ''
      form.name = ''
      form.description = ''
      form.strategyKey = ''
      form.designerSchemaKey = ''
      form.enabled = true
      form.sortOrder = 0
      dialogVisible.value = true
    }

    function openEdit(row) {
      isCreate.value = false
      form.id = row.id
      form.code = row.code || ''
      form.name = row.name || ''
      form.description = row.description ?? ''
      form.strategyKey = row.strategyKey ?? ''
      form.designerSchemaKey = row.designerSchemaKey ?? ''
      form.enabled = !!row.enabled
      form.sortOrder = row.sortOrder ?? 0
      dialogVisible.value = true
    }

    function resetForm() {
      form.id = null
      form.code = ''
      form.name = ''
      form.description = ''
      form.strategyKey = ''
      form.designerSchemaKey = ''
      form.enabled = true
      form.sortOrder = 0
    }

    function trimOrNull(s) {
      if (s == null || String(s).trim() === '') {
        return null
      }
      return String(s).trim()
    }

    async function submitForm() {
      if (isCreate.value) {
        const code = (form.code || '').trim()
        if (!code) {
          ElMessage.warning(t('templateTypes.msgCodeRequired'))
          return
        }
        const name = (form.name || '').trim()
        if (!name) {
          ElMessage.warning(t('templateTypes.msgNameRequired'))
          return
        }
      } else if (!(form.name || '').trim()) {
        ElMessage.warning(t('templateTypes.msgNameRequired'))
        return
      }

      saving.value = true
      try {
        if (isCreate.value) {
          const payload = {
            code: (form.code || '').trim(),
            name: (form.name || '').trim(),
            description: trimOrNull(form.description),
            strategyKey: trimOrNull(form.strategyKey),
            designerSchemaKey: trimOrNull(form.designerSchemaKey),
            enabled: !!form.enabled,
            sortOrder: Number(form.sortOrder) || 0
          }
          const res = await createTemplateType(payload)
          if (!res?.data?.success) {
            ElMessage.error(res?.data?.message || t('templateTypes.msgCreateFailed'))
            return
          }
          ElMessage.success(t('templateTypes.msgCreated'))
        } else {
          const payload = {
            name: (form.name || '').trim(),
            description:
              form.description == null || String(form.description).trim() === ''
                ? ''
                : String(form.description).trim(),
            strategyKey: trimOrNull(form.strategyKey),
            designerSchemaKey: trimOrNull(form.designerSchemaKey),
            sortOrder: Number(form.sortOrder) || 0,
            enabled: !!form.enabled
          }
          const res = await updateTemplateType(form.id, payload)
          if (!res?.data?.success) {
            ElMessage.error(res?.data?.message || t('templateTypes.msgUpdateFailed'))
            return
          }
          ElMessage.success(t('templateTypes.msgUpdated'))
        }
        dialogVisible.value = false
        await fetchList()
      } catch (e) {
        ElMessage.error(e?.response?.data?.message || e.message || t('templateTypes.msgSaveFailed'))
      } finally {
        saving.value = false
      }
    }

    async function onEnabledSwitch(row, enabled) {
      row._toggling = true
      try {
        const res = await setTemplateTypeEnabled(row.id, enabled)
        if (!res?.data?.success) {
          ElMessage.error(res?.data?.message || t('templateTypes.msgStatusFailed'))
          await fetchList()
          return
        }
        ElMessage.success(enabled ? t('templateTypes.msgEnabled') : t('templateTypes.msgDisabled'))
        await fetchList()
      } catch (e) {
        ElMessage.error(e?.response?.data?.message || e.message || t('templateTypes.msgStatusFailed'))
        await fetchList()
      } finally {
        row._toggling = false
      }
    }

    async function confirmDelete(row) {
      try {
        await ElMessageBox.confirm(
          t('templateTypes.confirmDeleteBody', { code: row.code }),
          t('templateTypes.confirmDeleteTitle'),
          {
            confirmButtonText: t('templateTypes.confirmDeleteOk'),
            cancelButtonText: t('common.cancel'),
            type: 'warning'
          }
        )
      } catch {
        return
      }
      try {
        const res = await deleteTemplateType(row.id)
        if (!res?.data?.success) {
          ElMessage.error(res?.data?.message || t('templateTypes.msgDeleteFailed'))
          return
        }
        ElMessage.success(t('templateTypes.msgDeleted'))
        await fetchList()
      } catch (e) {
        ElMessage.error(e?.response?.data?.message || e.message || t('templateTypes.msgDeleteFailed'))
      }
    }

    onMounted(() => {
      keywordApplied.value = keyword.value
      fetchList()
    })

    return {
      t,
      keyword,
      keywordApplied,
      loading,
      dialogVisible,
      isCreate,
      saving,
      form,
      currentPage,
      pageSize,
      sortedRows,
      pagedRows,
      openCreate,
      openEdit,
      submitForm,
      onEnabledSwitch,
      confirmDelete,
      resetForm,
      fetchList,
      handleSortChange,
      applySearch,
      onSearchClear,
      onPageSizeChange
    }
  }
}
</script>

<style scoped>
.template-types-page {
  background: #fff;
  padding: 18px;
  border-radius: 8px;
}

.header {
  margin-bottom: 14px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header h1 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
}

.toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
}

.toolbar-search {
  margin-bottom: 4px;
}

.toolbar-label {
  font-size: 14px;
  color: #606266;
  white-space: nowrap;
}

.search-input {
  max-width: 420px;
  flex: 1;
  min-width: 220px;
}

.pagination-wrap {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}
</style>
