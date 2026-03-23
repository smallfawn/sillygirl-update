<template>
  <div class="page-container">
    <el-card>
      <template #header>
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <span style="font-weight: 600; font-size: 16px;">回复管理</span>
          <el-button type="primary" size="small" @click="showDialog()">
            <el-icon><Plus /></el-icon> 新增规则
          </el-button>
        </div>
      </template>

      <div class="search-bar">
        <el-input v-model="filters.keyword" placeholder="关键词" style="width: 160px;" clearable @keyup.enter="loadData" />
        <el-input v-model="filters.value" placeholder="回复内容" style="width: 160px;" clearable @keyup.enter="loadData" />
        <el-input v-model="filters.number" placeholder="号码" style="width: 160px;" clearable @keyup.enter="loadData" />
        <el-button type="primary" @click="loadData">搜索</el-button>
        <el-button @click="resetFilters">重置</el-button>
      </div>

      <el-table :data="tableData" border stripe v-loading="loading">
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column prop="keyword" label="关键词" min-width="200" show-overflow-tooltip />
        <el-table-column prop="value" label="回复内容" min-width="250" show-overflow-tooltip />
        <el-table-column prop="priority" label="优先级" width="80" sortable />
        <el-table-column prop="platforms" label="平台" width="120">
          <template #default="{ row }">
            <el-tag v-for="p in row.platforms" :key="p" size="small" style="margin: 2px;">{{ p }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="number" label="号码" width="140" />
        <el-table-column label="操作" width="140" align="center" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" text @click="showDialog(row)">编辑</el-button>
            <el-button type="danger" size="small" text @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="current"
          :page-size="20"
          :total="total"
          layout="total, prev, pager, next"
          @current-change="loadData"
        />
      </div>
    </el-card>

    <!-- 编辑弹窗 -->
    <el-dialog v-model="dialogVisible" :title="editForm.id ? '编辑规则' : '新增规则'" width="560px">
      <el-form :model="editForm" label-width="80px">
        <el-form-item label="关键词" required>
          <el-input v-model="editForm.keyword" placeholder="支持正则表达式" />
        </el-form-item>
        <el-form-item label="回复内容" required>
          <el-input v-model="editForm.value" type="textarea" :rows="4" placeholder="回复内容" />
        </el-form-item>
        <el-form-item label="优先级">
          <el-input-number v-model="editForm.priority" :min="0" :max="999" />
        </el-form-item>
        <el-form-item label="平台">
          <el-checkbox-group v-model="editForm.platforms">
            <el-checkbox v-for="p in platforms" :key="p.value" :label="p.value">{{ p.label }}</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        <el-form-item label="号码">
          <el-input v-model="editForm.number" placeholder="用户/群号码（可选）" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { getReplyList, saveReply, deleteReply } from '@/api/reply'

const loading = ref(false)
const saving = ref(false)
const current = ref(1)
const total = ref(0)
const tableData = ref<any[]>([])
const platforms = ref<{ label: string; value: string }[]>([])
const dialogVisible = ref(false)

const filters = reactive({ keyword: '', value: '', number: '' })
const editForm = reactive({
  id: 0,
  keyword: '',
  value: '',
  priority: 0,
  platforms: [] as string[],
  number: '',
  nickname: '',
})

async function loadData() {
  loading.value = true
  try {
    const res: any = await getReplyList(current.value, 20, {
      keyword: filters.keyword || undefined,
      value: filters.value || undefined,
      number: filters.number || undefined,
    })
    tableData.value = res.data || []
    total.value = res.total || 0
    platforms.value = res.platforms || []
  } catch {} finally {
    loading.value = false
  }
}

function resetFilters() {
  filters.keyword = ''
  filters.value = ''
  filters.number = ''
  current.value = 1
  loadData()
}

function showDialog(row?: any) {
  if (row) {
    editForm.id = row.id
    editForm.keyword = row.keyword
    editForm.value = row.value
    editForm.priority = row.priority
    editForm.platforms = [...(row.platforms || [])]
    editForm.number = row.number
    editForm.nickname = row.nickname
  } else {
    editForm.id = 0
    editForm.keyword = ''
    editForm.value = ''
    editForm.priority = 0
    editForm.platforms = []
    editForm.number = ''
    editForm.nickname = ''
  }
  dialogVisible.value = true
}

async function handleSave() {
  if (!editForm.keyword || !editForm.value) {
    ElMessage.warning('关键词和回复内容不能为空')
    return
  }
  saving.value = true
  try {
    await saveReply({ ...editForm })
    ElMessage.success(editForm.id ? '更新成功' : '创建成功')
    dialogVisible.value = false
    loadData()
  } catch {} finally {
    saving.value = false
  }
}

async function handleDelete(row: any) {
  try {
    await ElMessageBox.confirm('确定删除该规则？', '警告', { type: 'warning' })
    await deleteReply(row.id)
    ElMessage.success('删除成功')
    loadData()
  } catch { /* 取消 */ }
}

onMounted(() => {
  loadData()
})
</script>
