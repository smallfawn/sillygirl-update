<template>
  <div class="page-container">
    <el-card>
      <template #header>
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <span style="font-weight: 600; font-size: 16px;">插件订阅</span>
          <el-button type="primary" size="small" @click="showAddDialog">
            <el-icon><Plus /></el-icon> 添加订阅
          </el-button>
        </div>
      </template>

      <div v-loading="loading">
        <el-table :data="subscriptions" border stripe>
          <el-table-column prop="address" label="订阅地址" />
          <el-table-column label="操作" width="100" align="center">
            <template #default="{ row }">
              <el-button type="danger" size="small" text @click="removeSubscription(row)">
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-empty v-if="subscriptions.length === 0 && !loading" description="暂无订阅源" />
      </div>

      <!-- 添加订阅弹窗 -->
      <el-dialog v-model="addDialogVisible" title="添加订阅源" width="480px">
        <el-form :model="addForm" label-width="80px">
          <el-form-item label="订阅地址">
            <el-input v-model="addForm.address" placeholder="sub:// 或 http(s):// 开头的订阅地址" />
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="addDialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="adding" @click="addSubscription">确定</el-button>
        </template>
      </el-dialog>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { getStorage, updateStorage } from '@/api/storage'

const loading = ref(false)
const adding = ref(false)
const subscriptions = ref<string[]>([])
const addDialogVisible = ref(false)
const addForm = reactive({ address: '' })

async function loadSubscriptions() {
  loading.value = true
  try {
    const res: any = await getStorage('sillyGirl.subscribe')
    const val = res.data?.['sillyGirl.subscribe']
    if (val) {
      subscriptions.value = val.split('\n').filter((s: string) => s.trim())
    }
  } catch {} finally {
    loading.value = false
  }
}

function showAddDialog() {
  addForm.address = ''
  addDialogVisible.value = true
}

async function addSubscription() {
  if (!addForm.address.trim()) {
    ElMessage.warning('请输入订阅地址')
    return
  }
  adding.value = true
  try {
    subscriptions.value.push(addForm.address.trim())
    await updateStorage({
      'sillyGirl.subscribe': subscriptions.value.join('\n'),
    })
    ElMessage.success('添加成功')
    addDialogVisible.value = false
  } catch {} finally {
    adding.value = false
  }
}

async function removeSubscription(row: { address: string }) {
  subscriptions.value = subscriptions.value.filter(s => s !== row.address)
  try {
    await updateStorage({
      'sillyGirl.subscribe': subscriptions.value.join('\n'),
    })
    ElMessage.success('删除成功')
  } catch {}
}

onMounted(() => {
  loadSubscriptions()
})
</script>
