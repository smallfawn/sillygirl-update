<template>
  <div class="page-container">
    <el-card>
      <template #header>
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <span style="font-weight: 600; font-size: 16px;">代理管理</span>
          <el-button type="primary" size="small" @click="showDialog()">
            <el-icon><Plus /></el-icon> 新增代理
          </el-button>
        </div>
      </template>

      <el-table :data="proxyList" border stripe v-loading="loading">
        <el-table-column prop="name" label="名称" min-width="120" />
        <el-table-column prop="type" label="类型" width="100">
          <template #default="{ row }">
            <el-tag size="small">{{ row.type }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="address" label="地址" min-width="200" show-overflow-tooltip />
        <el-table-column prop="remark" label="备注" min-width="120" show-overflow-tooltip />
        <el-table-column label="操作" width="140" align="center" fixed="right">
          <template #default="{ row, $index }">
            <el-button type="primary" size="small" text @click="showDialog(row, $index)">编辑</el-button>
            <el-button type="danger" size="small" text @click="handleDelete($index)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-divider />

      <h4 style="margin-bottom: 12px;">路由规则</h4>
      <div class="search-bar">
        <el-input v-model="ruleKeyword" placeholder="搜索域名规则" style="width: 250px;" clearable @keyup.enter="loadRules" />
        <el-button type="primary" @click="loadRules">搜索</el-button>
      </div>
      <el-table :data="ruleList" border stripe v-loading="rulesLoading" max-height="300">
        <el-table-column prop="domain" label="域名" min-width="200" />
        <el-table-column prop="proxy" label="代理" min-width="200" show-overflow-tooltip />
      </el-table>
    </el-card>

    <!-- 代理编辑弹窗 -->
    <el-dialog v-model="dialogVisible" :title="editIndex >= 0 ? '编辑代理' : '新增代理'" width="520px">
      <el-form :model="editForm" label-width="80px">
        <el-form-item label="名称" required>
          <el-input v-model="editForm.name" placeholder="代理名称" />
        </el-form-item>
        <el-form-item label="类型" required>
          <el-select v-model="editForm.type" placeholder="选择代理类型">
            <el-option label="HTTP" value="http" />
            <el-option label="Socks5" value="socks5" />
            <el-option label="Trojan" value="trojan" />
            <el-option label="Vmess" value="vmess" />
            <el-option label="SS" value="ss" />
          </el-select>
        </el-form-item>
        <el-form-item label="地址" required>
          <el-input v-model="editForm.address" placeholder="代理地址（含端口）" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="editForm.remark" type="textarea" :rows="2" />
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
import { ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { getStorage, updateStorage } from '@/api/storage'
import { getProxyRules } from '@/api/plugin'

const loading = ref(false)
const saving = ref(false)
const rulesLoading = ref(false)
const proxyList = ref<any[]>([])
const ruleList = ref<any[]>([])
const ruleKeyword = ref('')
const dialogVisible = ref(false)
const editIndex = ref(-1)

const editForm = reactive({
  name: '',
  type: 'http',
  address: '',
  remark: '',
})

async function loadProxies() {
  loading.value = true
  try {
    const res: any = await getStorage('proxy.')
    const data = res.data
    proxyList.value = []
    if (data) {
      let i = 0
      while (data[`proxy.${i}`]) {
        const raw = data[`proxy.${i}`]
        const parts = String(raw).split('|')
        proxyList.value.push({
          name: parts[0] || '',
          type: parts[1] || 'http',
          address: parts[2] || '',
          remark: parts[3] || '',
          raw: raw,
        })
        i++
      }
    }
  } catch {} finally {
    loading.value = false
  }
}

async function saveProxies() {
  const data: Record<string, string> = {}
  proxyList.value.forEach((p, i) => {
    data[`proxy.${i}`] = `${p.name}|${p.type}|${p.address}|${p.remark}`
  })
  // 清除多余的
  for (let i = proxyList.value.length; i < 100; i++) {
    data[`proxy.${i}`] = ''
  }
  await updateStorage(data)
}

function showDialog(row?: any, index?: number) {
  if (row) {
    editForm.name = row.name
    editForm.type = row.type
    editForm.address = row.address
    editForm.remark = row.remark
    editIndex.value = index ?? -1
  } else {
    editForm.name = ''
    editForm.type = 'http'
    editForm.address = ''
    editForm.remark = ''
    editIndex.value = -1
  }
  dialogVisible.value = true
}

async function handleSave() {
  if (!editForm.name || !editForm.address) {
    ElMessage.warning('名称和地址不能为空')
    return
  }
  saving.value = true
  try {
    const item = { ...editForm }
    if (editIndex.value >= 0) {
      proxyList.value[editIndex.value] = item
    } else {
      proxyList.value.push(item)
    }
    await saveProxies()
    ElMessage.success('保存成功')
    dialogVisible.value = false
  } catch {} finally {
    saving.value = false
  }
}

async function handleDelete(index: number) {
  proxyList.value.splice(index, 1)
  try {
    await saveProxies()
    ElMessage.success('删除成功')
  } catch {}
}

async function loadRules() {
  rulesLoading.value = true
  try {
    const res: any = await getProxyRules(ruleKeyword.value || undefined)
    const data = res.data || {}
    ruleList.value = Object.entries(data).map(([domain, proxy]) => ({
      domain,
      proxy,
    }))
  } catch {} finally {
    rulesLoading.value = false
  }
}

onMounted(() => {
  loadProxies()
  loadRules()
})
</script>
