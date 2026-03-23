<template>
  <div class="page-container">
    <el-card>
      <template #header>
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <span style="font-weight: 600; font-size: 16px;">消息监听</span>
          <el-button type="primary" size="small" @click="showAddDialog">
            <el-icon><Plus /></el-icon> 添加监听群
          </el-button>
        </div>
      </template>

      <div v-loading="loading">
        <el-table :data="listenList" border stripe>
          <el-table-column prop="chat_id" label="群ID" min-width="200" />
          <el-table-column prop="chat_name" label="群名" min-width="200" />
          <el-table-column prop="platform" label="平台" width="100">
            <template #default="{ row }">
              <el-tag size="small">{{ row.platform }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="监听" width="80" align="center">
            <template #default="{ row }">
              <el-switch v-model="row.enable" @change="toggleListen(row)" />
            </template>
          </el-table-column>
          <el-table-column label="操作" width="80" align="center">
            <template #default="{ row, $index }">
              <el-button type="danger" size="small" text @click="removeItem($index)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-empty v-if="listenList.length === 0 && !loading" description="暂无监听群" />
      </div>
    </el-card>

    <!-- 添加弹窗 -->
    <el-dialog v-model="addDialogVisible" title="添加监听群" width="440px">
      <el-form :model="addForm" label-width="80px">
        <el-form-item label="群ID" required>
          <el-input v-model="addForm.chat_id" placeholder="输入群ID" />
        </el-form-item>
        <el-form-item label="群名">
          <el-input v-model="addForm.chat_name" placeholder="群名称（可选）" />
        </el-form-item>
        <el-form-item label="平台">
          <el-input v-model="addForm.platform" placeholder="平台（可选）" />
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
const listenList = ref<any[]>([])
const addDialogVisible = ref(false)
const addForm = reactive({ chat_id: '', chat_name: '', platform: '' })

async function loadListens() {
  loading.value = true
  try {
    const res: any = await getStorage('sillyGirl.listen')
    const val = res.data?.['sillyGirl.listen']
    if (val) {
      listenList.value = val.split('\n').filter((s: string) => s.trim()).map((item: string) => {
        const parts = item.split('|')
        return {
          chat_id: parts[0] || '',
          chat_name: parts[1] || '',
          platform: parts[2] || '',
          enable: parts[3] !== 'false',
          raw: item,
        }
      })
    } else {
      listenList.value = []
    }
  } catch {} finally {
    loading.value = false
  }
}

async function saveListens() {
  const value = listenList.value
    .map(item => `${item.chat_id}|${item.chat_name}|${item.platform}|${item.enable ? 'true' : 'false'}`)
    .join('\n')
  await updateStorage({ 'sillyGirl.listen': value })
}

function showAddDialog() {
  addForm.chat_id = ''
  addForm.chat_name = ''
  addForm.platform = ''
  addDialogVisible.value = true
}

async function handleAdd() {
  if (!addForm.chat_id) {
    ElMessage.warning('请输入群ID')
    return
  }
  adding.value = true
  try {
    listenList.value.push({ ...addForm, enable: true })
    await saveListens()
    ElMessage.success('添加成功')
    addDialogVisible.value = false
  } catch {} finally {
    adding.value = false
  }
}

async function toggleListen(row: any) {
  try {
    await saveListens()
    ElMessage.success(row.enable ? '已开启监听' : '已关闭监听')
  } catch {}
}

async function removeItem(index: number) {
  listenList.value.splice(index, 1)
  try {
    await saveListens()
    ElMessage.success('删除成功')
  } catch {}
}

onMounted(() => {
  loadListens()
})
</script>
