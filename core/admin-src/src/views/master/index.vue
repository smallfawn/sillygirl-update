<template>
  <div class="page-container">
    <el-card>
      <template #header>
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <span style="font-weight: 600; font-size: 16px;">管理员管理</span>
          <el-button type="primary" size="small" @click="showDialog()">
            <el-icon><Plus /></el-icon> 添加管理员
          </el-button>
        </div>
      </template>

      <el-table :data="masterList" border stripe v-loading="loading">
        <el-table-column prop="platform" label="平台" width="100">
          <template #default="{ row }">
            <el-tag size="small">{{ row.platform }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="nickname" label="昵称" min-width="150" />
        <el-table-column prop="number" label="用户ID" min-width="200" />
        <el-table-column label="操作" width="80" align="center">
          <template #default="{ row }">
            <el-button type="danger" size="small" text @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-if="masterList.length === 0 && !loading" description="暂无管理员" />
    </el-card>

    <!-- 添加弹窗 -->
    <el-dialog v-model="dialogVisible" title="添加管理员" width="440px">
      <el-form :model="addForm" label-width="80px">
        <el-form-item label="用户ID" required>
          <el-input v-model="addForm.number" placeholder="用户/群号码" />
        </el-form-item>
        <el-form-item label="平台">
          <el-select v-model="addForm.platform" placeholder="选择平台（可自动推断）" clearable>
            <el-option v-for="p in platformOptions" :key="p.value" :label="p.label" :value="p.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="昵称">
          <el-input v-model="addForm.nickname" placeholder="昵称（可选）" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="adding" @click="handleAdd">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { getMasterList, addMaster, deleteMaster } from '@/api/master'

const loading = ref(false)
const adding = ref(false)
const masterList = ref<any[]>([])
const platformOptions = ref<{ label: string; value: string }[]>([])
const dialogVisible = ref(false)

const addForm = reactive({
  number: '',
  platform: '',
  nickname: '',
})

async function loadData() {
  loading.value = true
  try {
    const res: any = await getMasterList()
    masterList.value = res.data || []
    platformOptions.value = res.platforms || []
  } catch {} finally {
    loading.value = false
  }
}

function showDialog() {
  addForm.number = ''
  addForm.platform = ''
  addForm.nickname = ''
  dialogVisible.value = true
}

async function handleAdd() {
  if (!addForm.number) {
    ElMessage.warning('请输入用户ID')
    return
  }
  adding.value = true
  try {
    await addMaster({ ...addForm })
    ElMessage.success('添加成功')
    dialogVisible.value = false
    loadData()
  } catch {} finally {
    adding.value = false
  }
}

async function handleDelete(row: any) {
  try {
    await ElMessageBox.confirm(`确定删除管理员「${row.nickname || row.number}」？`, '警告', { type: 'warning' })
    await deleteMaster({ number: row.number, platform: row.platform })
    ElMessage.success('删除成功')
    loadData()
  } catch { /* 取消 */ }
}

onMounted(() => {
  loadData()
})
</script>
