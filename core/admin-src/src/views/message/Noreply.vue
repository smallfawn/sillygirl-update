<template>
  <div class="page-container">
    <el-card>
      <template #header>
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <span style="font-weight: 600; font-size: 16px;">不回复群</span>
          <el-button type="primary" size="small" @click="showAddDialog">
            <el-icon><Plus /></el-icon> 添加
          </el-button>
        </div>
      </template>

      <div v-loading="loading">
        <el-table :data="noreplyList" border stripe>
          <el-table-column type="index" label="#" width="50" />
          <el-table-column prop="item" label="群ID / 信息" min-width="300" />
          <el-table-column label="操作" width="80" align="center">
            <template #default="{ $index }">
              <el-button type="danger" size="small" text @click="removeItem($index)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-empty v-if="noreplyList.length === 0 && !loading" description="暂无不回复群" />
      </div>
    </el-card>

    <el-dialog v-model="addDialogVisible" title="添加不回复群" width="440px">
      <el-form :model="addForm" label-width="80px">
        <el-form-item label="群ID" required>
          <el-input v-model="addForm.item" placeholder="输入群ID" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="adding" @click="handleAdd">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { getStorage, updateStorage } from '@/api/storage'

const loading = ref(false)
const adding = ref(false)
const noreplyList = ref<string[]>([])
const addDialogVisible = ref(false)
const addForm = reactive({ item: '' })

async function loadData() {
  loading.value = true
  try {
    const res: any = await getStorage('sillyGirl.noreply')
    const val = res.data?.['sillyGirl.noreply']
    noreplyList.value = val ? val.split('\n').filter((s: string) => s.trim()) : []
  } catch {} finally {
    loading.value = false
  }
}

async function saveData() {
  await updateStorage({ 'sillyGirl.noreply': noreplyList.value.join('\n') })
}

function showAddDialog() {
  addForm.item = ''
  addDialogVisible.value = true
}

async function handleAdd() {
  if (!addForm.item.trim()) {
    ElMessage.warning('请输入群ID')
    return
  }
  adding.value = true
  try {
    noreplyList.value.push(addForm.item.trim())
    await saveData()
    ElMessage.success('添加成功')
    addDialogVisible.value = false
  } catch {} finally {
    adding.value = false
  }
}

async function removeItem(index: number) {
  noreplyList.value.splice(index, 1)
  try {
    await saveData()
    ElMessage.success('删除成功')
  } catch {}
}

onMounted(() => {
  loadData()
})
</script>
