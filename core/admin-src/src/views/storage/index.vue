<template>
  <div class="page-container">
    <el-card>
      <template #header>
        <span style="font-weight: 600; font-size: 16px;">存储管理</span>
      </template>

      <div class="search-bar">
        <el-input
          v-model="searchKeys"
          placeholder="输入 Bucket 名或 Bucket.Key 搜索"
          style="width: 320px;"
          clearable
          @clear="loadData"
          @keyup.enter="loadData"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-button type="primary" @click="loadData">搜索</el-button>
      </div>

      <el-table :data="tableData" border stripe v-loading="loading" style="width: 100%;">
        <el-table-column type="index" label="#" width="50" />
        <el-table-column prop="bucket" label="Bucket" width="180" sortable />
        <el-table-column prop="key" label="Key" width="200" sortable />
        <el-table-column prop="value" label="Value" min-width="300" show-overflow-tooltip />
        <el-table-column label="操作" width="180" align="center" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" text @click="editRow(row)">编辑</el-button>
            <el-button type="danger" size="small" text @click="deleteRow(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="current"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[20, 50, 100]"
          layout="total, sizes, prev, pager, next"
          @size-change="loadData"
          @current-change="loadData"
        />
      </div>
    </el-card>

    <!-- 编辑弹窗 -->
    <el-dialog v-model="editDialogVisible" title="编辑存储项" width="520px">
      <el-form :model="editForm" label-width="100px">
        <el-form-item label="Bucket">
          <el-input v-model="editForm.bucket" disabled />
        </el-form-item>
        <el-form-item label="Key">
          <el-input v-model="editForm.key" disabled />
        </el-form-item>
        <el-form-item label="Value">
          <el-input
            v-model="editForm.value"
            type="textarea"
            :rows="6"
            placeholder="输入值"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="saveEdit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import { getStorageList, updateStorage, deleteStorage } from '@/api/storage'

const loading = ref(false)
const saving = ref(false)
const searchKeys = ref('')
const tableData = ref<any[]>([])
const current = ref(1)
const pageSize = ref(20)
const total = ref(0)

const editDialogVisible = ref(false)
const editForm = reactive({
  bucket: '',
  key: '',
  value: '',
})

async function loadData() {
  loading.value = true
  try {
    const res: any = await getStorageList(current.value, pageSize.value, searchKeys.value)
    tableData.value = res.data || []
    total.value = res.total || 0
  } catch {} finally {
    loading.value = false
  }
}

function editRow(row: any) {
  editForm.bucket = row.bucket
  editForm.key = row.key
  editForm.value = row.value
  editDialogVisible.value = true
}

async function saveEdit() {
  saving.value = true
  try {
    await updateStorage({
      [`${editForm.bucket}.${editForm.key}`]: editForm.value,
    })
    ElMessage.success('保存成功')
    editDialogVisible.value = false
    loadData()
  } catch {} finally {
    saving.value = false
  }
}

async function deleteRow(row: any) {
  try {
    await ElMessageBox.confirm(
      `确定删除 ${row.bucket}.${row.key}？`,
      '警告',
      { type: 'warning' }
    )
    await deleteStorage(`${row.bucket}.${row.key}`)
    ElMessage.success('删除成功')
    loadData()
  } catch { /* 取消 */ }
}

onMounted(() => {
  loadData()
})
</script>
