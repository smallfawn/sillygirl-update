<template>
  <div class="page-container">
    <el-card>
      <template #header>
        <span style="font-weight: 600; font-size: 16px;">插件发布</span>
      </template>

      <el-form :model="config" label-width="120px" style="max-width: 500px;" v-loading="loading">
        <el-form-item label="协议">
          <el-select v-model="config.protocol" placeholder="选择协议">
            <el-option label="HTTP" value="http" />
            <el-option label="HTTPS" value="https" />
          </el-select>
        </el-form-item>
        <el-form-item label="域名">
          <el-input v-model="config.domain" placeholder="例如: example.com" />
        </el-form-item>
        <el-form-item label="端口">
          <el-input-number v-model="config.port" :min="1" :max="65535" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="saving" @click="saveConfig">保存配置</el-button>
        </el-form-item>
      </el-form>

      <el-divider />

      <div style="max-width: 500px;">
        <h4>订阅链接</h4>
        <el-input
          :model-value="subscribeUrl"
          readonly
          style="margin-top: 8px;"
        >
          <template #append>
            <el-button @click="copyUrl">复制</el-button>
          </template>
        </el-input>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getStorage, updateStorage } from '@/api/storage'

const loading = ref(false)
const saving = ref(false)

const config = reactive({
  protocol: 'http',
  domain: '',
  port: 8080,
})

const subscribeUrl = computed(() => {
  if (!config.domain) return ''
  const port = (config.protocol === 'http' && config.port === 80) ||
                (config.protocol === 'https' && config.port === 443)
    ? '' : `:${config.port}`
  return `${config.protocol}://${config.domain}${port}/admin/api/plugins/list.json`
})

async function loadConfig() {
  loading.value = true
  try {
    const res: any = await getStorage('sillyGirl.host,sillyGirl.port')
    if (res.data) {
      config.domain = res.data['sillyGirl.host'] || ''
      config.port = Number(res.data['sillyGirl.port']) || 8080
    }
  } catch {} finally {
    loading.value = false
  }
}

async function saveConfig() {
  saving.value = true
  try {
    await updateStorage({
      'sillyGirl.host': config.domain,
      'sillyGirl.port': config.port,
    })
    ElMessage.success('保存成功')
  } catch {} finally {
    saving.value = false
  }
}

function copyUrl() {
  if (!subscribeUrl.value) {
    ElMessage.warning('请先填写域名')
    return
  }
  navigator.clipboard.writeText(subscribeUrl.value).then(() => {
    ElMessage.success('已复制到剪贴板')
  }).catch(() => {
    ElMessage.error('复制失败')
  })
}

onMounted(() => {
  loadConfig()
})
</script>
